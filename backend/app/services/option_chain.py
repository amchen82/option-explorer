from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta
import re
from typing import Any, Literal

import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import black_scholes_price

logger = logging.getLogger(__name__)

DataQuality = Literal["live", "modeled"]

RISK_FREE_RATE = 0.05

_cache: dict[str, dict[str, Any]] = {}


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] >= ttl:
        return None
    return entry["data"]


def _cache_set(key: str, data) -> None:
    _cache[key] = {"ts": time.time(), "data": data}


@dataclass(frozen=True)
class Contract:
    """A single normalized option contract."""

    symbol: str
    contract_type: str
    strike: float
    expiration: date
    bid: float
    ask: float
    last: float
    mid: float
    volume: int
    open_interest: int
    implied_volatility: float

    @property
    def spread_pct(self) -> float:
        """Bid/ask spread as a fraction of mid. Returns 1.0 when unquotable."""
        if self.mid <= 0 or self.ask <= 0 or self.bid <= 0:
            return 1.0
        return (self.ask - self.bid) / self.mid


@dataclass(frozen=True)
class ChainResult:
    symbol: str
    expiration: date
    dte: int
    calls: list[Contract]
    puts: list[Contract]
    data_quality: DataQuality


def _clean_float(value: Any, default: float = 0.0) -> float:
    if value is None or pd.isna(value):
        return default
    return float(value)


def _clean_int(value: Any) -> int:
    if value is None or pd.isna(value):
        return 0
    return int(value)


def _strike_interval(price: float) -> float:
    if price < 25:
        return 1.0
    if price < 100:
        return 2.5
    if price < 250:
        return 5.0
    return 10.0


_OCC_EXPIRATION_PATTERN = re.compile(r"(\d{6})[CP]\d{8}$")


def _expiration_from_chain(calls: pd.DataFrame, puts: pd.DataFrame) -> date | None:
    """Read the OCC expiration embedded in a yfinance contract symbol."""
    for frame in (calls, puts):
        if frame is None or frame.empty or "contractSymbol" not in frame:
            continue

        for symbol in frame["contractSymbol"].dropna():
            match = _OCC_EXPIRATION_PATTERN.search(str(symbol))
            if match is None:
                continue
            try:
                return datetime.strptime(match.group(1), "%y%m%d").date()
            except ValueError:
                continue
    return None


def _contracts_from_frame(frame: pd.DataFrame, symbol: str, contract_type: str, expiration: date) -> list[Contract]:
    if frame is None or frame.empty:
        return []

    contracts: list[Contract] = []

    for _, row in frame.iterrows():
        strike = _clean_float(row.get("strike"))
        if strike <= 0:
            continue

        bid = _clean_float(row.get("bid"))
        ask = _clean_float(row.get("ask"))
        last = _clean_float(row.get("lastPrice"))

        # A contract with neither a live book nor a last trade is untradeable noise.
        if bid <= 0 and last <= 0:
            continue

        mid = (bid + ask) / 2.0 if bid > 0 and ask > 0 else last

        # Without a live two-sided quote, Yahoo's impliedVolatility field is
        # a degenerate placeholder, not a real reading (observed live: a
        # suspicious doubling pattern across strikes when a whole chain's
        # bid/ask were 0). Every consumer downstream -- the ideas engine's
        # own delta-based strike selection, not just the ATM IV helper --
        # trusts this field directly, so it's sanitized once here rather
        # than patched at each call site.
        implied_volatility = _clean_float(row.get("impliedVolatility")) if bid > 0 and ask > 0 else 0.0

        contracts.append(
            Contract(
                symbol=symbol,
                contract_type=contract_type,
                strike=strike,
                expiration=expiration,
                bid=bid,
                ask=ask,
                last=last,
                mid=mid,
                volume=_clean_int(row.get("volume")),
                open_interest=_clean_int(row.get("openInterest")),
                implied_volatility=implied_volatility,
            )
        )

    contracts.sort(key=lambda contract: contract.strike)
    return contracts


