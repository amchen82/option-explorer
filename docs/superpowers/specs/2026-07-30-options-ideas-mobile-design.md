# Ticker-First Options Ideas — Web + iPhone Design

**Date:** 2026-07-30
**Status:** Approved for planning

## Goal

A user enters a ticker and gets a ranked list of concrete option trade ideas. Each idea explains, in plain English, why it is being suggested, whether it is a bullish or bearish bet, what its Greeks mean in dollar terms, and what the current volatility environment implies. The same experience ships as a responsive web page and as a native iPhone app.

## Audience

Beginners. Jargon is defined on first use. Raw numbers are always shown, but a plain-English sentence sits next to every one of them. This is an educational and exploratory tool, not trade execution and not personalized financial advice.

## Scope

**In scope**

- A new public `GET /ideas/{symbol}` endpoint returning quote, market view, volatility context, and ranked ideas.
- Real option chains from yfinance, with a documented model-derived fallback.
- Eight strategy templates, six of which require no existing stock position.
- A plain-English narrative layer: market bias, volatility read, per-idea rationale, Greeks explanations, risk callouts.
- A new mobile-first `/ideas` route in the existing Next.js app.
- A Capacitor wrapper producing iOS and Android projects from a static export of that app.

**Out of scope**

- Trade execution, broker integration, order routing.
- Personalized financial advice or position sizing tied to a user's net worth.
- Backtesting the ideas against the historical `.7z` EOD data in the repo.
- Auth on the ideas flow. It is public, matching the existing `/strategies/public` precedent.
- Push notifications and offline caching in the mobile shell.

## Build Posture: Additive

Nothing existing changes behavior. `GET /strategies/public/{symbol}`, the portfolio dashboard at `/`, the CSV import flow, and all six existing strategy engines remain exactly as they are. The ideas engine is new code alongside them.

The one edit to an existing file is `frontend/next.config.js`, which gains build-mode switches that are inert unless `MOBILE_BUILD=1` is set. Plus one file rename covered under Capacitor below.

Consolidating the older strategy explorer into the ideas engine is deliberately deferred to a follow-up.

## Architecture

```
FastAPI backend                          Next.js app                Capacitor
──────────────                           ───────────                ─────────
services/option_chain.py  ─┐
engine/ideas.py            ├─> routers/ideas.py ──> /ideas route ──> iOS project
engine/narrative.py       ─┘    GET /ideas/{sym}    (client-side)    Android project
                                                          │
                                          MOBILE_BUILD=1 next build
                                                 → out/ → webDir
```

The iPhone app is not a second codebase. It is a native shell around a static export of the same React route, so components, API client, types, and copy exist in exactly one place.

## Backend Components

### `services/option_chain.py`

**Purpose:** Turn a ticker into normalized, usable option contracts.

**Interface**

```python
def get_option_chain(symbol: str, target_dte: int = 35,
                     dte_window: tuple[int, int] = (21, 60)) -> ChainResult
```

`ChainResult` carries `expiration: date`, `dte: int`, `calls: list[Contract]`, `puts: list[Contract]`, and `data_quality: Literal["live", "modeled"]`.

`Contract` is a dataclass: `strike`, `expiration`, `contract_type`, `bid`, `ask`, `last`, `mid`, `volume`, `open_interest`, `implied_volatility`.

**Behavior**

- Reads `yf.Ticker(symbol).options` for available expirations, picks the one closest to `target_dte` within `dte_window`.
- Reads `.option_chain(expiry)`, mapping the yfinance columns `strike`, `bid`, `ask`, `lastPrice`, `volume`, `openInterest`, `impliedVolatility` onto `Contract`. `mid` is `(bid + ask) / 2`, falling back to `last` when the book is empty.
- Drops contracts with no bid and no last price — they are untradeable noise.
- Caches per `(symbol, expiration)` using the `_cache_get`/`_cache_set` TTL pattern already in `services/market_data.py`. TTL comes from a new `option_chain_cache_ttl_seconds` setting, default 900.

**Fallback.** If yfinance raises, returns no expirations, or the filtered chain is empty, the service synthesizes a strike ladder around spot (±30%, at conventional strike intervals) priced with `black_scholes_price` using the modeled IV already produced by `MarketDataService.get_market_signals`. It sets `data_quality: "modeled"`.

The fallback is never silent. `data_quality` propagates all the way into the response and is rendered in the UI, because showing invented strikes as if they were real market quotes would be the single most harmful thing this feature could do.

### `engine/narrative.py`

