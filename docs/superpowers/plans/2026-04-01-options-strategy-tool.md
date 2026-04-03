# Options Strategy Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-user web app where users manage stock portfolios and receive options strategy recommendations for income generation and hedging.

**Architecture:** FastAPI (Python) backend with a strategy engine (Black-Scholes, Greeks, IV, technicals), Next.js frontend, PostgreSQL database, OAuth auth via Google/GitHub. Market data from yfinance, cached in-memory.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy, Alembic, yfinance, scipy, numpy, pandas, Next.js 14, NextAuth.js, TypeScript, Tailwind CSS, PostgreSQL, Docker.

**Spec:** `docs/superpowers/specs/2026-03-31-options-strategy-tool-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/.env.example`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/layout.tsx`
- Create: `docker-compose.yml`
- Create: `.gitignore`

- [ ] **Step 1: Create backend requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
alembic==1.13.3
psycopg2-binary==2.9.9
pydantic==2.9.2
pydantic-settings==2.5.2
python-jose[cryptography]==3.3.0
httpx==0.27.2
yfinance==0.2.44
scipy==1.14.1
numpy==2.1.2
pandas==2.2.3
pytest==8.3.3
pytest-asyncio==0.24.0
httpx==0.27.2
vcrpy==6.0.2
python-multipart==0.0.12
```

- [ ] **Step 2: Create backend/app/config.py**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/options_tool"
    secret_key: str = "change-me-in-production"
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    market_data_cache_ttl_seconds: int = 900  # 15 min
    historical_data_cache_ttl_seconds: int = 3600  # 1 hour

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: Create backend/app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Options Strategy Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Create backend/.env.example**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/options_tool
SECRET_KEY=change-me-in-production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

- [ ] **Step 5: Create docker-compose.yml**

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: options_tool
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: change-me
      NEXT_PUBLIC_API_URL: http://localhost:8000

volumes:
  pgdata:
```

- [ ] **Step 6: Scaffold Next.js frontend**

Run: `cd frontend && npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`

Expected: Next.js 14 project created with TypeScript and Tailwind.

- [ ] **Step 7: Install frontend dependencies**

```bash
cd frontend && npm install next-auth @auth/core axios recharts
```

- [ ] **Step 8: Create .gitignore**

```
# Python
__pycache__/
*.pyc
*.pyo
.env
venv/
.venv/

# Node
node_modules/
.next/
.env.local

# Superpowers
.superpowers/

# Misc
*.log
.DS_Store
```

- [ ] **Step 9: Verify backend starts**

```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
```

Expected: `Application startup complete.` with health check at http://localhost:8000/health returning `{"status":"ok"}`

- [ ] **Step 10: Commit**

```bash
git init && git add backend/ frontend/ docker-compose.yml .gitignore
git commit -m "feat: project scaffolding — FastAPI backend + Next.js frontend"
```

---

## Task 2: Database Models & Migrations

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/portfolio.py`
- Create: `backend/app/models/strategy.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/0001_initial.py`
- Create: `backend/tests/test_models.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_models.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.user import User
from app.models.portfolio import Portfolio, StockPosition, OptionsPosition
from app.models.strategy import StrategyRecommendation

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_create_user(db):
    user = User(email="test@example.com", oauth_provider="google", oauth_id="123")
    db.add(user)
    db.commit()
    assert db.query(User).filter_by(email="test@example.com").first() is not None

def test_create_portfolio_with_positions(db):
    user = User(email="test@example.com", oauth_provider="google", oauth_id="123")
    db.add(user)
    db.commit()
    portfolio = Portfolio(user_id=user.id, name="Main")
    db.add(portfolio)
    db.commit()
    pos = StockPosition(portfolio_id=portfolio.id, symbol="AAPL", shares=100, cost_basis=150.0)
    db.add(pos)
    db.commit()
    assert db.query(StockPosition).filter_by(symbol="AAPL").first().shares == 100

def test_create_options_position(db):
    user = User(email="u@e.com", oauth_provider="github", oauth_id="456")
    db.add(user)
    db.commit()
    portfolio = Portfolio(user_id=user.id, name="P")
    db.add(portfolio)
    db.commit()
    opt = OptionsPosition(
        portfolio_id=portfolio.id, symbol="AAPL",
        contract_type="call", position_type="short",
        strike=195.0, expiration="2026-04-18",
        quantity=1, premium_paid=3.20
    )
    db.add(opt)
    db.commit()
    assert db.query(OptionsPosition).first().contract_type == "call"

def test_strategy_recommendation(db):
    user = User(email="u@e.com", oauth_provider="google", oauth_id="789")
    db.add(user)
    db.commit()
    portfolio = Portfolio(user_id=user.id, name="P")
    db.add(portfolio)
    db.commit()
    rec = StrategyRecommendation(
        portfolio_id=portfolio.id, symbol="AAPL",
        strategy_type="covered_call", parameters={"strike": 195.0},
        status="active"
    )
    db.add(rec)
    db.commit()
    assert db.query(StrategyRecommendation).first().strategy_type == "covered_call"
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && pytest tests/test_models.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.database'`

- [ ] **Step 3: Create backend/app/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Create backend/app/models/user.py**

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    oauth_provider = Column(String, nullable=False)
    oauth_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 5: Create backend/app/models/portfolio.py**

```python
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from app.database import Base

class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class StockPosition(Base):
    __tablename__ = "stock_positions"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    shares = Column(Float, nullable=False)
    cost_basis = Column(Float, nullable=False)
    purchase_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

class OptionsPosition(Base):
    __tablename__ = "options_positions"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    contract_type = Column(String, nullable=False)   # "call" | "put"
    position_type = Column(String, nullable=False)   # "long" | "short"
    strike = Column(Float, nullable=False)
    expiration = Column(String, nullable=False)      # ISO date string
    quantity = Column(Integer, nullable=False)
    premium_paid = Column(Float, nullable=False)
    opened_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 6: Create backend/app/models/strategy.py**

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from app.database import Base

class StrategyRecommendation(Base):
    __tablename__ = "strategy_recommendations"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    strategy_type = Column(String, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    parameters = Column(JSON, nullable=False, default=dict)
    status = Column(String, nullable=False, default="active")  # active|expired|dismissed
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_models.py -v
```

Expected: 4 passed.

- [ ] **Step 8: Set up Alembic and create initial migration**

```bash
cd backend && alembic init alembic
```

Edit `backend/alembic/env.py` — replace the `target_metadata = None` line with:

```python
from app.models.user import User
from app.models.portfolio import Portfolio, StockPosition, OptionsPosition
from app.models.strategy import StrategyRecommendation
from app.database import Base
target_metadata = Base.metadata
```

Then generate migration:
```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

Expected: Tables created in PostgreSQL.

- [ ] **Step 9: Commit**

```bash
git add backend/app/database.py backend/app/models/ backend/alembic/ backend/tests/test_models.py
git commit -m "feat: database models and initial migration"
```

---

## Task 3: Options Math Engine

**Files:**
- Create: `backend/app/engine/__init__.py`
- Create: `backend/app/engine/options_math.py`
- Create: `backend/tests/test_options_math.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_options_math.py`:

```python
import pytest
from app.engine.options_math import (
    black_scholes_price,
    calculate_greeks,
    implied_volatility,
    iv_rank,
    historical_volatility,
    prob_profit_from_delta,
)

# Known Black-Scholes values (verified against standard calculators)
# S=100, K=100, T=0.25 (91 days), r=0.05, sigma=0.20 → call ≈ 5.07, put ≈ 3.83
def test_black_scholes_call():
    price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="call")
    assert abs(price - 5.07) < 0.05

def test_black_scholes_put():
    price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="put")
    assert abs(price - 3.83) < 0.05

def test_greeks_call_delta_atm():
    greeks = calculate_greeks(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="call")
    # ATM call delta should be near 0.5
    assert 0.45 < greeks["delta"] < 0.60
    assert greeks["gamma"] > 0
    assert greeks["theta"] < 0   # time decay is negative for buyer
    assert greeks["vega"] > 0

def test_greeks_put_delta_atm():
    greeks = calculate_greeks(S=100, K=100, T=0.25, r=0.05, sigma=0.20, option_type="put")
    assert -0.60 < greeks["delta"] < -0.40

def test_implied_volatility():
    # Use a known price to back out IV, should recover original sigma
    market_price = black_scholes_price(S=100, K=100, T=0.25, r=0.05, sigma=0.25, option_type="call")
    iv = implied_volatility(market_price=market_price, S=100, K=100, T=0.25, r=0.05, option_type="call")
    assert abs(iv - 0.25) < 0.001

def test_iv_rank():
    rank = iv_rank(current_iv=0.30, iv_52w_low=0.15, iv_52w_high=0.45)
    assert abs(rank - 50.0) < 0.01

def test_iv_rank_extremes():
    assert iv_rank(0.15, 0.15, 0.45) == 0.0
    assert iv_rank(0.45, 0.15, 0.45) == 100.0

def test_historical_volatility():
    import pandas as pd
    import numpy as np
    np.random.seed(42)
    prices = pd.Series(100 * np.exp(np.cumsum(np.random.normal(0, 0.01, 60))))
    hv = historical_volatility(prices, window=20)
    assert 0.0 < hv < 1.0  # annualized, between 0% and 100%

def test_prob_profit_from_delta():
    # For a short call with delta 0.30, P(profit) ≈ 1 - 0.30 = 0.70
    assert abs(prob_profit_from_delta(delta=0.30, position_type="short_call") - 0.70) < 0.01
    # For a short put with delta -0.25, P(profit) ≈ 1 - 0.25 = 0.75
    assert abs(prob_profit_from_delta(delta=-0.25, position_type="short_put") - 0.75) < 0.01
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_options_math.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.engine.options_math'`

- [ ] **Step 3: Implement backend/app/engine/options_math.py**

