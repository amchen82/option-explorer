from __future__ import annotations

import time
from typing import Any

import pandas as pd
import yfinance as yf

from app.config import settings
from app.engine.options_math import historical_volatility, iv_rank
from app.engine.technicals import calculate_rsi, is_above_ma

_cache: dict[str, dict[str, Any]] = {}


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] >= ttl:
        return None
    return entry["data"]


def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}


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


class MarketDataService:
    def get_stock_quote(self, symbol: str) -> dict[str, Any]:
        key = f"quote:{symbol}"
        cached = _cache_get(key, settings.market_data_cache_ttl_seconds)
        if cached is not None:
            return cached

        try:
            ticker = yf.Ticker(symbol)
            data = _quote_from_info(symbol, ticker.info)
            _cache_set(key, data)
            return data
        except Exception:
            stale = _cache.get(key, {}).get("data")
            if stale is not None:
                return {**stale, "stale": True}
            return {
                "symbol": symbol,
                "price": 0.0,
                "52w_high": 0.0,
                "52w_low": 0.0,
                "earnings_date": None,
                "stale": True,
            }

    def get_historical_prices(self, symbol: str, days: int = 60) -> pd.Series:
        key = f"hist:{symbol}:{days}"
        cached = _cache_get(key, settings.historical_data_cache_ttl_seconds)
        if cached is not None:
            return cached

        ticker = yf.Ticker(symbol)
        history = ticker.history(period=f"{days}d")
        prices = history["Close"].tail(days)
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
