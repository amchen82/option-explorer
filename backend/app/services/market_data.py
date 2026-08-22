from __future__ import annotations

import hashlib
import time
from typing import Any

import httpx
import numpy as np
import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import historical_volatility, iv_rank
from app.engine.technicals import calculate_rsi, is_above_ma

_cache: dict[str, dict[str, Any]] = {}
_POLYGON_BASE = "https://api.polygon.io"


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] >= ttl:
        return None
    return entry["data"]


def _cache_set(key: str, data):
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

    with httpx.Client(timeout=8.0) as client:
        response = client.get(f"{_POLYGON_BASE}{path}", params=payload)
        response.raise_for_status()
        return response.json()


def _quote_from_info(symbol: str, info: dict[str, Any]) -> dict[str, Any]:
    price = info.get("currentPrice") or info.get("regularMarketPrice") or 0.0
    return {
        "symbol": symbol,
        "price": float(price),
        "52w_high": float(info.get("fiftyTwoWeekHigh") or 0.0),
        "52w_low": float(info.get("fiftyTwoWeekLow") or 0.0),
        "earnings_date": info.get("earningsDate"),
        "stale": False,
    }


def _quote_from_fast_info(symbol: str, fast_info: Any) -> dict[str, Any]:
    payload = dict(fast_info or {})
    price = payload.get("lastPrice") or payload.get("last_price") or payload.get("regularMarketPrice") or 0.0
    return {
        "symbol": symbol,
        "price": float(price),
        "52w_high": float(payload.get("yearHigh") or payload.get("year_high") or 0.0),
        "52w_low": float(payload.get("yearLow") or payload.get("year_low") or 0.0),
        "earnings_date": None,
        "stale": False,
    }


def _latest_close_from_history(history: pd.DataFrame) -> float:
    if history.empty or "Close" not in history:
        return 0.0

    closes = history["Close"].dropna()
    if closes.empty:
        return 0.0

    return float(closes.iloc[-1])


def _synthetic_seed(symbol: str) -> int:
    digest = hashlib.sha256(symbol.upper().encode("utf-8")).hexdigest()
    return int(digest[:16], 16) % (2**32)


def _synthetic_history(symbol: str, days: int) -> pd.Series:
    seed = _synthetic_seed(symbol)
    rng = np.random.default_rng(seed)
    base_price = 80.0 + float(seed % 240)
    daily_returns = rng.normal(0.0004, 0.012, days)
    prices = base_price * np.exp(np.cumsum(daily_returns))
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=days, freq="B")
    return pd.Series(prices, index=dates, name="Close")


def _synthetic_quote(symbol: str) -> dict[str, Any]:
    prices = _synthetic_history(symbol, 252)
    price = float(prices.iloc[-1])
    return {
        "symbol": symbol,
        "price": round(price, 2),
        "52w_high": round(float(prices.max()), 2),
        "52w_low": round(float(prices.min()), 2),
        "earnings_date": None,
        "stale": True,
    }


def _quote_from_polygon(symbol: str) -> dict[str, Any]:
    snapshot = _polygon_request(f"/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}")
    ticker = snapshot.get("ticker") or {}
    day = ticker.get("day") or {}
    prev = ticker.get("prevDay") or {}
    min_data = ticker.get("min") or {}

    price = day.get("c") or min_data.get("c") or prev.get("c") or 0.0

    return {
        "symbol": symbol,
        "price": float(price or 0.0),
        "52w_high": 0.0,
        "52w_low": 0.0,
        "earnings_date": None,
        "stale": False,
    }


def _history_from_polygon(symbol: str, days: int) -> pd.Series:
    today = pd.Timestamp.today().normalize().date()
    start = (today - pd.Timedelta(days=max(days * 2, 30))).isoformat()
    end = today.isoformat()

    payload = _polygon_request(
        f"/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}",
        params={"adjusted": "true", "sort": "asc", "limit": 5000},
    )
    rows = payload.get("results") or []
    if not rows:
        return pd.Series(dtype=float, name="Close")

    records: list[tuple[pd.Timestamp, float]] = []
    for row in rows:
        close = row.get("c")
        ts = row.get("t")
        if close is None or ts is None:
            continue
        records.append((pd.to_datetime(int(ts), unit="ms"), float(close)))

    if not records:
        return pd.Series(dtype=float, name="Close")

    series = pd.Series([close for _, close in records], index=[idx for idx, _ in records], name="Close")
    return series.tail(days)