```python
import math
import numpy as np
import pandas as pd
from scipy.stats import norm
from scipy.optimize import brentq


def black_scholes_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str) -> float:
    """Black-Scholes option price. T in years, sigma annualized."""
    if T <= 0:
        return max(0.0, (S - K) if option_type == "call" else (K - S))
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    if option_type == "call":
        return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    else:
        return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str) -> dict:
    """Calculate option Greeks."""
    if T <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))
    vega = S * norm.pdf(d1) * math.sqrt(T) / 100  # per 1% IV move
    if option_type == "call":
        delta = norm.cdf(d1)
        theta = (-(S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365
        rho = K * T * math.exp(-r * T) * norm.cdf(d2) / 100
    else:
        delta = norm.cdf(d1) - 1
        theta = (-(S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365
        rho = -K * T * math.exp(-r * T) * norm.cdf(-d2) / 100
    return {"delta": round(delta, 4), "gamma": round(gamma, 4),
            "theta": round(theta, 4), "vega": round(vega, 4), "rho": round(rho, 4)}


def implied_volatility(market_price: float, S: float, K: float, T: float, r: float, option_type: str) -> float:
    """Newton-Raphson implied volatility. Returns annualized IV."""
    intrinsic = max(0.0, (S - K) if option_type == "call" else (K - S))
    if market_price <= intrinsic:
        return 0.0
    try:
        iv = brentq(
            lambda sigma: black_scholes_price(S, K, T, r, sigma, option_type) - market_price,
            1e-6, 10.0, xtol=1e-6
        )
        return round(iv, 4)
    except ValueError:
        return 0.0


def iv_rank(current_iv: float, iv_52w_low: float, iv_52w_high: float) -> float:
    """IV Rank as percentage (0-100). High = good time to sell premium."""
    if iv_52w_high == iv_52w_low:
        return 0.0
    return round((current_iv - iv_52w_low) / (iv_52w_high - iv_52w_low) * 100, 2)


def historical_volatility(prices: pd.Series, window: int = 20) -> float:
    """Annualized historical volatility from price series."""
    log_returns = np.log(prices / prices.shift(1)).dropna()
    if len(log_returns) < window:
        return 0.0
    hv = log_returns.rolling(window).std().iloc[-1] * math.sqrt(252)
    return round(float(hv), 4)


def prob_profit_from_delta(delta: float, position_type: str) -> float:
    """Estimate probability of profit from delta (approximation)."""
    abs_delta = abs(delta)
    if position_type in ("short_call", "short_put"):
        return round(1.0 - abs_delta, 4)
    else:  # long_call, long_put
        return round(abs_delta, 4)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_options_math.py -v
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/ backend/tests/test_options_math.py
git commit -m "feat: Black-Scholes options math engine with Greeks and IV"
```

---

## Task 4: Technical Signals

**Files:**
- Create: `backend/app/engine/technicals.py`
- Create: `backend/tests/test_technicals.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_technicals.py`:

```python
import pytest
import pandas as pd
import numpy as np
from app.engine.technicals import calculate_rsi, moving_average, is_above_ma, earnings_days_away

def make_prices(n=30, start=100.0, trend=0.5):
    """Generate synthetic price series."""
    prices = [start]
    for _ in range(n - 1):
        prices.append(prices[-1] + trend + np.random.normal(0, 1))
    return pd.Series(prices)

def test_rsi_range():
    prices = make_prices(50)
    rsi = calculate_rsi(prices, period=14)
    assert 0 <= rsi <= 100

def test_rsi_overbought():
    # Strongly trending up → RSI should be high
    prices = pd.Series([float(i) for i in range(1, 51)])
    rsi = calculate_rsi(prices, period=14)
    assert rsi > 70

def test_rsi_oversold():
    # Strongly trending down → RSI should be low
    prices = pd.Series([float(50 - i) for i in range(50)])
    rsi = calculate_rsi(prices, period=14)
    assert rsi < 30

def test_moving_average():
    prices = pd.Series([float(i) for i in range(1, 51)])
    ma50 = moving_average(prices, period=50)
    assert abs(ma50 - 25.5) < 0.1

def test_is_above_ma_true():
    prices = pd.Series([float(i) for i in range(1, 51)])
    # Current price (50) is above 50-period MA (25.5)
    assert is_above_ma(current_price=50.0, prices=prices, period=50) is True

def test_is_above_ma_false():
    prices = pd.Series([float(50 - i) for i in range(50)])
    # Current price (1) is below MA
    assert is_above_ma(current_price=1.0, prices=prices, period=50) is False

def test_earnings_days_away_future():
    from datetime import date, timedelta
    future_date = (date.today() + timedelta(days=15)).isoformat()
    result = earnings_days_away(future_date)
    assert 14 <= result <= 16

def test_earnings_days_away_past():
    result = earnings_days_away("2020-01-01")
    assert result < 0

def test_earnings_days_away_none():
    result = earnings_days_away(None)
    assert result is None
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_technicals.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement backend/app/engine/technicals.py**

```python
from datetime import date
from typing import Optional
import numpy as np
import pandas as pd


def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """RSI (Relative Strength Index). Returns 0-100."""
    if len(prices) < period + 1:
        return 50.0
    delta = prices.diff().dropna()
    gains = delta.clip(lower=0)
    losses = (-delta).clip(lower=0)
    avg_gain = gains.ewm(com=period - 1, min_periods=period).mean().iloc[-1]
    avg_loss = losses.ewm(com=period - 1, min_periods=period).mean().iloc[-1]
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(float(100.0 - (100.0 / (1.0 + rs))), 2)


def moving_average(prices: pd.Series, period: int) -> float:
    """Simple moving average of last `period` prices."""
    if len(prices) < period:
        return float(prices.mean())
    return round(float(prices.iloc[-period:].mean()), 4)


def is_above_ma(current_price: float, prices: pd.Series, period: int) -> bool:
    """True if current_price is above the period-day SMA."""
    ma = moving_average(prices, period)
    return current_price > ma


def earnings_days_away(earnings_date_iso: Optional[str]) -> Optional[int]:
    """Days until earnings. Negative if in the past. None if unknown."""
    if earnings_date_iso is None:
        return None
    try:
        earnings = date.fromisoformat(earnings_date_iso)
        return (earnings - date.today()).days
    except ValueError:
        return None
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_technicals.py -v
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/technicals.py backend/tests/test_technicals.py
git commit -m "feat: technical indicators (RSI, moving averages, earnings)"
```

---

## Task 5: Market Data Service

**Files:**
- Create: `backend/app/services/market_data.py`
- Create: `backend/tests/test_market_data.py`
- Create: `backend/tests/cassettes/` (VCR cassette directory)

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_market_data.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np
from app.services.market_data import MarketDataService

@pytest.fixture
def svc():
    return MarketDataService()

def make_mock_ticker(price=182.50, hist_len=60):
    ticker = MagicMock()
    ticker.info = {
        "currentPrice": price,
        "fiftyTwoWeekHigh": 220.0,
        "fiftyTwoWeekLow": 150.0,
        "earningsDate": None,
    }
    dates = pd.date_range(end="2026-04-01", periods=hist_len, freq="B")
    prices = price * np.exp(np.cumsum(np.random.normal(0, 0.01, hist_len)))
    ticker.history.return_value = pd.DataFrame({"Close": prices}, index=dates)
    return ticker

def test_get_stock_quote(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        quote = svc.get_stock_quote("AAPL")
    assert quote["symbol"] == "AAPL"
    assert quote["price"] == 182.50
    assert "52w_high" in quote
    assert "52w_low" in quote

def test_get_stock_quote_cached(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)) as mock:
        svc.get_stock_quote("AAPL")
        svc.get_stock_quote("AAPL")
    # yfinance.Ticker should only be called once (second is cached)
    assert mock.call_count == 1

def test_get_historical_prices(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker()):
        hist = svc.get_historical_prices("AAPL", days=60)
    assert isinstance(hist, pd.Series)
    assert len(hist) == 60

def test_get_market_signals(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        signals = svc.get_market_signals("AAPL")
    assert "rsi_14" in signals
    assert "above_50dma" in signals
    assert "iv_rank" in signals
    assert "hv_20" in signals

def test_stale_data_on_failure(svc):
    with patch("yfinance.Ticker", return_value=make_mock_ticker(182.50)):
        svc.get_stock_quote("AAPL")
    # Now simulate failure
    with patch("yfinance.Ticker", side_effect=Exception("network error")):
        quote = svc.get_stock_quote("AAPL")
    assert quote["price"] == 182.50
    assert quote.get("stale") is True
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_market_data.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement backend/app/services/market_data.py**

```python
import time
from typing import Optional
import yfinance as yf
import pandas as pd
from app.config import settings
from app.engine.technicals import calculate_rsi, moving_average, is_above_ma
from app.engine.options_math import iv_rank, historical_volatility

_cache: dict = {}


def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < ttl:
        return entry["data"]
    return None


def _cache_set(key: str, data):
    _cache[key] = {"ts": time.time(), "data": data}


class MarketDataService:
    def get_stock_quote(self, symbol: str) -> dict:
        key = f"quote:{symbol}"
        cached = _cache_get(key, settings.market_data_cache_ttl_seconds)
        if cached:
            return cached
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            data = {
                "symbol": symbol,
                "price": info.get("currentPrice") or info.get("regularMarketPrice", 0.0),
                "52w_high": info.get("fiftyTwoWeekHigh", 0.0),
                "52w_low": info.get("fiftyTwoWeekLow", 0.0),
                "earnings_date": info.get("earningsDate"),
                "stale": False,
            }
            _cache_set(key, data)
            return data
        except Exception:
            stale = _cache.get(key, {}).get("data")
            if stale:
                return {**stale, "stale": True}
            return {"symbol": symbol, "price": 0.0, "52w_high": 0.0, "52w_low": 0.0,
                    "earnings_date": None, "stale": True}

    def get_historical_prices(self, symbol: str, days: int = 60) -> pd.Series:
        key = f"hist:{symbol}:{days}"
        cached = _cache_get(key, settings.historical_data_cache_ttl_seconds)
        if cached is not None:
            return cached
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=f"{days}d")
        prices = hist["Close"].tail(days)
        _cache_set(key, prices)
        return prices

    def get_market_signals(self, symbol: str) -> dict:
        quote = self.get_stock_quote(symbol)
        prices = self.get_historical_prices(symbol, days=252)
        current_price = quote["price"]
        rsi = calculate_rsi(prices, period=14)
        above_50dma = is_above_ma(current_price, prices, period=50)
        above_200dma = is_above_ma(current_price, prices, period=200)
        hv_20 = historical_volatility(prices, window=20)
        hv_60 = historical_volatility(prices, window=60)
        # Use HV as IV proxy (real options chain IV requires paid API)
        current_iv = hv_20 * 1.1  # typical IV premium over HV
        iv_52w_low = prices.pct_change().std() * (252 ** 0.5) * 0.9
        iv_52w_high = prices.pct_change().std() * (252 ** 0.5) * 1.4
        ivr = iv_rank(current_iv, float(iv_52w_low), float(iv_52w_high))
        return {
            "rsi_14": rsi,
            "above_50dma": above_50dma,
            "above_200dma": above_200dma,
            "hv_20": hv_20,
            "hv_60": hv_60,
            "iv_rank": ivr,
            "current_iv": round(current_iv, 4),
            "52w_high": quote["52w_high"],
            "52w_low": quote["52w_low"],
        }
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_market_data.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/market_data.py backend/tests/test_market_data.py
git commit -m "feat: market data service with yfinance + in-memory cache"
```

---

## Task 6: Strategy Engine — Base Class + Covered Call

**Files:**
- Create: `backend/app/engine/base.py`
- Create: `backend/app/engine/covered_call.py`
- Create: `backend/tests/test_strategies/__init__.py`
- Create: `backend/tests/test_strategies/test_covered_call.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_strategies/test_covered_call.py`:

```python
import pytest
from unittest.mock import MagicMock
from app.engine.covered_call import CoveredCallStrategy

