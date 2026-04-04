import type { StrategiesResponse, StrategyResult } from "./types";

// Rough reference prices for common tickers. Unknown symbols fall back to 100.
const REFERENCE_PRICES: Record<string, number> = {
  AAPL: 192.5,
  MSFT: 425.0,
  NVDA: 875.0,
  AMZN: 198.0,
  GOOGL: 168.0,
  META: 595.0,
  TSLA: 248.0,
  SPY: 572.0,
  QQQ: 488.0,
  IWM: 205.0,
  AMD: 162.0,
  NFLX: 985.0,
  JPM: 245.0,
  GS: 558.0,
  BAC: 44.0,
};

// Next monthly expiry ~35 DTE from a fixed demo anchor date
const DEMO_EXPIRY = "2026-05-16";
const DEMO_DTE = 42;

function r(n: number, decimals = 2) {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

export function getMockStrategies(symbol: string): StrategiesResponse {
  const p = REFERENCE_PRICES[symbol.toUpperCase()] ?? 100;

  const timingSignals = {
    iv_rank: 48,
    rsi_14: 54.2,
    above_50dma: true,
    earnings_days_away: 22,
  };

  const coveredCall: StrategyResult = {
    strategy: "covered_call",
    symbol,
    action: `Sell 1 ${symbol} ${r(p * 1.03)} call expiring ${DEMO_EXPIRY}`,
    strike: r(p * 1.03),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    premium_collected: r(p * 0.011),
    max_profit: r(p * 0.011 + p * 0.03),
    max_loss: r(p - p * 0.011),
    breakeven: r(p - p * 0.011),
    prob_profit: 0.72,
    greeks: { delta: 0.28, gamma: -0.008, theta: 0.074, vega: -0.142, rho: 0.018 },
    timing_signals: timingSignals,
    recommendation_strength: "strong",
  };

  const cashSecuredPut: StrategyResult = {
    strategy: "cash_secured_put",
    symbol,
    action: `Sell 1 ${symbol} ${r(p * 0.97)} put expiring ${DEMO_EXPIRY}`,
    strike: r(p * 0.97),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    premium_collected: r(p * 0.013),
    max_profit: r(p * 0.013),
    max_loss: r(p * 0.97 - p * 0.013),
    breakeven: r(p * 0.97 - p * 0.013),
    prob_profit: 0.68,
    greeks: { delta: -0.31, gamma: -0.009, theta: 0.082, vega: -0.157, rho: -0.021 },
    timing_signals: timingSignals,
    recommendation_strength: "moderate",
  };

  const protectivePut: StrategyResult = {
    strategy: "protective_put",
    symbol,
    action: `Buy 1 ${symbol} ${r(p * 0.95)} put expiring ${DEMO_EXPIRY}`,
    strike: r(p * 0.95),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    cost: r(p * 0.018),
    max_profit: r(p * 4.0),
    max_loss: r(p * 0.05 + p * 0.018),
    breakeven: r(p + p * 0.018),
    prob_profit: 0.41,
    greeks: { delta: -0.22, gamma: 0.007, theta: -0.061, vega: 0.131, rho: -0.014 },
    timing_signals: timingSignals,
    recommendation_strength: "moderate",
  };

  const collar: StrategyResult = {
    strategy: "collar",
    symbol,
    action: `Sell ${r(p * 1.04)} call / Buy ${r(p * 0.96)} put expiring ${DEMO_EXPIRY}`,
    call_strike: r(p * 1.04),
    put_strike: r(p * 0.96),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    net_credit: r(p * 0.004),
    max_profit: r(p * 0.04 + p * 0.004),
    max_loss: r(p * 0.04 - p * 0.004),
    breakeven: r(p - p * 0.004),
    prob_profit: 0.55,
    greeks: { delta: 0.06, gamma: -0.001, theta: 0.021, vega: -0.028, rho: 0.003 },
    timing_signals: timingSignals,
    recommendation_strength: "moderate",
  };

  const bullCallSpread: StrategyResult = {
    strategy: "bull_call_spread",
    symbol,
    action: `Buy ${r(p * 1.01)} / Sell ${r(p * 1.06)} call spread expiring ${DEMO_EXPIRY}`,
    long_strike: r(p * 1.01),
    short_strike: r(p * 1.06),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    net_debit: r(p * 0.022),
    max_profit: r(p * 0.05 - p * 0.022),
    max_loss: r(p * 0.022),
    breakeven: r(p * 1.01 + p * 0.022),
    prob_profit: 0.44,
    greeks: { delta: 0.19, gamma: 0.004, theta: -0.038, vega: 0.072, rho: 0.011 },
    timing_signals: timingSignals,
    recommendation_strength: "weak",
  };

  const bearPutSpread: StrategyResult = {
    strategy: "bear_put_spread",
    symbol,
    action: `Buy ${r(p * 0.99)} / Sell ${r(p * 0.94)} put spread expiring ${DEMO_EXPIRY}`,
    long_strike: r(p * 0.99),
    short_strike: r(p * 0.94),
    expiration: DEMO_EXPIRY,
    dte: DEMO_DTE,
    net_debit: r(p * 0.019),
    max_profit: r(p * 0.05 - p * 0.019),
    max_loss: r(p * 0.019),
    breakeven: r(p * 0.99 - p * 0.019),
    prob_profit: 0.39,
    greeks: { delta: -0.17, gamma: 0.003, theta: -0.033, vega: 0.064, rho: -0.009 },
    timing_signals: timingSignals,
    recommendation_strength: "weak",
  };

  return {
    symbol,
    reference_price: p,
    position: { symbol, shares: 100, cost_basis: p },
    income: [coveredCall, cashSecuredPut],
    hedge: [protectivePut, collar],
    all: [coveredCall, cashSecuredPut, protectivePut, collar, bullCallSpread, bearPutSpread],
    alerts: [
      {
        type: "demo",
        message: "Backend unreachable — showing illustrative demo data. Prices and Greeks are not live.",
        severity: "warning",
      },
    ],
    market_data_stale: true,
  };
}
