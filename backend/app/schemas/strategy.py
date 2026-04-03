from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class StrategyPositionOut(BaseModel):
    symbol: str
    shares: float
    cost_basis: float
    cash: float


class StrategiesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    reference_price: float
    position: StrategyPositionOut
    income: list[dict[str, Any]]
    hedge: list[dict[str, Any]]
    all: list[dict[str, Any]]
    alerts: list[dict[str, Any]]
    market_data_stale: bool
