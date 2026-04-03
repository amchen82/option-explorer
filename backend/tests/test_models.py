from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.portfolio import OptionsPosition, Portfolio, StockPosition
from app.models.strategy import StrategyRecommendation
from app.models.user import User


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    return session


def test_create_user() -> None:
    session = make_session()

    user = User(email="test@example.com", oauth_provider="google", oauth_id="123")
    session.add(user)
    session.commit()

    assert session.query(User).filter_by(email="test@example.com").first() is not None


def test_create_portfolio_with_positions() -> None:
    session = make_session()

    user = User(email="test@example.com", oauth_provider="google", oauth_id="123")
    session.add(user)
    session.commit()

    portfolio = Portfolio(user_id=user.id, name="Main")
    session.add(portfolio)
    session.commit()

    position = StockPosition(portfolio_id=portfolio.id, symbol="AAPL", shares=100, cost_basis=150.0)
    session.add(position)
    session.commit()

    assert session.query(StockPosition).filter_by(symbol="AAPL").first().shares == 100


def test_create_options_position() -> None:
    session = make_session()

    user = User(email="u@e.com", oauth_provider="github", oauth_id="456")
    session.add(user)
    session.commit()

    portfolio = Portfolio(user_id=user.id, name="P")
    session.add(portfolio)
    session.commit()

    option = OptionsPosition(
        portfolio_id=portfolio.id,
        symbol="AAPL",
        contract_type="call",
        position_type="short",
        strike=195.0,
        expiration="2026-04-18",
        quantity=1,
        premium_paid=3.20,
    )
    session.add(option)
    session.commit()

    assert session.query(OptionsPosition).first().contract_type == "call"
    assert session.query(OptionsPosition).first().expiration == "2026-04-18"


def test_strategy_recommendation() -> None:
    session = make_session()

    user = User(email="u@e.com", oauth_provider="google", oauth_id="789")
    session.add(user)
    session.commit()

    portfolio = Portfolio(user_id=user.id, name="P")
    session.add(portfolio)
    session.commit()

    recommendation = StrategyRecommendation(
        portfolio_id=portfolio.id,
        symbol="AAPL",
        strategy_type="covered_call",
        parameters={"strike": 195.0},
        status="active",
    )
    session.add(recommendation)
    session.commit()

    assert session.query(StrategyRecommendation).first().strategy_type == "covered_call"
