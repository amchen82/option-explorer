from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.engine.options_math import black_scholes_price
from app.services.option_chain import ChainResult, Contract

SPOT = 230.0
DTE = 35
IV = 0.30


def build_contract(
    contract_type: str,
    strike: float,
    expiration: date,
    *,
    spot: float = SPOT,
    iv: float = IV,
    dte: int = DTE,
    open_interest: int = 800,
    volume: int = 250,
    spread: float = 0.02,
) -> Contract:
    """Build one realistically priced contract via Black-Scholes."""
    price = round(float(black_scholes_price(spot, strike, dte / 365.0, 0.05, iv, contract_type)), 2)
    price = max(price, 0.05)
    half = price * spread / 2.0

    return Contract(
        symbol="TEST",
        contract_type=contract_type,
        strike=float(strike),
        expiration=expiration,
        bid=round(price - half, 2),
        ask=round(price + half, 2),
        last=price,
        mid=price,
        volume=volume,
        open_interest=open_interest,
        implied_volatility=iv,
    )


def build_chain(
    *,
    data_quality: str = "live",
    open_interest: int = 800,
    spread: float = 0.02,
    spot: float = SPOT,
    dte: int = DTE,
) -> ChainResult:
    """A full strike ladder wide enough to satisfy every strategy template."""
    expiration = date.today() + timedelta(days=dte)
    strikes = [float(strike) for strike in range(160, 305, 5)]

    calls = [
        build_contract("call", strike, expiration, spot=spot, dte=dte, open_interest=open_interest, spread=spread)
        for strike in strikes
    ]
    puts = [
        build_contract("put", strike, expiration, spot=spot, dte=dte, open_interest=open_interest, spread=spread)
        for strike in strikes
    ]

    return ChainResult(
        symbol="TEST",
        expiration=expiration,
        dte=dte,
        calls=calls,
        puts=puts,
        data_quality=data_quality,
    )


@pytest.fixture
def sample_chain() -> ChainResult:
    return build_chain()


@pytest.fixture
def bullish_signals() -> dict:
    return {
        "price": SPOT,
        "rsi_14": 58.0,
        "above_50dma": True,
        "above_200dma": True,
        "52w_high": 260.0,
        "52w_low": 164.0,
        "current_iv": 0.285,
        "iv_rank": 62.0,
        "hv_20": 0.24,
        "earnings_days_away": None,
    }


@pytest.fixture
def bearish_signals() -> dict:
    return {
        "price": 180.0,
        "rsi_14": 38.0,
        "above_50dma": False,
        "above_200dma": False,
        "52w_high": 260.0,
        "52w_low": 164.0,
        "current_iv": 0.285,
        "iv_rank": 20.0,
        "hv_20": 0.30,
        "earnings_days_away": None,
    }
