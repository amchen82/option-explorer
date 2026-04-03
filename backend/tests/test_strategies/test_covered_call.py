from datetime import date, timedelta

import pytest

from app.engine.covered_call import CoveredCallStrategy


@pytest.fixture
def strategy() -> CoveredCallStrategy:
    return CoveredCallStrategy()


@pytest.fixture
def position() -> dict[str, float | str]:
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}


@pytest.fixture
def market_data() -> dict[str, float | bool | str]:
    return {
        "price": 182.50,
        "current_iv": 0.28,
        "iv_rank": 72.0,
        "hv_20": 0.25,
        "rsi_14": 61.2,
        "above_50dma": True,
        "earnings_date": "2026-05-01",
    }


def test_covered_call_result_shape(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    results = strategy.analyze(position, market_data)
    assert len(results) > 0

    result = results[0]
    assert result["strategy"] == "covered_call"
    assert result["symbol"] == "AAPL"
    assert "action" in result
    assert "strike" in result
    assert "expiration" in result
    assert "premium_collected" in result
    assert "max_profit" in result
    assert "max_loss" in result
    assert "breakeven" in result
    assert "prob_profit" in result
    assert "greeks" in result
    assert "timing_signals" in result
    assert "recommendation_strength" in result


def test_covered_call_needs_100_shares(strategy: CoveredCallStrategy, market_data: dict) -> None:
    small_position = {"symbol": "AAPL", "shares": 50, "cost_basis": 162.0}
    results = strategy.analyze(small_position, market_data)
    assert results == []


def test_covered_call_strike_above_current_price(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    for result in strategy.analyze(position, market_data):
        assert result["strike"] > market_data["price"]


def test_covered_call_max_profit_calculation(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    result = strategy.analyze(position, market_data)[0]
    expected = (result["strike"] - position["cost_basis"] + result["premium_collected"]) * position["shares"]
    assert abs(result["max_profit"] - expected) < 0.01


def test_covered_call_breakeven(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    result = strategy.analyze(position, market_data)[0]
    expected_breakeven = position["cost_basis"] - result["premium_collected"]
    assert abs(result["breakeven"] - expected_breakeven) < 0.01


def test_covered_call_strong_signal_high_iv(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    market_data["iv_rank"] = 80.0
    result = strategy.analyze(position, market_data)[0]
    assert result["recommendation_strength"] == "strong"


def test_covered_call_weak_signal_low_iv(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    market_data["iv_rank"] = 20.0
    result = strategy.analyze(position, market_data)[0]
    assert result["recommendation_strength"] == "weak"


def test_covered_call_earnings_warning(strategy: CoveredCallStrategy, position: dict, market_data: dict) -> None:
    market_data["earnings_date"] = (date.today() + timedelta(days=10)).isoformat()
    result = strategy.analyze(position, market_data)[0]
    assert result["timing_signals"]["earnings_days_away"] <= 14
