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
