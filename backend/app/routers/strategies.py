from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.alerts import check_proactive_alerts
from app.engine.bear_put_spread import BearPutSpreadStrategy
from app.engine.bull_call_spread import BullCallSpreadStrategy
from app.engine.cash_secured_put import CashSecuredPutStrategy
from app.engine.collar import CollarStrategy
from app.engine.covered_call import CoveredCallStrategy
from app.engine.protective_put import ProtectivePutStrategy
from app.models.portfolio import OptionsPosition, StockPosition
from app.routers.auth import get_current_user
from app.routers.portfolios import _get_portfolio_or_404
from app.schemas.strategy import StrategiesResponse, StrategyPositionOut
from app.services.market_data import MarketDataService

router = APIRouter(prefix="/strategies", tags=["strategies"])
market_data_svc = MarketDataService()

_INCOME_STRATEGIES = [CoveredCallStrategy(), CashSecuredPutStrategy()]
_HEDGE_STRATEGIES = [
    ProtectivePutStrategy(),
    CollarStrategy(),
    BullCallSpreadStrategy(),
    BearPutSpreadStrategy(),
]


def _build_strategies_response(symbol: str, position: dict, existing_options: list[dict]):
    quote = market_data_svc.get_stock_quote(symbol)
    market_signals = market_data_svc.get_market_signals(symbol)
    market_data = {**quote, **market_signals}
    market_data_stale = bool(quote.get("stale", False))
    quote_price = float(quote.get("price") or 0.0)
    reference_price = quote_price or float(position.get("cost_basis") or 0.0)

    if quote_price <= 0.0:
        alerts = check_proactive_alerts(position, market_data, existing_options)
        return {
            "symbol": symbol,
            "reference_price": reference_price,
            "position": StrategyPositionOut(**position),
            "income": [],
            "hedge": [],
            "all": [],
            "alerts": alerts,
            "market_data_stale": market_data_stale,
        }

    income: list[dict] = []
    for strategy in _INCOME_STRATEGIES:
        income.extend(strategy.analyze(position, market_data))

    hedge: list[dict] = []
    for strategy in _HEDGE_STRATEGIES:
        hedge.extend(strategy.analyze(position, market_data))

    alerts = check_proactive_alerts(position, market_data, existing_options)

    return {
        "symbol": symbol,
        "reference_price": reference_price,
        "position": StrategyPositionOut(**position),
        "income": income,
        "hedge": hedge,
        "all": income + hedge,
        "alerts": alerts,
        "market_data_stale": market_data_stale,
    }


def _get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "", 1).strip()
    return get_current_user(token, db)


@router.get("/public/{symbol}", response_model=StrategiesResponse)
def get_public_strategies(
    symbol: str,
    shares: float = Query(default=100.0, ge=0.0),
    cost_basis: float | None = Query(default=None, ge=0.0),
):
    normalized_symbol = symbol.upper()
    position = {
        "symbol": normalized_symbol,
        "shares": float(shares),
        "cost_basis": float(cost_basis or 0.0),
        "cash": float((cost_basis or 0.0) * shares),
    }

    response = _build_strategies_response(normalized_symbol, position, [])

    if cost_basis is None and response["reference_price"] > 0:
        position["cost_basis"] = response["reference_price"]
        position["cash"] = response["reference_price"] * shares
        response["position"] = StrategyPositionOut(**position)

    return response


@router.get("/{portfolio_id}/{symbol}", response_model=StrategiesResponse)
def get_strategies(
    portfolio_id: int,
    symbol: str,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)

    stock_pos = (
        db.query(StockPosition)
        .filter(StockPosition.portfolio_id == portfolio_id, StockPosition.symbol == symbol)
        .first()
    )

    position = {
        "symbol": symbol,
        "shares": float(stock_pos.shares) if stock_pos else 0.0,
        "cost_basis": float(stock_pos.cost_basis) if stock_pos else 0.0,
        "cash": float(stock_pos.cost_basis * stock_pos.shares) if stock_pos else 0.0,
    }

    existing_options = [
        {
            "symbol": opt.symbol,
            "contract_type": opt.contract_type,
            "position_type": opt.position_type,
            "strike": opt.strike,
            "expiration": opt.expiration,
            "quantity": opt.quantity,
        }
        for opt in db.query(OptionsPosition)
        .filter(OptionsPosition.portfolio_id == portfolio_id, OptionsPosition.symbol == symbol)
        .all()
    ]

    return _build_strategies_response(symbol, position, existing_options)
