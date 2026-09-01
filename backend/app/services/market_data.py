from __future__ import annotations

import hashlib
import time
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import historical_volatility, iv_rank, realized_vol_band
from app.engine.technicals import calculate_rsi, is_above_ma

_cache: dict[str, dict[str, Any]] = {}
# 1 year of daily bars (~252 trading days). above_200dma, hv_60, and the 52w
# high/low all need a real year of history to mean what their names say —
# a shorter window doesn't error, it just silently answers from too few days.
HISTORY_PERIOD = "1y"
HISTORY_TRADING_DAYS = 252

# A longer fetch reserved for get_market_signals(), so IV rank can compare
# today's volatility against a real rolling history of its own past values
# instead of a synthetic multiplier band. A 20-day rolling window consumes
# its first 20 days as warm-up, so ranking a full trailing year of that
# series (IV_RANK_LOOKBACK_DAYS) needs meaningfully more than a year of raw
# price history. Every other signal computed from this series (RSI, moving
# averages, hv_20/hv_60) only reads its own trailing window regardless of
# how much extra history precedes it, so the longer fetch doesn't change
# their meaning — it only gives IV rank room to work with.
SIGNALS_HISTORY_PERIOD = "2y"
SIGNALS_FETCH_DAYS = 300
IV_RANK_WINDOW = 20
IV_RANK_LOOKBACK_DAYS = 252
# Below this many rolling readings, a real band is more noise than signal
# (e.g. a stock that only IPO'd a few weeks ago) — fall back to the old
# synthetic band rather than rank against a handful of data points.
IV_RANK_MIN_READINGS = 20


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] >= ttl:
        return None
    return entry["data"]


def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}


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


class MarketDataService:
    def _get_stock_quote_yahoo(self, symbol: str) -> dict[str, Any]:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=HISTORY_PERIOD)
        closes = history.get("Close")
        price = _latest_close_from_history(history)

        if price <= 0.0 or closes is None or closes.dropna().empty:
            return _synthetic_quote(symbol)

        return {
            "symbol": symbol,
            "price": price,
            "52w_high": float(closes.max()),
            "52w_low": float(closes.min()),
            "earnings_date": None,
            "stale": False,
        }

    def get_stock_quote(self, symbol: str) -> dict[str, Any]:
        key = f"quote:{symbol}"
        cached = _cache_get(key, settings.market_data_cache_ttl_seconds)
        if cached is not None:
            return cached

        try:
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
            ticker = yf.Ticker(symbol)
            history = ticker.history(period=SIGNALS_HISTORY_PERIOD)
            prices = history["Close"].tail(days)

            if prices.dropna().empty:
                prices = _synthetic_history(symbol, days)
        except Exception:
            prices = _synthetic_history(symbol, days)
        _cache_set(key, prices)
        return prices

    def get_market_signals(self, symbol: str) -> dict[str, Any]:
        quote = self.get_stock_quote(symbol)
        prices = self.get_historical_prices(symbol, days=SIGNALS_FETCH_DAYS)
        current_price = float(quote["price"])

        rsi_14 = calculate_rsi(prices, period=14)
        above_50dma = is_above_ma(current_price, prices, period=50)
        above_200dma = is_above_ma(current_price, prices, period=200)
        hv_20 = historical_volatility(prices, window=20)
        hv_60 = historical_volatility(prices, window=60)

        # Tier 1 of the current_iv fallback chain — real ATM IV from a live
        # option chain — is resolved later in the ideas router, once a chain
        # exists; this service has no chain access. Historical volatility is
        # a reasonable Black-Scholes-style vol estimate for tier 2. The old
        # *1.1 heuristic (realized vol plus a rough volatility-risk-premium
        # bump) is tier 3, and only applies if hv_20 itself isn't computable.
        current_iv = hv_20 if hv_20 > 0 else hv_20 * 1.1

        # The IV rank band: rank current_iv against a real rolling history of
        # its own past values (see realized_vol_band's docstring) rather than
        # a synthetic multiplier band. Falls back to the synthetic band only
        # when there isn't enough price history for a trustworthy real one.
        band = None
        if len(prices) >= IV_RANK_WINDOW + IV_RANK_MIN_READINGS:
            band = realized_vol_band(prices, window=IV_RANK_WINDOW, lookback_days=IV_RANK_LOOKBACK_DAYS)

        if band is not None:
            iv_low, iv_high = band
        else:
            base_vol = float(prices.pct_change().std() * (252**0.5)) if len(prices) > 1 else 0.0
            iv_low, iv_high = base_vol * 0.9, base_vol * 1.4

        return {
            "rsi_14": rsi_14,
            "above_50dma": above_50dma,
            "above_200dma": above_200dma,
            "hv_20": hv_20,
            "hv_60": hv_60,
            "iv_rank": iv_rank(current_iv, iv_low, iv_high),
            "current_iv": round(current_iv, 4),
            "iv_low": round(iv_low, 4),
            "iv_high": round(iv_high, 4),
            "52w_high": quote["52w_high"],
            "52w_low": quote["52w_low"],
            "history_window": HISTORY_PERIOD,
        }