**Purpose:** All plain-English copy. Pure functions with no I/O, so they are trivially testable and the wording can be revised without touching the math.

```python
def market_bias(signals: dict) -> MarketView
def explain_volatility(signals: dict) -> VolatilityView
def explain_greeks(net_greeks: dict, idea: Idea) -> list[GreekExplanation]
def describe_risks(idea: Idea, signals: dict) -> list[str]
```

**Market bias.** A score in `[-1, 1]` averaged from three components:

| Component | Derivation |
|---|---|
| Trend | `+0.5` above the 50-day MA else `-0.5`, plus `+0.5` above the 200-day MA else `-0.5` |
| Momentum | `(rsi_14 - 50) / 50`, clamped; capped at `±0.3` when RSI is beyond 70 or below 30, since extremes signal exhaustion rather than more of the same |
| Range position | Position within the 52-week range, rescaled from `[0, 1]` to `[-1, 1]` |

Labeled bullish at `>= 0.25`, bearish at `<= -0.25`, neutral between. The magnitude selects the adverb: "mildly" under 0.6, "strongly" at or above it. Every component that fires contributes a driver sentence, so the label always shows its work.

**Volatility.** Regime is bucketed on IV rank: `>= 70` high, `45–70` elevated, `25–45` normal, `< 25` low. `implication` is `favors_selling`, `favors_buying`, or `neutral`. The view also reports `iv_vs_hv = current_iv / hv_20`, which tells the user whether options are priced above or below how much the stock has actually been moving.

**Greeks.** Explained in **position dollar terms** — per-share Greeks multiplied by 100 and by contract count, summed across legs with the correct sign per leg. A user feels "this loses $12 a day," not "theta is -0.04." Both are shown; the sentence leads.

| Greek | Plain-English template |
|---|---|
| Delta | "Moves about $X for every $1 {symbol} moves — similar to owning N shares. Market-implied odds of finishing in the money: ~Y%." |
| Gamma | "How fast the above changes. Higher gamma means the position's direction sensitivity shifts quickly as the stock moves." |
| Theta | "Time decay. This position {loses/gains} about $X per day from time passing alone." |
| Vega | "Volatility sensitivity. {Gains/Loses} about $X for each 1-point rise in implied volatility." |

### `engine/ideas.py`

**Purpose:** Generate and rank candidate trades.

**Templates.** Each selects legs by target delta against the real chain, choosing the nearest available strike.

| Strategy | Bias | Legs (target delta) | Needs shares |
|---|---|---|---|
| Long call | Bullish | Buy call ~0.40 | No |
| Bull call spread | Bullish | Buy call ~0.45 / sell call ~0.25 | No |
| Cash-secured put | Bullish | Sell put ~0.30 | No |
| Long put | Bearish | Buy put ~0.40 | No |
| Bear put spread | Bearish | Buy put ~0.45 / sell put ~0.25 | No |
| Bear call spread | Bearish | Sell call ~0.30 / buy call ~0.15 | No |
| Covered call | Neutral | Sell call ~0.30 | Yes, 100 |
| Collar | Neutral | Sell call ~0.30 / buy put ~0.25 | Yes, 100 |

Deltas come from `calculate_greeks` evaluated at each contract's own implied volatility from the chain. One expiration per template in this pass, targeting ~35 DTE, which keeps the list at roughly eight ideas — enough to compare, few enough to read.

The two share-requiring templates are still generated, flagged `requires_shares: 100`, and rendered in a visually distinct way. They are the two most common beginner income strategies and hiding them entirely would leave a real gap; presenting them as actionable when the user owns nothing would be misleading. Flagging is the honest middle.

**Conviction scoring.** A weighted sum of four components, each in `[-1, 1]`:

| Component | Weight | Derivation |
|---|---|---|
| Directional alignment | 0.40 | Market bias score, signed by the idea's bias. Neutral ideas score `1 - abs(bias_score)` — they are best when there is no clear direction |
| Volatility fit | 0.30 | `(iv_rank - 50) / 50`, positive for net-credit ideas, negated for net-debit ideas |
| Liquidity | 0.20 | Blend of worst-leg open interest and bid/ask spread as a fraction of mid. Exactly `0` when `data_quality` is `modeled`, since liquidity is then unknown rather than good |
| Earnings proximity | 0.10 | `-0.5` when an earnings date falls before expiration, `0` otherwise |

Mapped to `[0, 1]` and bucketed: high at `>= 0.65`, medium at `>= 0.45`, low below.

