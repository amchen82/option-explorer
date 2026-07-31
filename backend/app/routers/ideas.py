from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.engine.ideas import generate_ideas
from app.engine.narrative import explain_volatility, market_bias
from app.engine.technicals import earnings_days_away
from app.schemas.ideas import IdeasResponse
from app.services.market_data import MarketDataService
from app.services.option_chain import get_option_chain

router = APIRouter(prefix="/ideas", tags=["ideas"])
market_data_svc = MarketDataService()

_SYMBOL_PATTERN = re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$")

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
):
    """Ranked option trade ideas for one ticker, with the reasoning behind each."""
    normalized = symbol.strip().upper()

    if not _SYMBOL_PATTERN.match(normalized):
        raise HTTPException(status_code=400, detail=f"'{symbol}' is not a valid ticker symbol.")

    quote = market_data_svc.get_stock_quote(normalized)
    signals = market_data_svc.get_market_signals(normalized)

    spot = float(quote.get("price") or 0.0)
    if spot <= 0:
        raise HTTPException(status_code=404, detail=f"No market data available for '{normalized}'.")

    combined = {
        **quote,
        **signals,
        "price": spot,
        "earnings_days_away": earnings_days_away(_normalize_earnings_date(quote.get("earnings_date"))),
    }

    view = market_bias(combined)
    volatility = explain_volatility(combined)

    chain = get_option_chain(
        symbol=normalized,
        spot=spot,
        iv_estimate=float(signals.get("current_iv", 0.30)),
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