class MarketDataService:
    def _get_stock_quote_yahoo(self, symbol: str) -> dict[str, Any]:
        ticker = yf.Ticker(symbol)

        # Prefer lightweight endpoints first to reduce rate-limit hits.
        data = _quote_from_fast_info(symbol, ticker.fast_info)

        if data["price"] <= 0.0 or data["52w_high"] <= 0.0 or data["52w_low"] <= 0.0:
            history = ticker.history(period="1y")
            fallback_price = _latest_close_from_history(history)
            if fallback_price > 0.0:
                highs_lows = history.get("Close")
                if highs_lows is not None and not highs_lows.dropna().empty:
                    high = float(highs_lows.max())
                    low = float(highs_lows.min())
                else:
                    high = float(data.get("52w_high") or 0.0)
                    low = float(data.get("52w_low") or 0.0)

                data = {
                    **data,
                    "price": fallback_price,
                    "52w_high": high if high > 0.0 else float(data.get("52w_high") or 0.0),
                    "52w_low": low if low > 0.0 else float(data.get("52w_low") or 0.0),
                    "stale": True,
                }

        if data["price"] <= 0.0:
            # Last resort: this endpoint is richer but more likely to be rate-limited.
            data = _quote_from_info(symbol, ticker.info)
            if data["price"] <= 0.0:
                data = _synthetic_quote(symbol)

        return data

    def _get_stock_quote_polygon(self, symbol: str) -> dict[str, Any]:
        data = _quote_from_polygon(symbol)
        prices = _history_from_polygon(symbol, 252)

        if not prices.dropna().empty:
            data["52w_high"] = round(float(prices.max()), 2)
            data["52w_low"] = round(float(prices.min()), 2)
            if data["price"] <= 0.0:
                data["price"] = float(prices.iloc[-1])

        if data["price"] <= 0.0:
            raise RuntimeError("Polygon quote unavailable")

        return data

    def get_stock_quote(self, symbol: str) -> dict[str, Any]:
        key = f"quote:{symbol}"
        cached = _cache_get(key, settings.market_data_cache_ttl_seconds)
        if cached is not None:
            return cached

        try:
            if _polygon_enabled():
                try:
                    data = self._get_stock_quote_polygon(symbol)
                except Exception:
                    data = self._get_stock_quote_yahoo(symbol)
            else:
                data = self._get_stock_quote_yahoo(symbol)

            _cache_set(key, data)
            return data
        except Exception:
            stale = _cache.get(key, {}).get("data")
            if stale is not None:
                return {**stale, "stale": True}
            data = _synthetic_quote(symbol)
            _cache_set(key, data)
            return data

    def get_historical_prices(self, symbol: str, days: int = 60) -> pd.Series:
        key = f"hist:{symbol}:{days}"
        cached = _cache_get(key, settings.historical_data_cache_ttl_seconds)
        if cached is not None:
            return cached

        try:
            if _polygon_enabled():
                try:
                    prices = _history_from_polygon(symbol, days)
                except Exception:
                    prices = pd.Series(dtype=float, name="Close")
            else:
                prices = pd.Series(dtype=float, name="Close")

            if prices.dropna().empty:
                ticker = yf.Ticker(symbol)
                history = ticker.history(period=f"{days}d")
                prices = history["Close"].tail(days)

            if prices.dropna().empty:
                prices = _synthetic_history(symbol, days)
        except Exception:
            prices = _synthetic_history(symbol, days)
        _cache_set(key, prices)
        return prices

    def get_market_signals(self, symbol: str) -> dict[str, Any]:
        quote = self.get_stock_quote(symbol)
        prices = self.get_historical_prices(symbol, days=252)
        current_price = float(quote["price"])

        rsi_14 = calculate_rsi(prices, period=14)
        above_50dma = is_above_ma(current_price, prices, period=50)
        above_200dma = is_above_ma(current_price, prices, period=200)
        hv_20 = historical_volatility(prices, window=20)
        hv_60 = historical_volatility(prices, window=60)

        current_iv = hv_20 * 1.1
        base_vol = float(prices.pct_change().std() * (252 ** 0.5)) if len(prices) > 1 else 0.0
        iv_low = base_vol * 0.9
        iv_high = base_vol * 1.4

        return {
            "rsi_14": rsi_14,
            "above_50dma": above_50dma,
            "above_200dma": above_200dma,
            "hv_20": hv_20,
            "hv_60": hv_60,
            "iv_rank": iv_rank(current_iv, iv_low, iv_high),
            "current_iv": round(current_iv, 4),
            "52w_high": quote["52w_high"],
            "52w_low": quote["52w_low"],
        }
