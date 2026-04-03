from datetime import date

from pydantic import BaseModel, ConfigDict


class PortfolioCreate(BaseModel):
    name: str


class PortfolioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class StockPositionCreate(BaseModel):
    symbol: str
    shares: float
    cost_basis: float
    purchase_date: date | None = None
    notes: str | None = None


class StockPositionOut(StockPositionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    portfolio_id: int


class OptionsPositionCreate(BaseModel):
    symbol: str
    contract_type: str
    position_type: str
    strike: float
    expiration: str
    quantity: int
    premium_paid: float


class OptionsPositionOut(OptionsPositionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    portfolio_id: int