**The central design decision: rationale is generated by the scorer, not written separately.** Each component whose contribution exceeds a magnitude threshold emits its own sentence into the idea's `why` array. The explanation and the ranking are the same computation rendered two ways, so they cannot contradict each other. An idea ranked highly for elevated IV literally says "IV rank 62 — you are being paid above-average premium to sell."

Earnings proximity always emits a risk line whether or not it clears the rationale threshold, because it is a hazard the user needs regardless of its weight in the ranking.

### `routers/ideas.py`

`GET /ideas/{symbol}` — public, no auth, registered in `main.py` alongside the existing routers.

Optional `shares: int = 0` query parameter. When greater than 0, the share-requiring templates are marked satisfied rather than flagged.

**Response**

```jsonc
{
  "symbol": "AAPL",
  "as_of": "2026-07-30T14:22:00Z",
  "data_quality": "live",
  "quote": { "price": 231.4, "52w_high": 260.1, "52w_low": 164.0 },
  "market_view": {
    "bias": "bullish", "score": 0.42, "headline": "Mildly bullish",
    "drivers": ["Trading above both the 50- and 200-day averages",
                "RSI 58 — momentum is positive without being overbought"]
  },
  "volatility": {
    "current_iv": 0.285, "iv_rank": 62, "hv_20": 0.24, "iv_vs_hv": 1.19,
    "regime": "elevated", "implication": "favors_selling",
    "headline": "Options are pricier than usual",
    "detail": "IV rank 62 means implied volatility is higher than it was on 62% of days in the past year. Sellers collect more premium; buyers pay up."
  },
  "ideas": [{
    "id": "bull_call_spread-2026-09-04-230-245",
    "strategy": "bull_call_spread", "name": "Bull Call Spread",
    "bias": "bullish", "conviction": "high", "conviction_score": 0.71,
    "summary": "Buy the $230 call, sell the $245 call, both expiring Sep 4",
    "legs": [
      { "action": "buy",  "contract_type": "call", "strike": 230,
        "expiration": "2026-09-04", "price": 8.40, "implied_volatility": 0.28,
        "open_interest": 1200, "volume": 340, "quantity": 1 },
      { "action": "sell", "contract_type": "call", "strike": 245,
        "expiration": "2026-09-04", "price": 2.00, "implied_volatility": 0.26,
        "open_interest": 890,  "volume": 210, "quantity": 1 }
    ],
    "net_debit_credit": -640, "capital_required": 640,
    "max_profit": 860, "max_loss": -640, "breakeven": 236.40,
    "prob_profit": 0.44, "dte": 36, "requires_shares": 0,
    "why": ["Above both moving averages with RSI 58 — the trend supports a bullish bet",
            "Capping upside at $245 cuts the cost by 43% versus buying the call outright"],
    "greeks": { "delta": 0.31, "gamma": 0.02, "theta": -0.04, "vega": 0.11 },
    "greeks_explained": [{ "greek": "delta", "value": 0.31,
      "plain": "Moves about $31 for every $1 AAPL moves — similar to owning 31 shares." }],
    "risks": ["Earnings on Aug 28, before this expires — expect a sharp move and an implied-volatility drop after"],
    "data_quality": "live"
  }]
}
```

Ideas are returned sorted by `conviction_score` descending.

## Frontend

### New route `/ideas`

Mobile-first, single column, readable at 375px and scaling up to desktop. Client-rendered so it works under static export. Existing routes untouched.

1. **Ticker search** — large, autofocused, uppercase-normalized, submits on Enter.
2. **Quote header** — price, and a bias pill colored green, red, or neutral gray with the market-view headline.
3. **Volatility card** — IV-rank gauge, headline, plain-English detail, and the IV-vs-HV comparison.
4. **Idea list** — collapsed cards showing name, bias pill, conviction, max profit, max loss, and probability of profit. Expanding reveals legs, "Why this trade," the Greeks table with a plain-English sentence per row, risks, and the existing `PnLChart` component reused.
5. **Data-quality banner** — shown whenever `data_quality` is `modeled`, stating plainly that strikes and premiums are model-derived rather than live quotes.
6. **Persistent disclaimer** — educational tool, not financial advice.

Colors and surfaces reuse the existing `--tv-*` CSS variables so the new route matches the current theme.

### New components

`components/ideas/TickerSearch.tsx`, `MarketViewHeader.tsx`, `VolatilityCard.tsx`, `IdeaCard.tsx`, `GreeksTable.tsx`. New types in `lib/types.ts`, and an `api.ideas.get(symbol, shares?)` method following the existing `apiFetch` pattern in `lib/api.ts`.

