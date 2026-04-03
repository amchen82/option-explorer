from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
import pytest

import app.services.market_data as market_data_module
from app.services.market_data import MarketDataService


@pytest.fixture(autouse=True)
def clear_market_data_cache():
    market_data_module._cache.clear()


@pytest.fixture
def svc():
    return MarketDataService()


def make_mock_ticker(price=182.50, hist_len=60):
    ticker = MagicMock()
    ticker.info = {
        "currentPrice": price,
        "fiftyTwoWeekHigh": 220.0,
        "fiftyTwoWeekLow": 150.0,
        "earningsDate": None,
    }
    dates = pd.date_range(end="2026-04-01", periods=hist_len, freq="B")
    prices = price * np.exp(np.cumsum(np.random.normal(0, 0.01, hist_len)))
    ticker.history.return_value = pd.DataFrame({"Close": prices}, index=dates)
    return ticker


def test_get_stock_quote(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        quote = svc.get_stock_quote("AAPL")

    assert quote["symbol"] == "AAPL"
    assert quote["price"] == 182.50
    assert "52w_high" in quote
    assert "52w_low" in quote


def test_get_stock_quote_cached(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)) as mock:
        svc.get_stock_quote("AAPL")
        svc.get_stock_quote("AAPL")

    assert mock.call_count == 1


def test_get_historical_prices(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker()):
        hist = svc.get_historical_prices("AAPL", days=60)

    assert isinstance(hist, pd.Series)
    assert len(hist) == 60


def test_get_market_signals(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        signals = svc.get_market_signals("AAPL")

    assert "rsi_14" in signals
    assert "above_50dma" in signals
    assert "iv_rank" in signals
    assert "hv_20" in signals


def test_stale_data_on_failure(svc, monkeypatch):
    now = 1_000.0
    monkeypatch.setattr(market_data_module.time, "time", lambda: now)

    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        svc.get_stock_quote("AAPL")

    now += market_data_module.settings.market_data_cache_ttl_seconds + 1
    with patch("yfinance.Ticker", side_effect=Exception("network error")):
        quote = svc.get_stock_quote("AAPL")

    assert quote["price"] == 182.50
    assert quote.get("stale") is True


def test_get_stock_quote_falls_back_to_previous_close_when_live_price_missing(svc):
    ticker = make_mock_ticker(182.50)
    ticker.info = {
        "currentPrice": 0.0,
        "regularMarketPrice": 0.0,
        "fiftyTwoWeekHigh": 220.0,
        "fiftyTwoWeekLow": 150.0,
        "earningsDate": None,
    }
    fallback_prices = pd.DataFrame({"Close": [179.25, 181.40]}, index=pd.date_range(end="2026-04-02", periods=2, freq="B"))
    ticker.history.return_value = fallback_prices

    with patch("yfinance.Ticker", return_value=ticker):
        quote = svc.get_stock_quote("AAPL")

    assert quote["symbol"] == "AAPL"
    assert quote["price"] == 181.40
    assert quote["stale"] is True


def test_get_stock_quote_uses_synthetic_data_when_yahoo_unavailable(svc):
    ticker = make_mock_ticker(182.50)
    ticker.info = {
        "currentPrice": 0.0,
        "regularMarketPrice": 0.0,
        "fiftyTwoWeekHigh": 0.0,
        "fiftyTwoWeekLow": 0.0,
        "earningsDate": None,
    }
    ticker.history.return_value = pd.DataFrame({"Close": []})

    with patch("yfinance.Ticker", return_value=ticker):
        quote = svc.get_stock_quote("AAPL")

    assert quote["symbol"] == "AAPL"
    assert quote["price"] > 0.0
    assert quote["52w_high"] >= quote["price"]
    assert quote["52w_low"] <= quote["price"]
    assert quote["stale"] is True


def test_get_market_signals_uses_stable_synthetic_history_when_yahoo_unavailable(svc):
    ticker = make_mock_ticker(182.50)
    ticker.info = {
        "currentPrice": 0.0,
        "regularMarketPrice": 0.0,
        "fiftyTwoWeekHigh": 0.0,
        "fiftyTwoWeekLow": 0.0,
        "earningsDate": None,
    }
    ticker.history.return_value = pd.DataFrame({"Close": []})

    with patch("yfinance.Ticker", return_value=ticker):
        first_quote = svc.get_stock_quote("AAPL")
        first_signals = svc.get_market_signals("AAPL")

    market_data_module._cache.clear()

    with patch("yfinance.Ticker", return_value=ticker):
        second_quote = svc.get_stock_quote("AAPL")
        second_signals = svc.get_market_signals("AAPL")

    assert first_quote["price"] == second_quote["price"]
    assert first_signals["rsi_14"] == second_signals["rsi_14"]
    assert first_signals["hv_20"] == second_signals["hv_20"]
    assert first_signals["iv_rank"] == second_signals["iv_rank"]