def _modeled_chain(symbol: str, spot: float, iv: float, target_dte: int) -> ChainResult:
    """Synthesize a Black-Scholes strike ladder when live chains are unavailable.

    Always tagged data_quality="modeled" so callers can tell the user these are
    computed strikes rather than live market quotes.
    """
    today = date.today()
    expiration = today + pd.Timedelta(days=target_dte).to_pytimedelta()
    # Options list on Fridays; roll forward to the next one.
    expiration = expiration + pd.Timedelta(days=(4 - expiration.weekday()) % 7).to_pytimedelta()
    dte = (expiration - today).days
    time_to_expiry = max(dte, 1) / 365.0

    interval = _strike_interval(spot)
    lowest = max(interval, round(spot * 0.70 / interval) * interval)
    highest = round(spot * 1.30 / interval) * interval

    calls: list[Contract] = []
    puts: list[Contract] = []
    strike = lowest

    while strike <= highest:
        for contract_type, bucket in (("call", calls), ("put", puts)):
            price = black_scholes_price(spot, strike, time_to_expiry, RISK_FREE_RATE, iv, contract_type)
            price = round(float(price), 2)
            bucket.append(
                Contract(
                    symbol=symbol,
                    contract_type=contract_type,
                    strike=float(strike),
                    expiration=expiration,
                    bid=price,
                    ask=price,
                    last=price,
                    mid=price,
                    volume=0,
                    open_interest=0,
                    implied_volatility=iv,
                )
            )
        strike += interval

    return ChainResult(
        symbol=symbol,
        expiration=expiration,
        dte=dte,
        calls=calls,
        puts=puts,
        data_quality="modeled",
    )



# Real equity option IV is never this low; anything under it is almost
# certainly a stale or broken Yahoo quote (an empty/degenerate book that
# still carries a residual impliedVolatility field) rather than a genuine
# market read.
MIN_PLAUSIBLE_IV = 0.01

# A reading below this fraction of the stock's own recent realized vol is
# treated as broken too, not just genuinely cheap. Real IV can legitimately
# sit well under realized vol -- that's a real, if unusual, market signal --
# but not by more than an order of magnitude. Observed live: NVDA's chain
# returned 1.56% IV on its nearest strikes while its own 20-day realized vol
# was 45% (a ~29x gap, comfortably above MIN_PLAUSIBLE_IV, still garbage).
# This silently overrode a sound estimate and floor-clamped IV rank to 0.
MIN_IV_TO_REALIZED_VOL_RATIO = 0.15


def atm_implied_volatility(chain: ChainResult, spot: float, reference_vol: float | None = None) -> float | None:
    """The best real, market-quoted implied volatility a chain has to offer.

    Averages the nearest-to-the-money call and put IV when both sides have a
    usable quote; falls back to whichever single side does. Returns None
    when nothing in the chain has a usable IV, so callers can fall back to a
    non-market estimate instead.

    A quote is discarded (as a broken read, not a real market price) if it
    has no live two-sided quote (bid and ask both need to be > 0 — observed
    live: with markets closed, every contract's bid/ask go to 0 while
    lastPrice/volume/openInterest keep the prior session's values, and
    Yahoo's impliedVolatility field becomes a degenerate placeholder in that
    state), if it's below MIN_PLAUSIBLE_IV, or if it's below
    MIN_IV_TO_REALIZED_VOL_RATIO of *reference_vol* — typically the stock's
    own realized volatility, passed in by the caller since this module has
    no signals access of its own.
    """
    min_iv = MIN_PLAUSIBLE_IV
    if reference_vol and reference_vol > 0:
        min_iv = max(min_iv, reference_vol * MIN_IV_TO_REALIZED_VOL_RATIO)

    readings: list[float] = []

    for side, contracts in (("call", chain.calls), ("put", chain.puts)):
        usable = [
            contract
            for contract in contracts
            if contract.bid > 0 and contract.ask > 0 and contract.implied_volatility > min_iv
        ]
        if not usable:
            logger.debug(
                "[%s] atm_implied_volatility: no usable %s IV in chain (min_iv=%s)", chain.symbol, side, min_iv
            )
            continue
        nearest = min(usable, key=lambda contract: abs(contract.strike - spot))
        logger.debug(
            "[%s] atm_implied_volatility: nearest %s strike=%s (spot=%s) iv=%s",
            chain.symbol,
            side,
            nearest.strike,
            spot,
            nearest.implied_volatility,
        )
        readings.append(nearest.implied_volatility)

    if not readings:
        logger.debug("[%s] atm_implied_volatility: no usable IV on either side", chain.symbol)
        return None
    result = sum(readings) / len(readings)
    logger.debug("[%s] atm_implied_volatility: resolved=%s (from %d reading(s))", chain.symbol, result, len(readings))
    return result


