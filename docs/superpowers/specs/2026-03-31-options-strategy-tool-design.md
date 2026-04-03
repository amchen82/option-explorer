# Options Strategy Tool — Design Spec

**Date:** 2026-03-31  
**Status:** Approved

---

## Overview

A multi-user web app where users list their stock portfolios and receive proactive + on-demand options strategy recommendations for income generation (covered calls, cash-secured puts) and hedging (protective puts, collars, spreads). Each strategy shows timing signals, strike/expiration suggestions, and full P&L analysis with Greeks.

---

## Architecture

**Stack:** FastAPI (Python) backend + Next.js frontend + PostgreSQL

```
Next.js Frontend  (Top Nav + Cards Grid UI, NextAuth.js OAuth)
       │ HTTP/REST
FastAPI Backend
  ├── Auth (OAuth via Google / GitHub)
  ├── Portfolio API  (CRUD for positions, CSV import)
  ├── Strategy API   (on-demand + proactive recommendations)
  └── Strategy Engine
        ├── Black-Scholes pricing
        ├── Greeks (delta, gamma, theta, vega, rho)
        ├── IV calculation (Newton-Raphson)
        ├── IV Rank (52-week range)
        ├── Historical volatility (20d / 60d)
        └── Technical signals (RSI, 50/200 DMA, support/resistance)
  ├── yfinance / Yahoo Finance  (market data, cached 15 min)
  └── PostgreSQL  (users, portfolios, positions, recommendations)
```

Market data is never persisted — fetched live and cached in-memory (prices: 15 min TTL, historical: 1 hour TTL).

---

## Authentication

- OAuth only: Google and GitHub
- Implemented via NextAuth.js (frontend) + FastAPI OAuth verification (backend)
- New OAuth login matching an existing email → merge accounts, no duplicate created
- Revoked token → redirect to login with clear message

---

## Data Model

```sql
users
  id, email, oauth_provider, oauth_id, created_at

portfolios
  id, user_id, name, created_at

stock_positions
  id, portfolio_id, symbol, shares, cost_basis,
  purchase_date, notes

options_positions
  id, portfolio_id, symbol, contract_type (call/put),
  position_type (long/short), strike, expiration,
  quantity, premium_paid, opened_at

strategy_recommendations
  id, portfolio_id, symbol, strategy_type (string),
  generated_at, parameters (JSON), status (active/expired/dismissed)
```

Strategy types are plain strings (`covered_call`, `cash_secured_put`, `protective_put`, `collar`, `bull_call_spread`, `bear_put_spread`) — extensible without schema changes.

---

## Portfolio Input

Users can enter positions in two ways:

1. **Manual entry:** symbol + shares + cost basis + purchase date + optional existing options positions
2. **CSV broker import:** Schwab, TD Ameritrade/Thinkorswim, Robinhood, Fidelity supported at launch. Unknown formats show a column-mapping UI. Duplicate positions prompt merge-or-keep. Expired options contracts are imported but flagged.

---

## Strategy Engine

### Calculations
- Black-Scholes for theoretical option value
- Greeks: delta, gamma, theta, vega, rho (via scipy)
- IV: implied from market price via Newton-Raphson
- IV Rank: `(current IV − 52w low) / (52w high − 52w low) × 100`
- Historical volatility: 20-day and 60-day rolling (via pandas/numpy)

### Strategies (extensible)
Each strategy is a Python class implementing `analyze(position, market_data) → StrategyResult`. Adding a new strategy = adding a new class, no other changes.

At launch:
- `covered_call` — sell call against long stock (income)
- `cash_secured_put` — sell put with cash collateral (income + entry)
- `protective_put` — buy put to hedge downside (hedge)
- `collar` — sell call + buy put together (hedge + income)
- `bull_call_spread` — buy lower call, sell higher call (directional)
- `bear_put_spread` — buy higher put, sell lower put (directional hedge)

### Strategy Output (per suggestion)
```json
{
  "strategy": "covered_call",
  "symbol": "AAPL",
  "action": "Sell 1x AAPL $195 Call, exp 2026-04-18",
  "strikes": [195.0],
  "expiration": "2026-04-18",
  "dte": 18,
  "premium_collected": 3.20,
  "max_profit": 420.00,
  "max_loss": -18200.00,
  "breakeven": 191.80,
  "prob_profit": 0.68,
  "greeks": { "delta": -0.32, "gamma": 0.04, "theta": 0.08, "vega": -0.15 },
  "timing_signals": {
    "iv_rank": 72,
    "earnings_days_away": 34,
    "rsi_14": 61.2,
    "above_50dma": true
  },
  "recommendation_strength": "strong"
}
```

### Proactive Alerts
Trigger when:
- IV rank > 50 on a held stock → "Good time to sell premium"
- Stock up >10% from cost basis → "Consider covered call or collar"
- Existing option expiring in <7 days → "Approaching expiration"
- Earnings within 14 days on held position → "Hedge warning"

---

## UI / UX

### Layout: Top Nav + Cards Grid
- Top navigation: Portfolio | Strategies | Alerts | Settings
- Dashboard: grid of position cards, each showing symbol, shares, P&L, and an inline alert badge when a proactive opportunity exists

### Position Card → Strategy Explorer (Tabbed)
Clicking a card opens a full strategy explorer page with three tabs:
- **💰 Income** — covered calls, cash-secured puts
- **🛡️ Hedge** — protective puts, collars, spreads
- **⚡ All Strategies** — everything sorted by recommendation strength

Above the tabs: a market signals bar showing current price, IV rank, earnings date, and RSI.

### Strategy Cards (Tiered Detail)
- **Collapsed:** strategy name, action summary, premium/cost, recommendation strength badge
- **Expanded (click "Show Greeks & Details"):** full numbers grid (max profit, breakeven, P(profit)) + P&L-at-expiration SVG chart + full Greeks row (delta, gamma, theta, vega)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Yahoo Finance fetch fails | Show last cached price with "stale data" badge |
| Options chain unavailable | "Options data unavailable for {symbol}" — skip strategies |
| Rate limit hit | Queue + retry with exponential backoff, show loading state |
| Stock has no options | "No options available for this position" |
| Earnings within expiration window | ⚠️ Warning badge on affected strategy |
| <100 shares for covered call | "Need 100 shares minimum (you have {n})" |
| Unknown CSV broker format | Column-mapping UI for manual mapping |
| Duplicate CSV import | Prompt: merge or keep separate |

---

## Testing

**Backend (pytest):**
- Unit tests for all strategy math against known values
- Unit tests for each strategy class with mock market data
- Integration tests for Yahoo Finance fetching (VCR cassettes)
- Integration tests for CSV parsers (one fixture per broker)
- API endpoint tests for all routes

**Frontend (Jest + Playwright):**
- Unit tests for premium/P&L calculation helpers
- Component tests for strategy cards
- E2E tests: login → add position → view strategies → expand detail

**Strategy contract:** each new strategy class must pass a standard shared test harness.

---

## Deployment

- **Backend:** FastAPI on Railway or Render (Python-native, easy deploy)
- **Frontend:** Vercel (Next.js native)
- **Database:** PostgreSQL on Railway or Supabase
- **Environment variables:** OAuth client IDs/secrets, database URL
