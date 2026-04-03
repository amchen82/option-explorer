from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def override_db_dependency():
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def portfolio_with_position(client):
    response = client.post("/auth/test-token", json={"email": "user@example.com"})
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    portfolio = client.post("/portfolios/", json={"name": "P"}, headers=headers).json()
    client.post(
        f"/portfolios/{portfolio['id']}/positions/stock",
        json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0},
        headers=headers,
    )
    return portfolio["id"], headers


MOCK_MARKET_DATA = {
    "symbol": "AAPL",
    "price": 182.5,
    "52w_high": 220.0,
    "52w_low": 150.0,
    "earnings_date": None,
    "stale": False,
}

MOCK_SIGNALS = {
    "rsi_14": 61.0,
    "above_50dma": True,
    "above_200dma": True,
    "hv_20": 0.25,
    "hv_60": 0.31,
    "iv_rank": 65.0,
    "current_iv": 0.28,
    "52w_high": 220.0,
    "52w_low": 150.0,
}


def test_get_strategies_for_position(client, portfolio_with_position):
    portfolio_id, headers = portfolio_with_position

    with patch("app.services.market_data.MarketDataService.get_stock_quote", return_value=MOCK_MARKET_DATA), patch(
        "app.services.market_data.MarketDataService.get_market_signals",
        return_value=MOCK_SIGNALS,
    ):
        response = client.get(f"/strategies/{portfolio_id}/AAPL", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert "income" in body
    assert "hedge" in body
    assert "alerts" in body
    assert len(body["income"]) > 0


def test_strategies_require_auth(client, portfolio_with_position):
    portfolio_id, _ = portfolio_with_position

    response = client.get(f"/strategies/{portfolio_id}/AAPL")

    assert response.status_code == 422


def test_strategies_unknown_symbol(client, portfolio_with_position):
    portfolio_id, headers = portfolio_with_position

    with patch(
        "app.services.market_data.MarketDataService.get_stock_quote",
        return_value={**MOCK_MARKET_DATA, "price": 0.0, "stale": True},
    ), patch("app.services.market_data.MarketDataService.get_market_signals", return_value=MOCK_SIGNALS):
        response = client.get(f"/strategies/{portfolio_id}/AAPL", headers=headers)

    assert response.status_code == 200
    assert response.json()["market_data_stale"] is True
