import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


TEST_DB_URL = "sqlite+pysqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
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


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    response = client.post("/auth/test-token", json={"email": "test@example.com"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_test_token_creates_user_and_returns_access_token(client):
    response = client.post("/auth/test-token", json={"email": "test@example.com"})

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_create_portfolio(client, auth_headers):
    response = client.post("/portfolios/", json={"name": "My Portfolio"}, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["name"] == "My Portfolio"


def test_list_portfolios(client, auth_headers):
    client.post("/portfolios/", json={"name": "Portfolio A"}, headers=auth_headers)
    client.post("/portfolios/", json={"name": "Portfolio B"}, headers=auth_headers)

    response = client.get("/portfolios/", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_add_stock_position(client, auth_headers):
    portfolio = client.post("/portfolios/", json={"name": "P"}, headers=auth_headers).json()

    response = client.post(
        f"/portfolios/{portfolio['id']}/positions/stock",
        json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0},
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["symbol"] == "AAPL"


def test_list_stock_positions(client, auth_headers):
    portfolio = client.post("/portfolios/", json={"name": "P"}, headers=auth_headers).json()
    client.post(
        f"/portfolios/{portfolio['id']}/positions/stock",
        json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0},
        headers=auth_headers,
    )

    response = client.get(f"/portfolios/{portfolio['id']}/positions/stock", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_add_options_position(client, auth_headers):
    portfolio = client.post("/portfolios/", json={"name": "P"}, headers=auth_headers).json()

    response = client.post(
        f"/portfolios/{portfolio['id']}/positions/options",
        json={
            "symbol": "AAPL",
            "contract_type": "call",
            "position_type": "short",
            "strike": 195.0,
            "expiration": "2026-04-18",
            "quantity": 1,
            "premium_paid": 3.2,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["contract_type"] == "call"


def test_cannot_access_other_users_portfolio(client):
    r1 = client.post("/auth/test-token", json={"email": "user1@example.com"})
    h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}
    portfolio = client.post("/portfolios/", json={"name": "P1"}, headers=h1).json()

    r2 = client.post("/auth/test-token", json={"email": "user2@example.com"})
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}
    response = client.get(f"/portfolios/{portfolio['id']}/positions/stock", headers=h2)

    assert response.status_code == 404
