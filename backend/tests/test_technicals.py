import numpy as np
import pandas as pd
import pytest

from app.engine.technicals import calculate_rsi, earnings_days_away, is_above_ma, moving_average


def make_prices(n: int = 30, start: float = 100.0, trend: float = 0.5) -> pd.Series:
    """Generate synthetic price series."""
    prices = [start]
    for _ in range(n - 1):
        prices.append(prices[-1] + trend + np.random.normal(0, 1))
    return pd.Series(prices)


def test_rsi_range() -> None:
    prices = make_prices(50)
    rsi = calculate_rsi(prices, period=14)
    assert 0 <= rsi <= 100


def test_rsi_overbought() -> None:
    prices = pd.Series([float(i) for i in range(1, 51)])
    rsi = calculate_rsi(prices, period=14)
    assert rsi > 70


def test_rsi_oversold() -> None:
    prices = pd.Series([float(50 - i) for i in range(50)])
    rsi = calculate_rsi(prices, period=14)
    assert rsi < 30


def test_moving_average() -> None:
    prices = pd.Series([float(i) for i in range(1, 51)])
    ma50 = moving_average(prices, period=50)
    assert abs(ma50 - 25.5) < 0.1


def test_is_above_ma_true() -> None:
    prices = pd.Series([float(i) for i in range(1, 51)])
    assert is_above_ma(current_price=50.0, prices=prices, period=50) is True


def test_is_above_ma_false() -> None:
    prices = pd.Series([float(50 - i) for i in range(50)])
    assert is_above_ma(current_price=1.0, prices=prices, period=50) is False


def test_earnings_days_away_future() -> None:
    from datetime import date, timedelta

    future_date = (date.today() + timedelta(days=15)).isoformat()
    result = earnings_days_away(future_date)
    assert 14 <= result <= 16


def test_earnings_days_away_past() -> None:
    result = earnings_days_away("2020-01-01")
    assert result < 0


def test_earnings_days_away_none() -> None:
    result = earnings_days_away(None)
    assert result is None