## Capacitor Wrapper

**Static export.** `next.config.js` reads `MOBILE_BUILD`. When set to `1`, it applies `output: 'export'`, `distDir: '.next-mobile'`, and `images.unoptimized: true`. When unset, config is unchanged from today, so the web build and the Render deployment are unaffected.

**The auth route problem.** Next.js refuses to static-export a project containing a route handler, and `app/api/auth/[...nextauth]/route.ts` is one. It is renamed to `route.server.ts`, and `pageExtensions` becomes `['server.ts', 'server.tsx', 'ts', 'tsx']` for web builds and `['ts', 'tsx']` for mobile builds. The web build still registers the auth route; the mobile build simply does not see the file. This is a supported Next.js mechanism, not a workaround, and the mobile app has no need for NextAuth since the ideas flow is public.

**Config.** `frontend/capacitor.config.ts` with `appId: "com.options.ideas"`, `appName: "Options Ideas"`, `webDir: "out"`. Dependencies: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, plus `@capacitor/status-bar` for dark-theme status bar and `@capacitor/keyboard` for search-input behavior.

**API URL.** Mobile builds must set `NEXT_PUBLIC_API_URL` to the deployed backend. `localhost` does not resolve from a phone, and the value is baked in at build time. Backend CORS already reads origins from the environment; `capacitor://localhost` and `http://localhost` are added for the native webview.

**Scripts.** `build:mobile` (cross-env `MOBILE_BUILD=1 next build`), `cap:sync`, `cap:ios`, `cap:android`.

### Platform constraint, stated plainly

Scaffolding and syncing the iOS project works on Windows. **Compiling it, running the simulator, and producing an `.ipa` require Xcode on macOS.** There is no way around this; it is Apple's toolchain restriction, not a project limitation.

On Windows 11 the user can: run the identical UI in a browser at iPhone viewport, build and run the Android app locally via Android Studio, and use Capacitor live-reload against a dev server on a physical iPhone over the local network. The committed iOS project is then ready to open and build unchanged on a Mac or a cloud Mac service. `docs/mobile-build.md` documents this path.

## Error Handling

| Condition | Behavior |
|---|---|
| Unknown or invalid ticker | `404` with a clear message; UI shows "We couldn't find that ticker" |
| yfinance unavailable or chain empty | Modeled fallback, `data_quality: "modeled"`, banner in UI |
| Quote unavailable | Existing `MarketDataService` synthetic fallback already handles this; surfaces as `modeled` |
| No contract near a template's target delta | That template is skipped rather than emitting a bad strike |
| Network failure in the app | Inline retry, preserving the entered ticker |

## Testing

**Backend** (`pytest`, matching the existing `backend/tests` layout)

- `test_narrative.py` — bias labeling at boundaries, volatility regime buckets, Greeks sentences for long and short positions with correct sign and dollar scaling.
- `test_ideas.py` — template leg selection against a fixture chain, conviction ordering, rationale presence for every scored component, `requires_shares` flagging, skipping when no strike matches.
- `test_option_chain.py` — normalization from a `vcrpy` cassette or a stubbed yfinance object, expiration selection within the DTE window, modeled fallback path, cache hits.
- `test_routers/test_ideas.py` — response shape, `404` on a bad ticker, `data_quality` propagation.

**Frontend**

- Playwright smoke test: enter a ticker, assert idea cards render, expand one, assert the "Why this trade" and Greeks sections appear.

**Mobile**

- Verify `MOBILE_BUILD=1 npm run build:mobile` produces `out/` with a working `/ideas` page.
- Verify `npx cap sync` completes and the iOS and Android projects are generated.
- Verify the Android build runs and reaches the backend.

## Verification

- All new and existing backend tests pass.
- Existing endpoints return unchanged responses — the additive guarantee is checked, not assumed.
- The web build succeeds with `MOBILE_BUILD` unset and behaves exactly as before.
- `/ideas` renders end-to-end against a live ticker and against the modeled fallback.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| yfinance option chains are rate-limited and occasionally break | Aggressive caching, modeled fallback, `data_quality` surfaced honestly |
| Users read ranked ideas as financial advice | Persistent disclaimer, education-framed copy, no position sizing, risks shown on every idea |
| Modeled strikes mistaken for real quotes | `data_quality` flag propagated to a visible banner and per-idea badge |
| iOS build blocked on Windows | Documented Mac and cloud-Mac path; Android and browser verification available immediately |