@pytest.fixture
def strategy():
    return CoveredCallStrategy()

@pytest.fixture
def position():
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}

@pytest.fixture
def market_data():
    return {
        "price": 182.50,
        "current_iv": 0.28,
        "iv_rank": 72.0,
        "hv_20": 0.25,
        "rsi_14": 61.2,
        "above_50dma": True,
        "earnings_date": "2026-05-01",
    }

def test_covered_call_result_shape(strategy, position, market_data):
    results = strategy.analyze(position, market_data)
    assert len(results) > 0
    result = results[0]
    assert result["strategy"] == "covered_call"
    assert result["symbol"] == "AAPL"
    assert "action" in result
    assert "strike" in result
    assert "expiration" in result
    assert "premium_collected" in result
    assert "max_profit" in result
    assert "max_loss" in result
    assert "breakeven" in result
    assert "prob_profit" in result
    assert "greeks" in result
    assert "timing_signals" in result
    assert "recommendation_strength" in result

def test_covered_call_needs_100_shares(strategy, market_data):
    small_position = {"symbol": "AAPL", "shares": 50, "cost_basis": 162.0}
    results = strategy.analyze(small_position, market_data)
    assert results == []

def test_covered_call_strike_above_current_price(strategy, position, market_data):
    for result in strategy.analyze(position, market_data):
        assert result["strike"] > market_data["price"]

def test_covered_call_max_profit_calculation(strategy, position, market_data):
    result = strategy.analyze(position, market_data)[0]
    # max_profit = (strike - cost_basis + premium) * 100 shares
    expected = (result["strike"] - position["cost_basis"] + result["premium_collected"]) * position["shares"]
    assert abs(result["max_profit"] - expected) < 0.01

def test_covered_call_breakeven(strategy, position, market_data):
    result = strategy.analyze(position, market_data)[0]
    expected_breakeven = market_data["price"] - result["premium_collected"]
    assert abs(result["breakeven"] - expected_breakeven) < 0.01

def test_covered_call_strong_signal_high_iv(strategy, position, market_data):
    market_data["iv_rank"] = 80.0
    result = strategy.analyze(position, market_data)[0]
    assert result["recommendation_strength"] == "strong"

def test_covered_call_weak_signal_low_iv(strategy, position, market_data):
    market_data["iv_rank"] = 20.0
    result = strategy.analyze(position, market_data)[0]
    assert result["recommendation_strength"] == "weak"

def test_covered_call_earnings_warning(strategy, position, market_data):
    from datetime import date, timedelta
    near_earnings_date = (date.today() + timedelta(days=10)).isoformat()
    market_data["earnings_date"] = near_earnings_date
    result = strategy.analyze(position, market_data)[0]
    assert result["timing_signals"]["earnings_days_away"] <= 14
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_strategies/test_covered_call.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create backend/app/engine/base.py**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


class BaseStrategy(ABC):
    """All strategy classes implement this interface."""

    @abstractmethod
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        """
        Analyze a position against market data and return strategy suggestions.

        Args:
            position: {"symbol", "shares", "cost_basis", ...}
            market_data: {"price", "current_iv", "iv_rank", "hv_20",
                          "rsi_14", "above_50dma", "earnings_date", ...}

        Returns:
            List of StrategyResult dicts (empty if no suggestion applicable).
        """
        ...
```

- [ ] **Step 4: Create backend/app/engine/covered_call.py**

```python
import math
from datetime import date, timedelta
from typing import Optional
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks, prob_profit_from_delta
from app.engine.technicals import earnings_days_away

# Standard option expirations: target 21-45 DTE (sweet spot for theta decay)
_TARGET_DTES = [21, 28, 35, 42]


def _next_friday(days_out: int) -> date:
    """Return the nearest Friday at least `days_out` days from today."""
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)


def _recommendation_strength(iv_rank: float, above_50dma: bool) -> str:
    if iv_rank >= 50 and above_50dma:
        return "strong"
    elif iv_rank >= 30:
        return "moderate"
    else:
        return "weak"


class CoveredCallStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        shares = position.get("shares", 0)
        if shares < 100:
            return []  # need at least 1 contract (100 shares)

        symbol = position["symbol"]
        current_price = market_data["price"]
        cost_basis = position.get("cost_basis", current_price)
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        rsi = market_data.get("rsi_14", 50.0)
        above_50dma = market_data.get("above_50dma", True)
        earnings_date_str = market_data.get("earnings_date")

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            r = 0.05  # risk-free rate

            # Strike: OTM by ~1 standard deviation move (delta ~0.25-0.35)
            # Use ~5-7% OTM as default
            strike = round(current_price * 1.06, 0)

            premium = black_scholes_price(current_price, strike, T, r, iv, "call")
            greeks = calculate_greeks(current_price, strike, T, r, iv, "call")
            prob_profit = prob_profit_from_delta(greeks["delta"], "short_call")

            max_profit = (strike - cost_basis + premium) * shares
            max_loss = -(cost_basis - premium) * shares  # stock goes to zero
            breakeven = current_price - premium

            ed = earnings_days_away(earnings_date_str)

            results.append({
                "strategy": "covered_call",
                "symbol": symbol,
                "action": f"Sell {int(shares / 100)}x {symbol} ${strike:.0f} Call, exp {expiry.isoformat()}",
                "strike": strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "premium_collected": round(premium, 2),
                "max_profit": round(max_profit, 2),
                "max_loss": round(max_loss, 2),
                "breakeven": round(breakeven, 2),
                "prob_profit": round(prob_profit, 4),
                "greeks": greeks,
                "timing_signals": {
                    "iv_rank": ivr,
                    "earnings_days_away": ed,
                    "rsi_14": rsi,
                    "above_50dma": above_50dma,
                },
                "recommendation_strength": _recommendation_strength(ivr, above_50dma),
            })

        # Return sorted by recommendation_strength then DTE
        strength_order = {"strong": 0, "moderate": 1, "weak": 2}
        results.sort(key=lambda x: (strength_order[x["recommendation_strength"]], x["dte"]))
        return results
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_strategies/test_covered_call.py -v
```

Expected: 8 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/base.py backend/app/engine/covered_call.py backend/tests/test_strategies/
git commit -m "feat: strategy base class and covered call strategy"
```

---

## Task 7: Remaining Strategies

**Files:**
- Create: `backend/app/engine/cash_secured_put.py`
- Create: `backend/app/engine/protective_put.py`
- Create: `backend/app/engine/collar.py`
- Create: `backend/app/engine/bull_call_spread.py`
- Create: `backend/app/engine/bear_put_spread.py`
- Create: `backend/tests/test_strategies/test_remaining_strategies.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_strategies/test_remaining_strategies.py`:

```python
import pytest
from app.engine.cash_secured_put import CashSecuredPutStrategy
from app.engine.protective_put import ProtectivePutStrategy
from app.engine.collar import CollarStrategy
from app.engine.bull_call_spread import BullCallSpreadStrategy
from app.engine.bear_put_spread import BearPutSpreadStrategy

@pytest.fixture
def market_data():
    return {
        "price": 182.50, "current_iv": 0.28, "iv_rank": 60.0,
        "hv_20": 0.25, "rsi_14": 50.0, "above_50dma": True,
        "earnings_date": None,
    }

@pytest.fixture
def stock_position():
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}

# --- Cash-Secured Put ---
def test_csp_result_shape(market_data):
    results = CashSecuredPutStrategy().analyze({"symbol": "AAPL", "cash": 18000}, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "cash_secured_put"
    assert r["strike"] < market_data["price"]  # OTM put
    assert r["premium_collected"] > 0
    assert r["max_profit"] > 0
    assert "breakeven" in r

def test_csp_breakeven(market_data):
    results = CashSecuredPutStrategy().analyze({"symbol": "AAPL", "cash": 18000}, market_data)
    r = results[0]
    # breakeven = strike - premium
    assert abs(r["breakeven"] - (r["strike"] - r["premium_collected"])) < 0.01

# --- Protective Put ---
def test_protective_put_shape(stock_position, market_data):
    results = ProtectivePutStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "protective_put"
    assert r["strike"] < market_data["price"]  # OTM put below current price
    assert r["cost"] < 0  # costs money (negative premium)
    assert "protected_below" in r

def test_protective_put_needs_shares(market_data):
    results = ProtectivePutStrategy().analyze({"symbol": "AAPL", "shares": 0, "cost_basis": 162.0}, market_data)
    assert results == []

# --- Collar ---
def test_collar_shape(stock_position, market_data):
    results = CollarStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "collar"
    assert r["call_strike"] > market_data["price"]
    assert r["put_strike"] < market_data["price"]
    assert "net_credit" in r
    assert "upside_cap" in r
    assert "downside_floor" in r

# --- Bull Call Spread ---
def test_bull_call_spread_shape(stock_position, market_data):
    results = BullCallSpreadStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "bull_call_spread"
    assert r["long_strike"] < r["short_strike"]
    assert r["max_profit"] > 0
    assert r["max_loss"] < 0

# --- Bear Put Spread ---
def test_bear_put_spread_shape(stock_position, market_data):
    results = BearPutSpreadStrategy().analyze(stock_position, market_data)
    assert len(results) > 0
    r = results[0]
    assert r["strategy"] == "bear_put_spread"
    assert r["long_strike"] > r["short_strike"]
    assert r["max_profit"] > 0
    assert r["max_loss"] < 0
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_strategies/test_remaining_strategies.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement cash_secured_put.py**

```python
from datetime import date, timedelta
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks, prob_profit_from_delta
from app.engine.technicals import earnings_days_away

