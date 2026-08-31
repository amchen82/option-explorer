from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class IdeasResponse(BaseModel):
    """Everything the ideas screen needs for one ticker, in one payload."""

    model_config = ConfigDict(from_attributes=True)

    symbol: str
    as_of: str
    data_quality: str
    expiration: str
    expiration_bucket: str
    dte: int
    quote: dict[str, Any]
    market_view: dict[str, Any]
    volatility: dict[str, Any]
    ideas: list[dict[str, Any]]
    disclaimer: str
