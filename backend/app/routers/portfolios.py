from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import Portfolio
from app.routers.auth import get_current_user
from app.schemas.portfolio import PortfolioCreate, PortfolioOut

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


def _get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "", 1).strip()
    return get_current_user(token, db)


def _get_portfolio_or_404(portfolio_id: int, user_id: int, db: Session) -> Portfolio:
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id)
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.post("/", response_model=PortfolioOut, status_code=201)
def create_portfolio(
    body: PortfolioCreate,
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    portfolio = Portfolio(user_id=user.id, name=body.name)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/", response_model=list[PortfolioOut])
def list_portfolios(user=Depends(_get_user), db: Session = Depends(get_db)):
    return db.query(Portfolio).filter(Portfolio.user_id == user.id).all()