_TARGET_DTES = [21, 35, 45]

def _next_friday(days_out):
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)

class CashSecuredPutStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        symbol = position.get("symbol", "")
        current_price = market_data["price"]
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        rsi = market_data.get("rsi_14", 50.0)
        above_50dma = market_data.get("above_50dma", True)
        earnings_date_str = market_data.get("earnings_date")
        r = 0.05

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            strike = round(current_price * 0.94, 0)  # ~6% OTM put
            premium = black_scholes_price(current_price, strike, T, r, iv, "put")
            greeks = calculate_greeks(current_price, strike, T, r, iv, "put")
            prob_profit = prob_profit_from_delta(greeks["delta"], "short_put")
            max_profit = premium * 100
            max_loss = -(strike - premium) * 100  # stock goes to zero
            breakeven = strike - premium
            ed = earnings_days_away(earnings_date_str)
            strength = "strong" if ivr >= 50 else ("moderate" if ivr >= 30 else "weak")
            results.append({
                "strategy": "cash_secured_put",
                "symbol": symbol,
                "action": f"Sell 1x {symbol} ${strike:.0f} Put, exp {expiry.isoformat()}",
                "strike": strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "premium_collected": round(premium, 2),
                "max_profit": round(max_profit, 2),
                "max_loss": round(max_loss, 2),
                "breakeven": round(breakeven, 2),
                "prob_profit": round(prob_profit, 4),
                "greeks": greeks,
                "timing_signals": {"iv_rank": ivr, "earnings_days_away": ed, "rsi_14": rsi, "above_50dma": above_50dma},
                "recommendation_strength": strength,
            })
        return results
```

- [ ] **Step 4: Implement protective_put.py**

```python
from datetime import date, timedelta
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks

_TARGET_DTES = [30, 60, 90]

def _next_friday(days_out):
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)

class ProtectivePutStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        shares = position.get("shares", 0)
        if shares < 100:
            return []
        symbol = position.get("symbol", "")
        current_price = market_data["price"]
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        r = 0.05

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            strike = round(current_price * 0.95, 0)  # 5% OTM put
            cost_per_share = black_scholes_price(current_price, strike, T, r, iv, "put")
            greeks = calculate_greeks(current_price, strike, T, r, iv, "put")
            total_cost = cost_per_share * shares
            results.append({
                "strategy": "protective_put",
                "symbol": symbol,
                "action": f"Buy {int(shares/100)}x {symbol} ${strike:.0f} Put, exp {expiry.isoformat()}",
                "strike": strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "cost": round(-total_cost, 2),
                "cost_per_share": round(-cost_per_share, 2),
                "protected_below": strike,
                "max_loss_with_hedge": round(-(current_price - strike + cost_per_share) * shares, 2),
                "greeks": greeks,
                "timing_signals": {"iv_rank": ivr},
                "recommendation_strength": "strong" if ivr < 30 else "moderate",
            })
        return results
```

- [ ] **Step 5: Implement collar.py**

```python
from datetime import date, timedelta
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks

_TARGET_DTES = [30, 45, 60]

def _next_friday(days_out):
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)

class CollarStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        shares = position.get("shares", 0)
        if shares < 100:
            return []
        symbol = position.get("symbol", "")
        current_price = market_data["price"]
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        r = 0.05

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            call_strike = round(current_price * 1.06, 0)
            put_strike = round(current_price * 0.95, 0)
            call_premium = black_scholes_price(current_price, call_strike, T, r, iv, "call")
            put_cost = black_scholes_price(current_price, put_strike, T, r, iv, "put")
            net_credit = call_premium - put_cost
            call_greeks = calculate_greeks(current_price, call_strike, T, r, iv, "call")
            results.append({
                "strategy": "collar",
                "symbol": symbol,
                "action": f"Sell ${call_strike:.0f} Call + Buy ${put_strike:.0f} Put, exp {expiry.isoformat()}",
                "call_strike": call_strike,
                "put_strike": put_strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "net_credit": round(net_credit, 2),
                "call_premium": round(call_premium, 2),
                "put_cost": round(put_cost, 2),
                "upside_cap": call_strike,
                "downside_floor": put_strike,
                "greeks": call_greeks,
                "timing_signals": {"iv_rank": ivr},
                "recommendation_strength": "strong" if ivr >= 40 else "moderate",
            })
        return results
```

- [ ] **Step 6: Implement bull_call_spread.py**

```python
from datetime import date, timedelta
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price

_TARGET_DTES = [30, 45]

def _next_friday(days_out):
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)

class BullCallSpreadStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        symbol = position.get("symbol", "")
        current_price = market_data["price"]
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        r = 0.05

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            long_strike = round(current_price * 1.01, 0)   # slightly OTM
            short_strike = round(current_price * 1.07, 0)  # further OTM
            long_premium = black_scholes_price(current_price, long_strike, T, r, iv, "call")
            short_premium = black_scholes_price(current_price, short_strike, T, r, iv, "call")
            net_debit = long_premium - short_premium
            max_profit = (short_strike - long_strike - net_debit) * 100
            max_loss = -net_debit * 100
            results.append({
                "strategy": "bull_call_spread",
                "symbol": symbol,
                "action": f"Buy ${long_strike:.0f} Call / Sell ${short_strike:.0f} Call, exp {expiry.isoformat()}",
                "long_strike": long_strike,
                "short_strike": short_strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "net_debit": round(net_debit, 2),
                "max_profit": round(max_profit, 2),
                "max_loss": round(max_loss, 2),
                "breakeven": round(long_strike + net_debit, 2),
                "timing_signals": {"iv_rank": ivr},
                "recommendation_strength": "moderate",
            })
        return results
```

- [ ] **Step 7: Implement bear_put_spread.py**

```python
from datetime import date, timedelta
from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price

_TARGET_DTES = [30, 45]

def _next_friday(days_out):
    target = date.today() + timedelta(days=days_out)
    days_to_friday = (4 - target.weekday()) % 7
    return target + timedelta(days=days_to_friday)

class BearPutSpreadStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        symbol = position.get("symbol", "")
        current_price = market_data["price"]
        iv = market_data.get("current_iv", 0.25)
        ivr = market_data.get("iv_rank", 50.0)
        r = 0.05

        results = []
        for dte in _TARGET_DTES:
            expiry = _next_friday(dte)
            T = dte / 365.0
            long_strike = round(current_price * 0.99, 0)   # slightly OTM put
            short_strike = round(current_price * 0.93, 0)  # further OTM put
            long_premium = black_scholes_price(current_price, long_strike, T, r, iv, "put")
            short_premium = black_scholes_price(current_price, short_strike, T, r, iv, "put")
            net_debit = long_premium - short_premium
            max_profit = (long_strike - short_strike - net_debit) * 100
            max_loss = -net_debit * 100
            results.append({
                "strategy": "bear_put_spread",
                "symbol": symbol,
                "action": f"Buy ${long_strike:.0f} Put / Sell ${short_strike:.0f} Put, exp {expiry.isoformat()}",
                "long_strike": long_strike,
                "short_strike": short_strike,
                "expiration": expiry.isoformat(),
                "dte": dte,
                "net_debit": round(net_debit, 2),
                "max_profit": round(max_profit, 2),
                "max_loss": round(max_loss, 2),
                "breakeven": round(long_strike - net_debit, 2),
                "timing_signals": {"iv_rank": ivr},
                "recommendation_strength": "moderate",
            })
        return results
```

- [ ] **Step 8: Run all strategy tests — expect PASS**

```bash
cd backend && pytest tests/test_strategies/ -v
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/app/engine/ backend/tests/test_strategies/
git commit -m "feat: complete strategy engine — CSP, protective put, collar, call spread, put spread"
```

---

## Task 8: Proactive Alerts Engine

**Files:**
- Create: `backend/app/engine/alerts.py`
- Create: `backend/tests/test_alerts.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_alerts.py`:

```python
import pytest
from datetime import date, timedelta
from app.engine.alerts import check_proactive_alerts

@pytest.fixture
def base_market_data():
    return {
        "price": 182.50, "current_iv": 0.28, "iv_rank": 40.0,
        "hv_20": 0.25, "rsi_14": 55.0, "above_50dma": True,
        "earnings_date": None,
    }

@pytest.fixture
def position():
    return {"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}

def test_high_iv_rank_triggers_alert(position, base_market_data):
    base_market_data["iv_rank"] = 65.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "high_iv_rank" in types

def test_no_alert_when_iv_rank_low(position, base_market_data):
    base_market_data["iv_rank"] = 30.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "high_iv_rank" not in types

def test_stock_up_triggers_covered_call_alert(position, base_market_data):
    # Stock at 182.5, cost_basis 150 → 21.7% gain
    position["cost_basis"] = 150.0
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "stock_up_consider_covered_call" in types

def test_no_alert_when_small_gain(position, base_market_data):
    position["cost_basis"] = 175.0  # only 4.3% gain
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "stock_up_consider_covered_call" not in types

def test_earnings_warning(position, base_market_data):
    near_date = (date.today() + timedelta(days=10)).isoformat()
    base_market_data["earnings_date"] = near_date
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[])
    types = [a["type"] for a in alerts]
    assert "earnings_approaching" in types

def test_expiring_option_alert(position, base_market_data):
    expiring = {
        "symbol": "AAPL", "contract_type": "call", "position_type": "short",
        "strike": 195.0,
        "expiration": (date.today() + timedelta(days=5)).isoformat(),
        "quantity": 1,
    }
    alerts = check_proactive_alerts(position, base_market_data, existing_options=[expiring])
    types = [a["type"] for a in alerts]
    assert "option_expiring_soon" in types
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_alerts.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement backend/app/engine/alerts.py**

