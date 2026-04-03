from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import OptionsPosition, StockPosition
from app.routers.portfolios import _get_portfolio_or_404, _get_user
from app.schemas.portfolio import (
    OptionsPositionCreate,
    OptionsPositionOut,
    StockPositionCreate,
    StockPositionOut,
)

router = APIRouter(prefix="/portfolios", tags=["positions"])


@router.post("/{portfolio_id}/positions/stock", response_model=StockPositionOut, status_code=201)
def add_stock_position(
    portfolio_id: int,
    body: StockPositionCreate,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    position = StockPosition(portfolio_id=portfolio_id, **body.model_dump())
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


@router.get("/{portfolio_id}/positions/stock", response_model=list[StockPositionOut])
def list_stock_positions(
    portfolio_id: int,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    return db.query(StockPosition).filter(StockPosition.portfolio_id == portfolio_id).all()


@router.post("/{portfolio_id}/positions/options", response_model=OptionsPositionOut, status_code=201)
def add_options_position(
    portfolio_id: int,
    body: OptionsPositionCreate,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    position = OptionsPosition(portfolio_id=portfolio_id, **body.model_dump())
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


@router.get("/{portfolio_id}/positions/options", response_model=list[OptionsPositionOut])
def list_options_positions(
    portfolio_id: int,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    return db.query(OptionsPosition).filter(OptionsPosition.portfolio_id == portfolio_id).all()
