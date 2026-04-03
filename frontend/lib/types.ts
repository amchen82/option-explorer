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
  reference_price: number;
  position: { symbol: string; shares: number; cost_basis: number; cash?: number };
  income: StrategyResult[];
  hedge: StrategyResult[];
  all: StrategyResult[];
  alerts: Alert[];
  market_data_stale: boolean;
}