```python
from datetime import date, timedelta
from app.engine.technicals import earnings_days_away

_HIGH_IV_RANK_THRESHOLD = 50.0
_STOCK_GAIN_THRESHOLD = 0.10    # 10% gain triggers covered call suggestion
_EARNINGS_WARNING_DAYS = 14
_EXPIRY_WARNING_DAYS = 7


def check_proactive_alerts(position: dict, market_data: dict, existing_options: list) -> list[dict]:
    """Return list of alert dicts for a position. Each alert has: type, message, severity."""
    alerts = []
    current_price = market_data.get("price", 0)
    cost_basis = position.get("cost_basis", current_price)
    iv_rank = market_data.get("iv_rank", 0)
    earnings_date_str = market_data.get("earnings_date")
    symbol = position.get("symbol", "")

    # 1. High IV rank → good time to sell premium
    if iv_rank >= _HIGH_IV_RANK_THRESHOLD:
        alerts.append({
            "type": "high_iv_rank",
            "message": f"{symbol} IV Rank is {iv_rank:.0f} — elevated volatility, good time to sell premium",
            "severity": "info",
        })

    # 2. Stock significantly up from cost basis → consider locking in gains
    if cost_basis > 0:
        gain_pct = (current_price - cost_basis) / cost_basis
        if gain_pct >= _STOCK_GAIN_THRESHOLD:
            alerts.append({
                "type": "stock_up_consider_covered_call",
                "message": f"{symbol} is up {gain_pct*100:.1f}% from cost basis — consider a covered call or collar",
                "severity": "info",
            })

    # 3. Earnings approaching
    ed = earnings_days_away(earnings_date_str)
    if ed is not None and 0 < ed <= _EARNINGS_WARNING_DAYS:
        alerts.append({
            "type": "earnings_approaching",
            "message": f"{symbol} earnings in {ed} days — consider hedging before the event",
            "severity": "warning",
        })

    # 4. Existing options expiring soon
    for opt in existing_options:
        try:
            expiry = date.fromisoformat(opt["expiration"])
            days_left = (expiry - date.today()).days
            if 0 < days_left <= _EXPIRY_WARNING_DAYS:
                alerts.append({
                    "type": "option_expiring_soon",
                    "message": f"{opt['symbol']} ${opt['strike']} {opt['contract_type'].upper()} expires in {days_left} days",
                    "severity": "warning",
                })
        except (KeyError, ValueError):
            continue

    return alerts
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_alerts.py -v
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/alerts.py backend/tests/test_alerts.py
git commit -m "feat: proactive alerts engine"
```

---

## Task 9: CSV Import Service

**Files:**
- Create: `backend/app/services/csv_import.py`
- Create: `backend/tests/test_csv_import.py`
- Create: `backend/tests/fixtures/schwab_positions.csv`
- Create: `backend/tests/fixtures/robinhood_positions.csv`

- [ ] **Step 1: Create test fixture CSVs**

Create `backend/tests/fixtures/schwab_positions.csv`:
```csv
Symbol,Description,Quantity,Price,Price Change %,Market Value,Average Cost Basis,Unrealized P&L,Unrealized P&L %
AAPL,APPLE INC,100,$182.50,+1.2%,"$18,250.00",$162.00,"$2,050.00",+12.65%
MSFT,MICROSOFT CORP,50,$380.00,-0.5%,"$19,000.00",$350.00,"$1,500.00",+8.57%
```

Create `backend/tests/fixtures/robinhood_positions.csv`:
```csv
symbol,average_buy_price,quantity,equity,percent_change,equity_change,type,name
AAPL,162.00,100,18250.00,12.65,2050.00,stock,Apple Inc.
TSLA,240.00,25,5500.00,-8.33,-500.00,stock,Tesla Inc.
```

- [ ] **Step 2: Write failing tests**

Create `backend/tests/test_csv_import.py`:

```python
import pytest
import io
from app.services.csv_import import CSVImportService, UnknownBrokerFormat

@pytest.fixture
def svc():
    return CSVImportService()

def read_fixture(name):
    with open(f"tests/fixtures/{name}") as f:
        return f.read()

def test_detect_schwab(svc):
    content = read_fixture("schwab_positions.csv")
    broker = svc.detect_broker(content)
    assert broker == "schwab"

def test_detect_robinhood(svc):
    content = read_fixture("robinhood_positions.csv")
    broker = svc.detect_broker("robinhood")
    assert broker == "robinhood"

def test_parse_schwab(svc):
    content = read_fixture("schwab_positions.csv")
    positions = svc.parse(content)
    assert len(positions) == 2
    aapl = next(p for p in positions if p["symbol"] == "AAPL")
    assert aapl["shares"] == 100
    assert abs(aapl["cost_basis"] - 162.00) < 0.01

def test_parse_robinhood(svc):
    content = read_fixture("robinhood_positions.csv")
    positions = svc.parse(content)
    assert len(positions) == 2
    tsla = next(p for p in positions if p["symbol"] == "TSLA")
    assert tsla["shares"] == 25
    assert abs(tsla["cost_basis"] - 240.00) < 0.01

def test_unknown_format_raises(svc):
    with pytest.raises(UnknownBrokerFormat):
        svc.parse("col1,col2,col3\na,b,c")

def test_duplicate_detection(svc):
    content = read_fixture("schwab_positions.csv")
    positions = svc.parse(content)
    existing = [{"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}]
    duplicates = svc.find_duplicates(positions, existing)
    assert any(d["symbol"] == "AAPL" for d in duplicates)
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd backend && pytest tests/test_csv_import.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 4: Implement backend/app/services/csv_import.py**

```python
import csv
import io
from typing import Optional


class UnknownBrokerFormat(Exception):
    pass


_SCHWAB_COLS = {"Symbol", "Quantity", "Average Cost Basis"}
_ROBINHOOD_COLS = {"symbol", "average_buy_price", "quantity"}
_FIDELITY_COLS = {"Symbol", "Quantity", "Average Cost Basis ($)"}
_TD_COLS = {"Symbol", "Qty", "Trade Price"}


def _parse_float(value: str) -> float:
    """Strip $, commas, % from numeric strings."""
    return float(value.replace("$", "").replace(",", "").replace("%", "").strip())


class CSVImportService:
    def detect_broker(self, content: str) -> str:
        reader = csv.DictReader(io.StringIO(content))
        cols = set(reader.fieldnames or [])
        if _SCHWAB_COLS.issubset(cols) and "Average Cost Basis ($)" not in cols:
            return "schwab"
        if _ROBINHOOD_COLS.issubset(cols):
            return "robinhood"
        if _FIDELITY_COLS.issubset(cols):
            return "fidelity"
        if _TD_COLS.issubset(cols):
            return "td_ameritrade"
        raise UnknownBrokerFormat(f"Cannot detect broker from columns: {cols}")

    def parse(self, content: str) -> list[dict]:
        broker = self.detect_broker(content)
        reader = csv.DictReader(io.StringIO(content))
        rows = [row for row in reader if row.get("Symbol") or row.get("symbol")]
        if broker == "schwab":
            return self._parse_schwab(rows)
        elif broker == "robinhood":
            return self._parse_robinhood(rows)
        elif broker == "fidelity":
            return self._parse_fidelity(rows)
        elif broker == "td_ameritrade":
            return self._parse_td(rows)
        raise UnknownBrokerFormat(f"No parser for broker: {broker}")

    def _parse_schwab(self, rows: list) -> list[dict]:
        positions = []
        for row in rows:
            sym = row.get("Symbol", "").strip()
            if not sym or sym.startswith("Account"):
                continue
            try:
                positions.append({
                    "symbol": sym,
                    "shares": _parse_float(row["Quantity"]),
                    "cost_basis": _parse_float(row["Average Cost Basis"]),
                })
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_robinhood(self, rows: list) -> list[dict]:
        positions = []
        for row in rows:
            sym = row.get("symbol", "").strip().upper()
            if not sym:
                continue
            try:
                positions.append({
                    "symbol": sym,
                    "shares": _parse_float(row["quantity"]),
                    "cost_basis": _parse_float(row["average_buy_price"]),
                })
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_fidelity(self, rows: list) -> list[dict]:
        positions = []
        for row in rows:
            sym = row.get("Symbol", "").strip()
            if not sym:
                continue
            try:
                positions.append({
                    "symbol": sym,
                    "shares": _parse_float(row["Quantity"]),
                    "cost_basis": _parse_float(row["Average Cost Basis ($)"]),
                })
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_td(self, rows: list) -> list[dict]:
        positions = []
        for row in rows:
            sym = row.get("Symbol", "").strip()
            if not sym:
                continue
            try:
                positions.append({
                    "symbol": sym,
                    "shares": _parse_float(row["Qty"]),
                    "cost_basis": _parse_float(row["Trade Price"]),
                })
            except (KeyError, ValueError):
                continue
        return positions

    def find_duplicates(self, imported: list[dict], existing: list[dict]) -> list[dict]:
        """Return imported positions that match an existing position by symbol."""
        existing_symbols = {p["symbol"] for p in existing}
        return [p for p in imported if p["symbol"] in existing_symbols]
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_csv_import.py -v
```

Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/csv_import.py backend/tests/test_csv_import.py backend/tests/fixtures/
git commit -m "feat: CSV import service for Schwab, Robinhood, Fidelity, TD Ameritrade"
```

---

## Task 10: Auth & Portfolio API Routes

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/schemas/portfolio.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/app/routers/portfolios.py`
- Create: `backend/app/routers/positions.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routers/test_portfolios.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routers/test_portfolios.py`:

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
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
    """Create a user and return auth headers via test token endpoint."""
    # For tests, we use a special test-only endpoint that bypasses OAuth
    response = client.post("/auth/test-token", json={"email": "test@example.com"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_portfolio(client, auth_headers):
    resp = client.post("/portfolios/", json={"name": "My Portfolio"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "My Portfolio"

def test_list_portfolios(client, auth_headers):
    client.post("/portfolios/", json={"name": "Portfolio A"}, headers=auth_headers)
    client.post("/portfolios/", json={"name": "Portfolio B"}, headers=auth_headers)
    resp = client.get("/portfolios/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2

def test_add_stock_position(client, auth_headers):
    p = client.post("/portfolios/", json={"name": "P"}, headers=auth_headers).json()
    resp = client.post(
        f"/portfolios/{p['id']}/positions/stock",
        json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0},
        headers=auth_headers
    )
    assert resp.status_code == 201
    assert resp.json()["symbol"] == "AAPL"

def test_list_stock_positions(client, auth_headers):
    p = client.post("/portfolios/", json={"name": "P"}, headers=auth_headers).json()
    client.post(f"/portfolios/{p['id']}/positions/stock",
                json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}, headers=auth_headers)
    resp = client.get(f"/portfolios/{p['id']}/positions/stock", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

def test_cannot_access_other_users_portfolio(client):
    """Two users cannot access each other's portfolios."""
    # User 1
    r1 = client.post("/auth/test-token", json={"email": "user1@example.com"})
    h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}
    p1 = client.post("/portfolios/", json={"name": "P1"}, headers=h1).json()
    # User 2
    r2 = client.post("/auth/test-token", json={"email": "user2@example.com"})
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}
    resp = client.get(f"/portfolios/{p1['id']}/positions/stock", headers=h2)
    assert resp.status_code == 404
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_routers/ -v
```

