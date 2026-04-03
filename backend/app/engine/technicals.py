from datetime import date
from typing import Optional

import pandas as pd


def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """RSI (Relative Strength Index). Returns 0-100."""
    if len(prices) < period + 1:
        return 50.0

    delta = prices.diff().dropna()
    gains = delta.clip(lower=0)
    losses = (-delta).clip(lower=0)
    avg_gain = gains.ewm(com=period - 1, min_periods=period).mean().iloc[-1]
    avg_loss = losses.ewm(com=period - 1, min_periods=period).mean().iloc[-1]

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return round(float(100.0 - (100.0 / (1.0 + rs))), 2)


def moving_average(prices: pd.Series, period: int) -> float:
    """Simple moving average of last `period` prices."""
    if len(prices) < period:
        return float(prices.mean())

    return round(float(prices.iloc[-period:].mean()), 4)


def is_above_ma(current_price: float, prices: pd.Series, period: int) -> bool:
    """True if current_price is above the period-day SMA."""
    ma = moving_average(prices, period)
    return current_price > ma


def earnings_days_away(earnings_date_iso: Optional[str]) -> Optional[int]:
    """Days until earnings. Negative if in the past. None if unknown."""
    if earnings_date_iso is None:
        return None

    try:
        earnings = date.fromisoformat(earnings_date_iso)
    except ValueError:
        return None

    return (earnings - date.today()).days
