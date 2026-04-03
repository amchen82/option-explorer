import pandas as pd
import pytest

from app.engine.options_math import (
    black_scholes_price,
    calculate_greeks,
    implied_volatility,
    iv_rank,
    historical_volatility,
    prob_profit_from_delta,
)


# The Task 3 plan listed 5.07 / 3.83 for this case, but the standard
# Black-Scholes formula gives approximately 4.615 / 3.373.
def test_black_scholes_call():
    price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="call")
    assert abs(price - 4.61) < 0.05


def test_black_scholes_put():
    price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="put")
    assert abs(price - 3.37) < 0.05


def test_greeks_call_delta_atm():
    greeks = calculate_greeks(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="call")
    assert 0.45 < greeks["delta"] < 0.60
    assert greeks["gamma"] > 0
    assert greeks["theta"] < 0
    assert greeks["vega"] > 0


def test_greeks_put_delta_atm():
    greeks = calculate_greeks(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="put")
    assert -0.60 < greeks["delta"] < -0.40


def test_implied_volatility():
    market_price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.25, option_type="call")
    iv = implied_volatility(market_price=market_price, S=100, K=100, T=0.25, r=0.05, option_type="call")
    assert abs(iv - 0.25) < 0.001


def test_implied_volatility_accepts_valid_itm_put_price_below_intrinsic():
    iv = implied_volatility(market_price=18.0, S=80, K=100, T=1.0, r=0.05, option_type="put")
    assert iv > 0.0


def test_iv_rank():
    rank = iv_rank(current_iv=0.30, iv_52w_low=0.15, iv_52w_high=0.45)
    assert abs(rank - 50.0) < 0.01


def test_iv_rank_extremes():
    assert iv_rank(0.15, 0.15, 0.45) == 0.0
    assert iv_rank(0.45, 0.15, 0.45) == 100.0


def test_historical_volatility():
    import numpy as np

    np.random.seed(42)
    prices = pd.Series(100 * np.exp(np.cumsum(np.random.normal(0, 0.01, 60))))
    hv = historical_volatility(prices, window=20)
    assert 0.0 < hv < 1.0


def test_prob_profit_from_delta():
    assert abs(prob_profit_from_delta(delta=0.30, position_type="short_call") - 0.70) < 0.01
    assert abs(prob_profit_from_delta(delta=-0.25, position_type="short_put") - 0.75) < 0.01


@pytest.mark.parametrize("kwargs", [
    {"S": 0, "K": 100, "T": 0.25, "r": 0.05, "sigma": 0.20, "option_type": "call"},
    {"S": 100, "K": 0, "T": 0.25, "r": 0.05, "sigma": 0.20, "option_type": "put"},
])
def test_black_scholes_rejects_non_positive_spot_or_strike(kwargs):
    with pytest.raises(ValueError):
        black_scholes_price(**kwargs)


@pytest.mark.parametrize("kwargs", [
    {"S": 0, "K": 100, "T": 0.25, "r": 0.05, "sigma": 0.20, "option_type": "call"},
    {"S": 100, "K": 0, "T": 0.25, "r": 0.05, "sigma": 0.20, "option_type": "put"},
])
def test_calculate_greeks_rejects_non_positive_spot_or_strike(kwargs):
    with pytest.raises(ValueError):
        calculate_greeks(**kwargs)


def test_prob_profit_from_delta_clamps_to_probability_range():
    assert prob_profit_from_delta(delta=1.2, position_type="short_call") == 0.0
    assert prob_profit_from_delta(delta=-1.2, position_type="long_put") == 1.0