Expected: FAIL — routes not defined.

- [ ] **Step 3: Create backend/app/schemas/portfolio.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import date

class PortfolioCreate(BaseModel):
    name: str

class PortfolioOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class StockPositionCreate(BaseModel):
    symbol: str
    shares: float
    cost_basis: float
    purchase_date: Optional[date] = None
    notes: Optional[str] = None

class StockPositionOut(StockPositionCreate):
    id: int
    portfolio_id: int
    class Config:
        from_attributes = True

class OptionsPositionCreate(BaseModel):
    symbol: str
    contract_type: str   # "call" | "put"
    position_type: str   # "long" | "short"
    strike: float
    expiration: str
    quantity: int
    premium_paid: float

class OptionsPositionOut(OptionsPositionCreate):
    id: int
    portfolio_id: int
    class Config:
        from_attributes = True
```

- [ ] **Step 4: Create backend/app/routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=30)}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Test-only endpoint (disable in production via env var)
@router.post("/test-token")
def test_token(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, oauth_provider="test", oauth_id=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"access_token": create_token(user.id)}
```

- [ ] **Step 5: Create backend/app/routers/portfolios.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.portfolio import Portfolio, StockPosition, OptionsPosition
from app.schemas.portfolio import (
    PortfolioCreate, PortfolioOut,
    StockPositionCreate, StockPositionOut,
    OptionsPositionCreate, OptionsPositionOut,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

def _get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

def _get_portfolio_or_404(portfolio_id: int, user_id: int, db: Session) -> Portfolio:
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return p

@router.post("/", response_model=PortfolioOut, status_code=201)
def create_portfolio(body: PortfolioCreate, user=Depends(_get_user), db: Session = Depends(get_db)):
    p = Portfolio(user_id=user.id, name=body.name)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.get("/", response_model=list[PortfolioOut])
def list_portfolios(user=Depends(_get_user), db: Session = Depends(get_db)):
    return db.query(Portfolio).filter(Portfolio.user_id == user.id).all()

@router.post("/{portfolio_id}/positions/stock", response_model=StockPositionOut, status_code=201)
def add_stock_position(portfolio_id: int, body: StockPositionCreate,
                       user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    pos = StockPosition(portfolio_id=portfolio_id, **body.model_dump())
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos

@router.get("/{portfolio_id}/positions/stock", response_model=list[StockPositionOut])
def list_stock_positions(portfolio_id: int, user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    return db.query(StockPosition).filter(StockPosition.portfolio_id == portfolio_id).all()

@router.post("/{portfolio_id}/positions/options", response_model=OptionsPositionOut, status_code=201)
def add_options_position(portfolio_id: int, body: OptionsPositionCreate,
                         user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    pos = OptionsPosition(portfolio_id=portfolio_id, **body.model_dump())
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos

@router.get("/{portfolio_id}/positions/options", response_model=list[OptionsPositionOut])
def list_options_positions(portfolio_id: int, user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    return db.query(OptionsPosition).filter(OptionsPosition.portfolio_id == portfolio_id).all()
```

- [ ] **Step 6: Update backend/app/main.py to include routers**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, portfolios

app = FastAPI(title="Options Strategy Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(portfolios.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_routers/ -v
```

Expected: 5 passed.

- [ ] **Step 8: Commit**

```bash
git add backend/app/routers/ backend/app/schemas/ backend/tests/test_routers/
git commit -m "feat: auth and portfolio API routes"
```

---

## Task 11: Strategy API Route

**Files:**
- Create: `backend/app/routers/strategies.py`
- Create: `backend/app/schemas/strategy.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routers/test_strategies.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routers/test_strategies.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_strategies.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
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
def portfolio_with_position(client):
    r = client.post("/auth/test-token", json={"email": "user@example.com"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    p = client.post("/portfolios/", json={"name": "P"}, headers=headers).json()
    client.post(f"/portfolios/{p['id']}/positions/stock",
                json={"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}, headers=headers)
    return p["id"], headers

MOCK_MARKET_DATA = {
    "price": 182.50, "current_iv": 0.28, "iv_rank": 65.0,
    "hv_20": 0.25, "rsi_14": 61.0, "above_50dma": True,
    "earnings_date": None, "52w_high": 220.0, "52w_low": 150.0,
    "stale": False,
}

def test_get_strategies_for_position(client, portfolio_with_position):
    portfolio_id, headers = portfolio_with_position
    with patch("app.routers.strategies.market_data_svc.get_stock_quote", return_value=MOCK_MARKET_DATA), \
         patch("app.routers.strategies.market_data_svc.get_market_signals", return_value=MOCK_MARKET_DATA):
        resp = client.get(f"/strategies/{portfolio_id}/AAPL", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "income" in data
    assert "hedge" in data
    assert "alerts" in data
    assert len(data["income"]) > 0

def test_strategies_require_auth(client, portfolio_with_position):
    portfolio_id, _ = portfolio_with_position
    resp = client.get(f"/strategies/{portfolio_id}/AAPL")
    assert resp.status_code == 422  # missing auth header

def test_strategies_unknown_symbol(client, portfolio_with_position):
    portfolio_id, headers = portfolio_with_position
    with patch("app.routers.strategies.market_data_svc.get_stock_quote",
               return_value={**MOCK_MARKET_DATA, "price": 0.0, "stale": True}), \
         patch("app.routers.strategies.market_data_svc.get_market_signals", return_value=MOCK_MARKET_DATA):
        resp = client.get(f"/strategies/{portfolio_id}/AAPL", headers=headers)
    assert resp.status_code == 200
    assert resp.json().get("market_data_stale") is True
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && pytest tests/test_routers/test_strategies.py -v
```

Expected: FAIL — route not defined.

- [ ] **Step 3: Create backend/app/routers/strategies.py**

```python
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.portfolio import StockPosition, OptionsPosition
from app.routers.auth import get_current_user
from app.routers.portfolios import _get_portfolio_or_404
from app.services.market_data import MarketDataService
from app.engine.covered_call import CoveredCallStrategy
from app.engine.cash_secured_put import CashSecuredPutStrategy
from app.engine.protective_put import ProtectivePutStrategy
from app.engine.collar import CollarStrategy
from app.engine.bull_call_spread import BullCallSpreadStrategy
from app.engine.bear_put_spread import BearPutSpreadStrategy
from app.engine.alerts import check_proactive_alerts

router = APIRouter(prefix="/strategies", tags=["strategies"])
market_data_svc = MarketDataService()

_INCOME_STRATEGIES = [CoveredCallStrategy(), CashSecuredPutStrategy()]
_HEDGE_STRATEGIES = [ProtectivePutStrategy(), CollarStrategy(),
                     BullCallSpreadStrategy(), BearPutSpreadStrategy()]

def _get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

@router.get("/{portfolio_id}/{symbol}")
def get_strategies(portfolio_id: int, symbol: str,
                   user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)

    stock_pos = db.query(StockPosition).filter(
        StockPosition.portfolio_id == portfolio_id,
        StockPosition.symbol == symbol
    ).first()

    position = {
        "symbol": symbol,
        "shares": stock_pos.shares if stock_pos else 0,
        "cost_basis": stock_pos.cost_basis if stock_pos else 0,
        "cash": (stock_pos.cost_basis * stock_pos.shares) if stock_pos else 0,
    }

    existing_options = [
        {
            "symbol": o.symbol, "contract_type": o.contract_type,
            "position_type": o.position_type, "strike": o.strike,
            "expiration": o.expiration, "quantity": o.quantity,
        }
        for o in db.query(OptionsPosition).filter(
            OptionsPosition.portfolio_id == portfolio_id,
            OptionsPosition.symbol == symbol
        ).all()
    ]

    quote = market_data_svc.get_stock_quote(symbol)
    market_signals = market_data_svc.get_market_signals(symbol)
    market_data = {**quote, **market_signals}

    income = []
    for strat in _INCOME_STRATEGIES:
        income.extend(strat.analyze(position, market_data))

    hedge = []
    for strat in _HEDGE_STRATEGIES:
        hedge.extend(strat.analyze(position, market_data))

    alerts = check_proactive_alerts(position, market_data, existing_options)

    return {
        "symbol": symbol,
        "position": position,
        "income": income,
        "hedge": hedge,
        "all": income + hedge,
        "alerts": alerts,
        "market_data_stale": quote.get("stale", False),
    }
```

- [ ] **Step 4: Add strategies router to main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, portfolios, strategies

app = FastAPI(title="Options Strategy Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(portfolios.router)
app.include_router(strategies.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd backend && pytest tests/test_routers/test_strategies.py -v
```

Expected: 3 passed.

- [ ] **Step 6: Run full test suite**

```bash
cd backend && pytest -v
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/strategies.py backend/tests/test_routers/test_strategies.py
git commit -m "feat: strategy API route — income, hedge, alerts per position"
```

---

## Task 12: Next.js Auth + Layout

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/app/api/auth/[...nextauth]/route.ts`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/Nav.tsx`

- [ ] **Step 1: Create frontend/lib/types.ts**

```typescript
export interface StockPosition {
  id: number;
  portfolio_id: number;
  symbol: string;
  shares: number;
  cost_basis: number;
  purchase_date?: string;
  notes?: string;
}

export interface OptionsPosition {
  id: number;
  portfolio_id: number;
  symbol: string;
  contract_type: "call" | "put";
  position_type: "long" | "short";
  strike: number;
  expiration: string;
  quantity: number;
  premium_paid: number;
}

export interface Portfolio {
  id: number;
  name: string;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface TimingSignals {
  iv_rank: number;
  earnings_days_away?: number | null;
  rsi_14: number;
  above_50dma: boolean;
}

export interface StrategyResult {
  strategy: string;
  symbol: string;
  action: string;
  strike?: number;
  call_strike?: number;
  put_strike?: number;
  long_strike?: number;
  short_strike?: number;
  expiration: string;
  dte: number;
  premium_collected?: number;
  cost?: number;
  net_credit?: number;
  net_debit?: number;
  max_profit: number;
  max_loss: number;
  breakeven?: number;
  prob_profit?: number;
  greeks: Greeks;
  timing_signals: TimingSignals;
  recommendation_strength: "strong" | "moderate" | "weak";
}

export interface Alert {
  type: string;
  message: string;
  severity: "info" | "warning";
}

export interface StrategiesResponse {
  symbol: string;
  position: { symbol: string; shares: number; cost_basis: number };
  income: StrategyResult[];
  hedge: StrategyResult[];
  all: StrategyResult[];
  alerts: Alert[];
  market_data_stale: boolean;
}
```

- [ ] **Step 2: Create frontend/lib/api.ts**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  portfolios: {
    list: (token: string) => apiFetch("/portfolios/", {}, token),
    create: (name: string, token: string) =>
      apiFetch("/portfolios/", { method: "POST", body: JSON.stringify({ name }) }, token),
  },
  positions: {
    listStock: (portfolioId: number, token: string) =>
      apiFetch(`/portfolios/${portfolioId}/positions/stock`, {}, token),
    addStock: (portfolioId: number, pos: object, token: string) =>
      apiFetch(`/portfolios/${portfolioId}/positions/stock`,
        { method: "POST", body: JSON.stringify(pos) }, token),
    listOptions: (portfolioId: number, token: string) =>
      apiFetch(`/portfolios/${portfolioId}/positions/options`, {}, token),
  },
  strategies: {
    get: (portfolioId: number, symbol: string, token: string) =>
      apiFetch(`/strategies/${portfolioId}/${symbol}`, {}, token),
  },
};
```

- [ ] **Step 3: Create frontend/app/api/auth/[...nextauth]/route.ts**

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Exchange OAuth token for our API token
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider,
              oauth_id: account.providerAccountId,
              email: token.email,
            }),
          });
          const data = await res.json();
          token.apiToken = data.access_token;
        } catch (e) {
          console.error("Failed to exchange OAuth token", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Create frontend/components/Nav.tsx**

```typescript
"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Nav() {
  const { data: session } = useSession();
  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg">OptionsIQ</Link>
        {session && (
          <>
            <Link href="/" className="text-gray-300 hover:text-white text-sm">Portfolio</Link>
            <Link href="/strategies" className="text-gray-300 hover:text-white text-sm">Strategies</Link>
          </>
        )}
      </div>
      <div>
        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{session.user?.email}</span>
            <button onClick={() => signOut()} className="text-sm text-gray-400 hover:text-white">Sign out</button>
          </div>
        ) : (
          <button onClick={() => signIn()} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-500">
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Create frontend/app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/components/SessionProvider";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OptionsIQ — Portfolio Options Strategies",
  description: "Income generation and hedging strategies for your portfolio",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <SessionProvider session={session}>
          <Nav />
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create frontend/components/SessionProvider.tsx**

```typescript
"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children, session }: { children: React.ReactNode; session: any }) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 7: Create frontend/app/page.tsx (dashboard shell)**

```typescript
"use client";
import { useSession, signIn } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="text-gray-400">Loading...</div>;
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-3xl font-bold">OptionsIQ</h1>
        <p className="text-gray-400">Portfolio options strategies for income and hedging</p>
        <button onClick={() => signIn()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg">
          Sign in to get started
        </button>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Portfolio</h1>
      <p className="text-gray-400">Portfolio dashboard coming in next task.</p>
    </div>
  );
}
```

- [ ] **Step 8: Add OAuth exchange endpoint to backend (needed for NextAuth callback)**

Add to `backend/app/routers/auth.py`:

```python
class OAuthExchangePayload(BaseModel):
    provider: str
    oauth_id: str
    email: str

@router.post("/oauth")
def oauth_exchange(payload: OAuthExchangePayload, db: Session = Depends(get_db)):
    """Exchange OAuth identity for API token. Merges accounts with same email."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(email=payload.email, oauth_provider=payload.provider, oauth_id=payload.oauth_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"access_token": create_token(user.id)}
```

Also add `from pydantic import BaseModel` at the top of auth.py.

- [ ] **Step 9: Verify frontend builds**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/ backend/app/routers/auth.py
git commit -m "feat: Next.js auth with NextAuth, layout, and nav"
```

---

## Task 13: Dashboard — Position Cards + Strategy Explorer

**Files:**
- Create: `frontend/components/PositionCard.tsx`
- Create: `frontend/components/StrategyExplorer.tsx`
- Create: `frontend/components/StrategyCard.tsx`
- Create: `frontend/components/PnLChart.tsx`
- Create: `frontend/components/AddPositionModal.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Create frontend/components/PnLChart.tsx**

```typescript
"use client";
import { StrategyResult } from "@/lib/types";

interface Props { strategy: StrategyResult; currentPrice: number; }

export default function PnLChart({ strategy, currentPrice }: Props) {
  const width = 280;
  const height = 80;
  const padding = { left: 30, right: 10, top: 10, bottom: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const low = currentPrice * 0.85;
  const high = currentPrice * 1.15;
  const steps = 50;
  const prices = Array.from({ length: steps }, (_, i) => low + (high - low) * (i / (steps - 1)));

  const pnlAt = (price: number): number => {
    const s = strategy;
    if (s.strategy === "covered_call") {
      const stockPnl = (price - currentPrice) * (s as any).shares || 0;
      const optionPnl = price >= (s.strike || 0)
        ? -(price - (s.strike || 0) - (s.premium_collected || 0)) * 100
        : (s.premium_collected || 0) * 100;
      return stockPnl + optionPnl;
    }
    // Generic: show premium profit/loss curve
    return Math.min(s.max_profit, Math.max(s.max_loss, s.max_profit * (price / high)));
  };

  const pnls = prices.map(pnlAt);
  const minPnl = Math.min(...pnls, 0);
  const maxPnl = Math.max(...pnls, 0);
  const range = maxPnl - minPnl || 1;

  const toX = (price: number) => padding.left + ((price - low) / (high - low)) * chartW;
  const toY = (pnl: number) => padding.top + ((maxPnl - pnl) / range) * chartH;
  const zeroY = toY(0);

  const points = prices.map((p, i) => `${toX(p)},${toY(pnls[i])}`).join(" ");
  const fillPoints = `${toX(low)},${zeroY} ${points} ${toX(high)},${zeroY}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Zero line */}
      <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY}
            stroke="#374151" strokeWidth={1} strokeDasharray="3,3" />
      {/* Fill */}
      <polygon points={fillPoints} fill="#10b981" fillOpacity={0.15} />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth={1.5} />
      {/* Current price marker */}
      <line x1={toX(currentPrice)} y1={padding.top} x2={toX(currentPrice)} y2={height - padding.bottom}
            stroke="#60a5fa" strokeWidth={1} strokeDasharray="2,2" />
      {/* Labels */}
      <text x={padding.left} y={height} fill="#6b7280" fontSize={9}>${low.toFixed(0)}</text>
      <text x={width - padding.right - 20} y={height} fill="#6b7280" fontSize={9}>${high.toFixed(0)}</text>
    </svg>
  );
}
```

- [ ] **Step 2: Create frontend/components/StrategyCard.tsx**

```typescript
"use client";
import { useState } from "react";
import { StrategyResult } from "@/lib/types";
import PnLChart from "./PnLChart";

const STRENGTH_COLORS = {
  strong: "text-green-400 bg-green-900/30 border-green-600",
  moderate: "text-blue-400 bg-blue-900/30 border-blue-600",
  weak: "text-gray-400 bg-gray-800 border-gray-600",
};

const STRATEGY_LABELS: Record<string, string> = {
  covered_call: "Covered Call",
  cash_secured_put: "Cash-Secured Put",
  protective_put: "Protective Put",
  collar: "Collar",
  bull_call_spread: "Bull Call Spread",
  bear_put_spread: "Bear Put Spread",
};

interface Props { strategy: StrategyResult; currentPrice: number; }

export default function StrategyCard({ strategy: s, currentPrice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = STRENGTH_COLORS[s.recommendation_strength];
  const premium = s.premium_collected ?? s.net_credit ?? s.net_debit;
  const premiumLabel = s.cost ? "Cost" : s.net_debit ? "Net Debit" : "Premium";
  const premiumValue = s.cost || s.net_debit
    ? `−$${Math.abs(s.cost ?? s.net_debit ?? 0).toFixed(2)}`
    : `+$${(premium ?? 0).toFixed(2)}`;

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{STRATEGY_LABELS[s.strategy] ?? s.strategy}</span>
          {s.recommendation_strength === "strong" && <span className="text-xs">⭐</span>}
        </div>
        <span className="font-bold text-sm">{premiumLabel}: {premiumValue}</span>
      </div>
      <div className="text-gray-300 text-sm mb-2">{s.action}</div>
      <div className="flex gap-4 text-xs text-gray-400 mb-2">
        {s.breakeven && <span>BE: ${s.breakeven.toFixed(2)}</span>}
        {s.prob_profit && <span>P(profit): {(s.prob_profit * 100).toFixed(0)}%</span>}
        <span>IV Rank: {s.timing_signals.iv_rank.toFixed(0)}</span>
        {s.timing_signals.earnings_days_away && (
          <span className={s.timing_signals.earnings_days_away <= 14 ? "text-yellow-400" : ""}>
            Earnings: {s.timing_signals.earnings_days_away}d
          </span>
        )}
      </div>
      <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-500 hover:text-gray-300">
        {expanded ? "▲ Hide details" : "▼ Show Greeks & Details"}
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Max Profit", `$${s.max_profit.toFixed(0)}`, "text-green-400"],
              ["Max Loss", `$${s.max_loss.toFixed(0)}`, "text-red-400"],
              ["P(Profit)", s.prob_profit ? `${(s.prob_profit * 100).toFixed(0)}%` : "—", "text-blue-400"],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-gray-900 rounded p-2 text-center">
                <div className="text-gray-500 text-xs">{label}</div>
                <div className={`font-bold text-sm ${color}`}>{value}</div>
              </div>
            ))}
          </div>
          <PnLChart strategy={s} currentPrice={currentPrice} />
          <div className="grid grid-cols-4 gap-2">
            {[
              ["Delta", s.greeks.delta.toFixed(3)],
              ["Gamma", s.greeks.gamma.toFixed(3)],
              ["Theta", s.greeks.theta.toFixed(3)],
              ["Vega", s.greeks.vega.toFixed(3)],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-900 rounded p-2 text-center">
                <div className="text-gray-500 text-xs">{label}</div>
                <div className="text-gray-200 text-sm">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/components/StrategyExplorer.tsx**

```typescript
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StrategiesResponse, StrategyResult, Alert } from "@/lib/types";
import { api } from "@/lib/api";
import StrategyCard from "./StrategyCard";

interface Props { portfolioId: number; symbol: string; currentPrice: number; onClose: () => void; }

type Tab = "income" | "hedge" | "all";

export default function StrategyExplorer({ portfolioId, symbol, currentPrice, onClose }: Props) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("income");
  const [data, setData] = useState<StrategiesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!(session as any)?.apiToken) return;
    api.strategies.get(portfolioId, symbol, (session as any).apiToken)
      .then(setData)
      .finally(() => setLoading(false));
  }, [portfolioId, symbol, session]);

  const strategies: StrategyResult[] = data ? (tab === "income" ? data.income : tab === "hedge" ? data.hedge : data.all) : [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">{symbol} — Strategy Explorer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {data?.alerts && data.alerts.length > 0 && (
          <div className="p-4 border-b border-gray-700 space-y-2">
            {data.alerts.map((alert: Alert, i: number) => (
              <div key={i} className={`text-sm px-3 py-2 rounded ${alert.severity === "warning" ? "bg-yellow-900/30 text-yellow-300" : "bg-blue-900/30 text-blue-300"}`}>
                {alert.severity === "warning" ? "⚠️" : "💡"} {alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="flex border-b border-gray-700">
          {(["income", "hedge", "all"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-sm capitalize ${tab === t ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-white"}`}>
              {t === "income" ? "💰 Income" : t === "hedge" ? "🛡️ Hedge" : "⚡ All"}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {loading && <div className="text-gray-400 text-center py-8">Loading strategies...</div>}
          {!loading && strategies.length === 0 && (
            <div className="text-gray-400 text-center py-8">No strategies available for this tab.</div>
          )}
          {strategies.map((s, i) => (
            <StrategyCard key={i} strategy={s} currentPrice={currentPrice} />
          ))}
        </div>
        {data?.market_data_stale && (
          <div className="px-4 pb-4 text-xs text-yellow-400">⚠️ Market data may be stale</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/components/PositionCard.tsx**

```typescript
"use client";
import { StockPosition, Alert } from "@/lib/types";

interface Props {
  position: StockPosition;
  currentPrice?: number;
  alerts?: Alert[];
  onClick: () => void;
}

export default function PositionCard({ position, currentPrice, alerts = [], onClick }: Props) {
  const price = currentPrice ?? position.cost_basis;
  const gainLoss = (price - position.cost_basis) * position.shares;
  const gainPct = ((price - position.cost_basis) / position.cost_basis) * 100;
  const isUp = gainLoss >= 0;

  return (
    <div onClick={onClick}
         className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 hover:ring-1 hover:ring-blue-500 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-xs uppercase tracking-wide">{position.symbol}</span>
        {alerts.length > 0 && (
          <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
            💡 {alerts.length} signal{alerts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="font-semibold text-white">{position.shares} shares @ ${price.toFixed(2)}</div>
      <div className={`text-sm font-medium mt-1 ${isUp ? "text-green-400" : "text-red-400"}`}>
        {isUp ? "+" : ""}${gainLoss.toFixed(2)} ({isUp ? "+" : ""}{gainPct.toFixed(1)}%)
      </div>
      <div className="text-xs text-gray-500 mt-2">Click to explore strategies →</div>
    </div>
  );
}
```

- [ ] **Step 5: Update frontend/app/page.tsx with full dashboard**

```typescript
"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Portfolio, StockPosition } from "@/lib/types";
import { api } from "@/lib/api";
import PositionCard from "@/components/PositionCard";
import StrategyExplorer from "@/components/StrategyExplorer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [explorer, setExplorer] = useState<{ symbol: string; price: number } | null>(null);

  const token = (session as any)?.apiToken;

  useEffect(() => {
    if (!token) return;
    api.portfolios.list(token).then((data: Portfolio[]) => {
      setPortfolios(data);
      if (data.length > 0) setSelectedPortfolio(data[0].id);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !selectedPortfolio) return;
    api.positions.listStock(selectedPortfolio, token).then(setPositions);
  }, [token, selectedPortfolio]);

  if (status === "loading") return <div className="text-gray-400">Loading...</div>;
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-3xl font-bold">OptionsIQ</h1>
        <p className="text-gray-400">Portfolio options strategies for income and hedging</p>
        <button onClick={() => signIn()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg">
          Sign in to get started
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <select value={selectedPortfolio ?? ""} onChange={e => setSelectedPortfolio(Number(e.target.value))}
                className="bg-gray-800 text-white rounded px-3 py-1.5 text-sm border border-gray-700">
          {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No positions yet</p>
          <p className="text-sm">Add positions manually or import a CSV from your broker.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map(pos => (
            <PositionCard
              key={pos.id}
              position={pos}
              onClick={() => setExplorer({ symbol: pos.symbol, price: pos.cost_basis * 1.05 })}
            />
          ))}
        </div>
      )}

      {explorer && selectedPortfolio && (
        <StrategyExplorer
          portfolioId={selectedPortfolio}
          symbol={explorer.symbol}
          currentPrice={explorer.price}
          onClose={() => setExplorer(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify frontend builds**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: dashboard with position cards and strategy explorer UI"
```

---

## Task 14: CSV Import UI + E2E Smoke Test

**Files:**
- Create: `frontend/components/CSVImport.tsx`
- Create: `frontend/app/import/page.tsx`
- Create: `backend/app/routers/import_csv.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create backend CSV import route**

Add to `backend/app/routers/import_csv.py`:

```python
from fastapi import APIRouter, Depends, Header, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.portfolio import StockPosition
from app.routers.auth import get_current_user
from app.routers.portfolios import _get_portfolio_or_404
from app.services.csv_import import CSVImportService, UnknownBrokerFormat

router = APIRouter(prefix="/portfolios", tags=["import"])
_import_svc = CSVImportService()

def _get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

@router.post("/{portfolio_id}/import")
async def import_csv(portfolio_id: int, file: UploadFile = File(...),
                     user=Depends(_get_user), db: Session = Depends(get_db)):
    _get_portfolio_or_404(portfolio_id, user.id, db)
    content = (await file.read()).decode("utf-8")
    try:
        positions = _import_svc.parse(content)
    except UnknownBrokerFormat as e:
        raise HTTPException(status_code=422, detail=str(e))
    existing = db.query(StockPosition).filter(StockPosition.portfolio_id == portfolio_id).all()
    existing_dicts = [{"symbol": p.symbol, "shares": p.shares, "cost_basis": p.cost_basis} for p in existing]
    duplicates = _import_svc.find_duplicates(positions, existing_dicts)
    duplicate_symbols = {d["symbol"] for d in duplicates}
    new_positions = [p for p in positions if p["symbol"] not in duplicate_symbols]
    for pos in new_positions:
        db.add(StockPosition(portfolio_id=portfolio_id, **pos))
    db.commit()
    return {
        "imported": len(new_positions),
        "skipped_duplicates": len(duplicates),
        "duplicate_symbols": list(duplicate_symbols),
    }
```

Add `from app.routers import import_csv` and `app.include_router(import_csv.router)` to `backend/app/main.py`.

- [ ] **Step 2: Create frontend/components/CSVImport.tsx**

```typescript
"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface Props { portfolioId: number; onImported: () => void; }

export default function CSVImport({ portfolioId, onImported }: Props) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; skipped_duplicates: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolios/${portfolioId}/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${(session as any)?.apiToken}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Import failed");
      }
      const data = await res.json();
      setResult(data);
      setStatus("done");
      onImported();
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center">
      <input ref={inputRef} type="file" accept=".csv" className="hidden"
             onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {status === "idle" && (
        <>
          <p className="text-gray-400 mb-3">Import positions from your broker</p>
          <p className="text-xs text-gray-500 mb-4">Supported: Schwab, TD Ameritrade, Robinhood, Fidelity</p>
          <button onClick={() => inputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">
            Choose CSV file
          </button>
        </>
      )}
      {status === "uploading" && <p className="text-gray-400">Importing...</p>}
      {status === "done" && result && (
        <div className="text-green-400">
          <p>✓ Imported {result.imported} positions</p>
          {result.skipped_duplicates > 0 && (
            <p className="text-gray-400 text-sm mt-1">Skipped {result.skipped_duplicates} duplicates</p>
          )}
        </div>
      )}
      {status === "error" && (
        <div className="text-red-400">
          <p>⚠ {error}</p>
          <button onClick={() => setStatus("idle")} className="text-sm text-gray-400 mt-2 hover:text-white">Try again</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run full backend test suite**

```bash
cd backend && pytest -v
```

Expected: All tests pass.

- [ ] **Step 4: Manual smoke test**

Start both services:
```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Verify:
- http://localhost:8000/health returns `{"status":"ok"}`
- http://localhost:3000 loads the sign-in page
- http://localhost:8000/docs shows all API routes

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/import_csv.py frontend/components/CSVImport.tsx frontend/app/import/
git commit -m "feat: CSV import endpoint and UI"
```

---

## Post-Implementation Checklist

- [ ] All backend tests pass: `cd backend && pytest -v`
- [ ] Frontend builds without errors: `cd frontend && npm run build`
- [ ] Health check: `curl http://localhost:8000/health`
- [ ] All 6 strategy types return results for a sample AAPL position
- [ ] CSV import works for Schwab and Robinhood fixture files
- [ ] OAuth flow works end-to-end with Google or GitHub test credentials
- [ ] `.env` files are gitignored and `.env.example` files are committed
