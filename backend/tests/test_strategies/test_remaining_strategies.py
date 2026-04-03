import pytest

from app.engine.bear_put_spread import BearPutSpreadStrategy
from app.engine.bull_call_spread import BullCallSpreadStrategy
from app.engine.cash_secured_put import CashSecuredPutStrategy
from app.engine.collar import CollarStrategy
from app.engine.protective_put import ProtectivePutStrategy


@pytest.fixture
def market_data():
    return {
        "price": 182.50,
        "current_iv": 0.28,
        "iv_rank": 60.0,
        "hv_20": 0.25,
        "rsi_14": 50.0,
        "above_50dma": True,
        "earnings_date": None,
    }


@pytest.fixture
def stock_position():
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}


def test_csp_result_shape(market_data):
    results = CashSecuredPutStrategy().analyze({"symbol": "AAPL", "cash": 18000}, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "cash_secured_put"
    assert r["strike"] < market_data["price"]
    assert r["premium_collected"] > 0
    assert r["max_profit"] > 0
    assert "breakeven" in r


def test_csp_breakeven(market_data):
    results = CashSecuredPutStrategy().analyze({"symbol": "AAPL", "cash": 18000}, market_data)
    r = results[0]
    assert abs(r["breakeven"] - (r["strike"] - r["premium_collected"])) < 0.01


def test_protective_put_shape(stock_position, market_data):
    results = ProtectivePutStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "protective_put"
    assert r["strike"] < market_data["price"]
    assert r["cost"] < 0
    assert "protected_below" in r


def test_protective_put_needs_shares(market_data):
    results = ProtectivePutStrategy().analyze({"symbol": "AAPL", "shares": 0, "cost_basis": 162.0}, market_data)
    assert results == []


def test_collar_shape(stock_position, market_data):
    results = CollarStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "collar"
    assert r["call_strike"] > market_data["price"]
    assert r["put_strike"] < market_data["price"]
    assert "net_credit" in r
    assert "upside_cap" in r
    assert "downside_floor" in r


def test_bull_call_spread_shape(stock_position, market_data):
    results = BullCallSpreadStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "bull_call_spread"
    assert r["long_strike"] < r["short_strike"]
    assert r["max_profit"] > 0
    assert r["max_loss"] < 0


def test_bear_put_spread_shape(stock_position, market_data):
    results = BearPutSpreadStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "bear_put_spread"
    assert r["long_strike"] > r["short_strike"]
    assert r["max_profit"] > 0
    assert r["max_loss"] < 0
