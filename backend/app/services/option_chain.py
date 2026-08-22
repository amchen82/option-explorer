from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Literal

import httpx
import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import black_scholes_price

DataQuality = Literal["live", "modeled"]

RISK_FREE_RATE = 0.05

_cache: dict[str, dict[str, Any]] = {}
_POLYGON_BASE = "https://api.polygon.io"


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] >= ttl:
        return None
    return entry["data"]


def _cache_set(key: str, data) -> None:
    _cache[key] = {"ts": time.time(), "data": data}


def _provider() -> str:
    return settings.data_provider.strip().lower()


def _polygon_enabled() -> bool:
    return _provider() == "polygon" and bool(settings.polygon_api_key.strip())


def _polygon_request(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    if not _polygon_enabled():
        raise RuntimeError("Polygon provider not configured")

    payload = dict(params or {})
    payload["apiKey"] = settings.polygon_api_key.strip()

    with httpx.Client(timeout=10.0) as client:
        response = client.get(f"{_POLYGON_BASE}{path}", params=payload)
        response.raise_for_status()
        return response.json()


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


def _select_expiration(
    expirations: list[str], target_dte: int, dte_window: tuple[int, int]
) -> tuple[date, int] | None:
    """Pick the listed expiration closest to target_dte within the window."""
    today = date.today()
    candidates: list[tuple[date, int]] = []

    for raw in expirations:
        try:
            parsed = datetime.strptime(raw, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            continue

        dte = (parsed - today).days
        if dte_window[0] <= dte <= dte_window[1]:
            candidates.append((parsed, dte))

    if not candidates:
        return None

    return min(candidates, key=lambda item: abs(item[1] - target_dte))


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


def _contracts_from_polygon_rows(rows: list[dict[str, Any]], symbol: str) -> tuple[list[Contract], list[Contract]]:
    calls: list[Contract] = []
    puts: list[Contract] = []

    for row in rows:
        details = row.get("details") or {}
        contract_type = str(details.get("contract_type") or "").lower()
        if contract_type not in {"call", "put"}:
            continue

        expiration_raw = details.get("expiration_date")
        strike_raw = details.get("strike_price")
        if expiration_raw is None or strike_raw is None:
            continue

        try:
            expiration = datetime.strptime(str(expiration_raw), "%Y-%m-%d").date()
            strike = float(strike_raw)
        except (TypeError, ValueError):
            continue

        quote = row.get("last_quote") or {}
        day = row.get("day") or {}

        bid = _clean_float(quote.get("bid"))
        ask = _clean_float(quote.get("ask"))
        last = _clean_float(day.get("close"))
        if bid <= 0 and last <= 0:
            continue

        mid = (bid + ask) / 2.0 if bid > 0 and ask > 0 else last
        contract = Contract(
            symbol=symbol,
            contract_type=contract_type,
            strike=strike,
            expiration=expiration,
            bid=bid,
            ask=ask,
            last=last,
            mid=mid,
            volume=_clean_int(day.get("volume")),
            open_interest=_clean_int(row.get("open_interest")),
            implied_volatility=_clean_float(row.get("implied_volatility")),
        )

        if contract_type == "call":
            calls.append(contract)
        else:
            puts.append(contract)

    calls.sort(key=lambda contract: contract.strike)
    puts.sort(key=lambda contract: contract.strike)
    return calls, puts


def _option_chain_from_polygon(symbol: str, target_dte: int, dte_window: tuple[int, int]) -> tuple[date, int, list[Contract], list[Contract]] | None:
    payload = _polygon_request(
        f"/v3/snapshot/options/{symbol}",
        params={"limit": 250, "sort": "expiration_date", "order": "asc"},
    )
    rows = payload.get("results") or []
    if not rows:
        return None

    calls, puts = _contracts_from_polygon_rows(rows, symbol)
    if not calls and not puts:
        return None

    expirations = sorted({contract.expiration for contract in calls + puts})
    today = date.today()
    candidates = [
        (expiration, (expiration - today).days)
        for expiration in expirations
        if dte_window[0] <= (expiration - today).days <= dte_window[1]
    ]
    if not candidates:
        return None

    expiration, dte = min(candidates, key=lambda item: abs(item[1] - target_dte))
    selected_calls = [contract for contract in calls if contract.expiration == expiration]
    selected_puts = [contract for contract in puts if contract.expiration == expiration]

    if not selected_calls and not selected_puts:
        return None

    return expiration, dte, selected_calls, selected_puts


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
    dte_window: tuple[int, int] = (21, 60),
) -> ChainResult:
    """Return a normalized option chain for one expiration near target_dte.

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
        result: ChainResult | None = None

        if _polygon_enabled():
            try:
                polygon_chain = _option_chain_from_polygon(symbol, target_dte, dte_window)
                if polygon_chain is not None:
                    expiration, dte, calls, puts = polygon_chain
                    result = ChainResult(
                        symbol=symbol,
                        expiration=expiration,
                        dte=dte,
                        calls=calls,
                        puts=puts,
                        data_quality="live",
                    )
            except Exception:
                result = None

        if result is None:
            ticker = yf.Ticker(symbol)
            expirations = list(ticker.options or [])
            selected = _select_expiration(expirations, target_dte, dte_window)

            if selected is None:
                result = _modeled_chain(symbol, safe_spot, safe_iv, target_dte)
            else:
                expiration, dte = selected
                raw = ticker.option_chain(expiration.isoformat())
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
