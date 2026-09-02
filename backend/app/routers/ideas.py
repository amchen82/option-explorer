from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.engine.ideas import generate_ideas
from app.engine.narrative import explain_volatility, market_bias
from app.engine.options_math import iv_rank
from app.engine.technicals import earnings_days_away
from app.schemas.ideas import IdeasResponse, QuotePreview
from app.services.market_data import MarketDataService
from app.services.option_chain import atm_implied_volatility, get_option_chain

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ideas", tags=["ideas"])
market_data_svc = MarketDataService()

_SYMBOL_PATTERN = re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$")

# Approximate target days-to-expiration for each user-facing bucket.
# get_option_chain() picks the closest expiration Yahoo actually lists, so
# these are aim points, not guarantees. "1m" (35d) matches the prior
# unconditional default, so existing behavior is unchanged when the caller
# omits the expiration param.
EXPIRATION_BUCKETS: dict[str, int] = {
    "0d": 0,
    "1w": 7,
    "2w": 14,
    "1m": 35,
    "3m": 90,
    "6m": 180,
    "12m": 365,
    # Not "12m+": a literal "+" in a query string is decoded as a space by
    # naive clients (curl, a hand-typed URL, form-encoded requests), which
    # would silently turn this into "12m " and 400. URLSearchParams escapes
    # it correctly, but there is no reason to rely on that.
    "gt12m": 545,
}

DISCLAIMER = (
    "Educational tool only. These are illustrative ideas generated from public market data, "
    "not financial advice or a recommendation to trade."
)


def _normalize_earnings_date(raw: Any) -> str | None:
    """yfinance returns earnings dates in several shapes. Reduce to an ISO string."""
    if raw is None:
        return None

    if isinstance(raw, (list, tuple)):
        raw = raw[0] if raw else None
        if raw is None:
            return None

    if isinstance(raw, str):
        return raw[:10]

    for attribute in ("date", "isoformat"):
        method = getattr(raw, attribute, None)
        if callable(method):
            try:
                return str(method())[:10]
            except Exception:
                return None

    return None


@router.get("/{symbol}", response_model=IdeasResponse)
def get_ideas(
    symbol: str,
    shares: int = Query(default=0, ge=0, description="Shares already owned, to mark stock-requiring ideas available"),
    expiration: str = Query(
        default="1m",
        description=f"How far out to look for expirations. One of: {', '.join(EXPIRATION_BUCKETS)}",
    ),
):
    """Ranked option trade ideas for one ticker, with the reasoning behind each."""
    normalized = symbol.strip().upper()
    logger.info("[%s] GET /ideas — shares=%d expiration=%s", normalized, shares, expiration)

    if not _SYMBOL_PATTERN.match(normalized):
        raise HTTPException(status_code=400, detail=f"'{symbol}' is not a valid ticker symbol.")

    if expiration not in EXPIRATION_BUCKETS:
        raise HTTPException(
            status_code=400,
            detail=f"'{expiration}' is not a valid expiration. Choose one of: {', '.join(EXPIRATION_BUCKETS)}.",
        )

    quote = market_data_svc.get_stock_quote(normalized)
    signals = market_data_svc.get_market_signals(normalized)

    spot = float(quote.get("price") or 0.0)
    if spot <= 0:
        raise HTTPException(status_code=404, detail=f"No market data available for '{normalized}'.")
    logger.debug("[%s] quote=%s signals=%s", normalized, quote, signals)

    combined = {
        **quote,
        **signals,
        "price": spot,
        "earnings_days_away": earnings_days_away(_normalize_earnings_date(quote.get("earnings_date"))),
    }

    view = market_bias(combined)

    chain = get_option_chain(
        symbol=normalized,
        spot=spot,
        iv_estimate=float(signals.get("current_iv", 0.30)),
        target_dte=EXPIRATION_BUCKETS[expiration],
    )

    # Tier 1 of the current_iv fallback chain: a live chain's own ATM implied
    # volatility beats the pre-chain, history-only estimate market_data
    # computed above. Refine before generating the narrative and the ideas
    # themselves, so both benefit from the more accurate reading. Tracked
    # explicitly as current_iv_source so the UI can badge which one a user
    # is actually looking at, rather than silently presenting an estimate
    # with the same confidence as a real market quote.
    current_iv_source = "estimated"
    if chain.data_quality == "live":
        atm_iv = atm_implied_volatility(chain, spot, reference_vol=float(signals.get("hv_20", 0.0)))
        if atm_iv is not None and atm_iv > 0:
            logger.debug(
                "[%s] refining current_iv: pre-chain=%s -> live ATM=%s (pre-chain iv_rank=%s)",
                normalized,
                signals.get("current_iv"),
                atm_iv,
                signals.get("iv_rank"),
            )
            combined["current_iv"] = atm_iv
            combined["iv_rank"] = iv_rank(atm_iv, float(signals.get("iv_low", 0.0)), float(signals.get("iv_high", 0.0)))
            current_iv_source = "live"
        else:
            logger.debug("[%s] live chain has no usable ATM IV — keeping pre-chain current_iv", normalized)
    else:
        logger.debug("[%s] chain is modeled — keeping pre-chain current_iv", normalized)

    volatility = explain_volatility(combined)
    volatility["current_iv_source"] = current_iv_source
    logger.info(
        "[%s] final volatility: current_iv=%s iv_rank=%s regime=%s",
        normalized,
        volatility.get("current_iv"),
        volatility.get("iv_rank"),
        volatility.get("regime"),
    )

    ideas = generate_ideas(
        symbol=normalized,
        spot=spot,
        chain=chain,
        signals=combined,
        market_view=view,
        owned_shares=shares,
    )

    # The quote itself can be stale or synthetic even when the chain is live.
    data_quality = "modeled" if chain.data_quality == "modeled" or quote.get("stale") else "live"

    return {
        "symbol": normalized,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_quality": data_quality,
        "expiration": chain.expiration.isoformat(),
        "expiration_bucket": expiration,
        "dte": chain.dte,
        "quote": {
            "symbol": normalized,
            "price": round(spot, 2),
            "52w_high": quote.get("52w_high", 0.0),
            "52w_low": quote.get("52w_low", 0.0),
            "stale": bool(quote.get("stale", False)),
        },
        "market_view": view,
        "volatility": volatility,
        "ideas": ideas,
        "disclaimer": DISCLAIMER,
    }


@router.get("/{symbol}/quote", response_model=QuotePreview)
def get_quote_preview(symbol: str):
    """A minimal price preview for the ticker search box.

    Deliberately skips the option chain and market signals that GET /ideas/{symbol}
    computes — this is meant to be cheap enough to call on every keystroke.
    """
    normalized = symbol.strip().upper()

    if not _SYMBOL_PATTERN.match(normalized):
        raise HTTPException(status_code=400, detail=f"'{symbol}' is not a valid ticker symbol.")

    quote = market_data_svc.get_stock_quote(normalized)
    price = float(quote.get("price") or 0.0)
    if price <= 0:
        raise HTTPException(status_code=404, detail=f"No market data available for '{normalized}'.")

    return {
        "symbol": normalized,
        "price": round(price, 2),
        "stale": bool(quote.get("stale", False)),
    }