def _pick_expiration(available: tuple[str, ...], target_dte: int) -> str:
    """Return the expiration string whose DTE is closest to *target_dte*.

    yfinance exposes expiration dates as strings in ``YYYY-MM-DD`` format via
    ``Ticker.options``.  We prefer expirations that are at least 1 day away so
    that we never accidentally select a same-day (0DTE) expiration when a
    better choice exists.
    """
    today = date.today()
    target_date = today + timedelta(days=target_dte)

    future = [exp for exp in available if datetime.strptime(exp, "%Y-%m-%d").date() > today]
    candidates = future if future else list(available)

    return min(candidates, key=lambda exp: abs((datetime.strptime(exp, "%Y-%m-%d").date() - target_date).days))


def get_option_chain(
    symbol: str,
    spot: float,
    iv_estimate: float,
    target_dte: int = 35,
) -> ChainResult:
    """Return a normalized chain for the expiration nearest to *target_dte* days out.

    Reads all available expirations from yfinance and selects the one whose DTE
    is closest to *target_dte*, avoiding same-day (0DTE) expirations whenever a
    future-dated alternative exists.  Falls back to a modeled Black-Scholes
    ladder when yfinance is unavailable or returns nothing usable.  The fallback
    is never silent: the result carries data_quality="modeled".
    """
    symbol = symbol.upper()
    safe_spot = spot if spot > 0 else 100.0
    safe_iv = iv_estimate if iv_estimate > 0 else 0.30

    cache_key = f"chain:{symbol}:{target_dte}"
    cached = _cache_get(cache_key, settings.option_chain_cache_ttl_seconds)
    if cached is not None:
        logger.debug("[%s] option chain cache hit (target_dte=%d)", symbol, target_dte)
        return cached

    try:
        ticker = yf.Ticker(symbol)
        available = ticker.options  # tuple of "YYYY-MM-DD" strings, all listed expirations
        logger.debug("[%s] yfinance expirations available: %s", symbol, available)

        if not available:
            logger.info("[%s] no expirations listed by yfinance — using modeled chain", symbol)
            result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)
        else:
            chosen_date_str = _pick_expiration(available, target_dte)
            raw = ticker.option_chain(chosen_date_str)
            expiration = _expiration_from_chain(raw.calls, raw.puts)

            if expiration is None:
                # Fall back to the date string we chose rather than giving up entirely.
                expiration = datetime.strptime(chosen_date_str, "%Y-%m-%d").date()

            dte = (expiration - date.today()).days
            logger.debug(
                "[%s] chosen expiration=%s (target_dte=%d, actual dte=%d): yfinance raw rows calls=%d puts=%d",
                symbol,
                chosen_date_str,
                target_dte,
                dte,
                len(raw.calls),
                len(raw.puts),
            )
            calls = _contracts_from_frame(raw.calls, symbol, "call", expiration)
            puts = _contracts_from_frame(raw.puts, symbol, "put", expiration)
            logger.debug(
                "[%s] normalized contracts after dropping unquotable rows: calls=%d puts=%d",
                symbol,
                len(calls),
                len(puts),
            )

            if not calls and not puts:
                logger.info("[%s] no quotable contracts for %s — using modeled chain", symbol, chosen_date_str)
                result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)
            else:
                result = ChainResult(
                    symbol=symbol,
                    expiration=expiration,
                    dte=dte,
                    calls=calls,
                    puts=puts,
                    data_quality="live",
                )
    except Exception:
        logger.exception("[%s] option chain fetch failed — using modeled chain", symbol)
        result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)

    logger.info(
        "[%s] option chain resolved: data_quality=%s expiration=%s dte=%d calls=%d puts=%d",
        symbol,
        result.data_quality,
        result.expiration,
        result.dte,
        len(result.calls),
        len(result.puts),
    )
    _cache_set(cache_key, result)
    return result
