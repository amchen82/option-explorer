from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date, datetime
import re
from typing import Any, Literal

import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import black_scholes_price

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
                implied_volatility=_clean_float(row.get("impliedVolatility")),
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


def get_option_chain(
    symbol: str,
    spot: float,
    iv_estimate: float,
    target_dte: int = 35,
) -> ChainResult:
    """Return a normalized chain from yfinance's nearest listed expiration.

    Falls back to a modeled Black-Scholes ladder when yfinance is unavailable or
    returns nothing usable. The fallback is never silent: the result carries
    data_quality="modeled".
    """
    symbol = symbol.upper()
    safe_spot = spot if spot > 0 else 100.0
    safe_iv = iv_estimate if iv_estimate > 0 else 0.30

    cache_key = f"chain:{symbol}:{target_dte}"
    cached = _cache_get(cache_key, settings.option_chain_cache_ttl_seconds)
    if cached is not None:
        return cached

    try:
        ticker = yf.Ticker(symbol)
        raw = ticker.option_chain()
        expiration = _expiration_from_chain(raw.calls, raw.puts)

        if expiration is None:
            result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)
        else:
            dte = (expiration - date.today()).days
            calls = _contracts_from_frame(raw.calls, symbol, "call", expiration)
            puts = _contracts_from_frame(raw.puts, symbol, "put", expiration)

            if not calls and not puts:
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
        result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)

    _cache_set(cache_key, result)
    return result
