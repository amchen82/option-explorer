from __future__ import annotations

import math

import numpy as np
import pandas as pd
from scipy.optimize import brentq
from scipy.stats import norm


def _validate_option_type(option_type: str) -> str:
    if option_type not in {"call", "put"}:
        raise ValueError("option_type must be 'call' or 'put'")
    return option_type


def _validate_positive_inputs(S: float, K: float) -> None:
    if S <= 0 or K <= 0:
        raise ValueError("S and K must be positive")


def black_scholes_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str) -> float:
    """Return the Black-Scholes price for a European option."""
    option_type = _validate_option_type(option_type)
    _validate_positive_inputs(S, K)
    if T <= 0:
        return max(0.0, S - K) if option_type == "call" else max(0.0, K - S)
    if sigma <= 0:
        return max(0.0, S - K * math.exp(-r * T)) if option_type == "call" else max(0.0, K * math.exp(-r * T) - S)

    sqrt_t = math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrt_t)
    d2 = d1 - sigma * sqrt_t

    if option_type == "call":
        return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str) -> dict:
    """Return the primary Black-Scholes Greeks."""
    option_type = _validate_option_type(option_type)
    _validate_positive_inputs(S, K)
    if T <= 0 or sigma <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}

    sqrt_t = math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrt_t)
    d2 = d1 - sigma * sqrt_t
    pdf_d1 = norm.pdf(d1)

    gamma = pdf_d1 / (S * sigma * sqrt_t)
    vega = S * pdf_d1 * sqrt_t / 100.0

    if option_type == "call":
        delta = norm.cdf(d1)
        theta = (-(S * pdf_d1 * sigma) / (2 * sqrt_t) - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365.0
        rho = K * T * math.exp(-r * T) * norm.cdf(d2) / 100.0
    else:
        delta = norm.cdf(d1) - 1.0
        theta = (-(S * pdf_d1 * sigma) / (2 * sqrt_t) + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365.0
        rho = -K * T * math.exp(-r * T) * norm.cdf(-d2) / 100.0

    return {
        "delta": round(float(delta), 4),
        "gamma": round(float(gamma), 4),
        "theta": round(float(theta), 4),
        "vega": round(float(vega), 4),
        "rho": round(float(rho), 4),
    }


def implied_volatility(market_price: float, S: float, K: float, T: float, r: float, option_type: str) -> float:
    """Solve for implied volatility using a Black-Scholes price root."""
    option_type = _validate_option_type(option_type)
    _validate_positive_inputs(S, K)
    if T <= 0:
        return 0.0

    lower_bound = max(0.0, S - K * math.exp(-r * T)) if option_type == "call" else max(0.0, K * math.exp(-r * T) - S)
    if market_price <= lower_bound:
        return 0.0

    def objective(sigma: float) -> float:
        return black_scholes_price(S=S, K=K, T=T, r=r, sigma=sigma, option_type=option_type) - market_price

    try:
        return round(float(brentq(objective, 1e-6, 10.0, xtol=1e-6)), 4)
    except ValueError:
        return 0.0


def iv_rank(current_iv: float, iv_52w_low: float, iv_52w_high: float) -> float:
    """Return IV rank as a percentage from 0 to 100."""
    if iv_52w_high <= iv_52w_low:
        return 0.0
    rank = (current_iv - iv_52w_low) / (iv_52w_high - iv_52w_low) * 100.0
    return round(float(min(100.0, max(0.0, rank))), 2)


def historical_volatility(prices: pd.Series, window: int = 20) -> float:
    """Return annualized historical volatility from a price series."""
    if prices is None or len(prices) < 2:
        return 0.0

    log_returns = np.log(prices / prices.shift(1)).dropna()
    if len(log_returns) < window:
        return 0.0

    hv = log_returns.rolling(window).std().iloc[-1] * math.sqrt(252.0)
    if pd.isna(hv):
        return 0.0
    return round(float(hv), 4)


def prob_profit_from_delta(delta: float, position_type: str) -> float:
    """Approximate probability of profit from delta."""
    abs_delta = min(1.0, max(0.0, abs(delta)))
    if position_type in {"short_call", "short_put"}:
        return round(float(1.0 - abs_delta), 4)
    if position_type in {"long_call", "long_put"}:
        return round(float(abs_delta), 4)
    raise ValueError("position_type must be one of: short_call, short_put, long_call, long_put")
