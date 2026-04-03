from datetime import date, timedelta

import pytest

from app.engine.alerts import check_proactive_alerts


@pytest.fixture
def base_market_data() -> dict:
    return {
        "price": 182.50,
        "current_iv": 0.28,
        "iv_rank": 40.0,
        "hv_20": 0.25,
        "rsi_14": 55.0,
        "above_50dma": True,
        "earnings_date": None,
    }


@pytest.fixture
def position() -> dict:
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}


def test_high_iv_rank_triggers_alert(position: dict, base_market_data: dict) -> None:
    base_market_data["iv_rank"] = 65.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "high_iv_rank" in types


def test_no_alert_when_iv_rank_low(position: dict, base_market_data: dict) -> None:
    base_market_data["iv_rank"] = 30.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "high_iv_rank" not in types


def test_stock_up_triggers_covered_call_alert(position: dict, base_market_data: dict) -> None:
    position["cost_basis"] = 150.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "stock_up_consider_covered_call" in types


def test_no_alert_when_small_gain(position: dict, base_market_data: dict) -> None:
    position["cost_basis"] = 175.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "stock_up_consider_covered_call" not in types


def test_earnings_warning(position: dict, base_market_data: dict) -> None:
    near_date = (date.today() + timedelta(days=10)).isoformat()
    base_market_data["earnings_date"] = near_date
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "earnings_approaching" in types


def test_expiring_option_alert(position: dict, base_market_data: dict) -> None:
    expiring = {
        "symbol": "AAPL",
        "contract_type": "call",
        "position_type": "short",
        "strike": 195.0,
        "expiration": (date.today() + timedelta(days=5)).isoformat(),
        "quantity": 1,
    }
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[expiring])
    types = [a["type"] for a in alerts]
    assert "option_expiring_soon" in types
