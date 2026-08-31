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

export type Bias = "bullish" | "bearish" | "neutral";
export type Conviction = "high" | "medium" | "low";
export type DataQuality = "live" | "modeled";

export interface IdeaLeg {
  action: "buy" | "sell";
  contract_type: "call" | "put";
  strike: number;
  expiration: string;
  quantity: number;
  price: number;
  bid: number;
  ask: number;
  implied_volatility: number;
  open_interest: number;
  volume: number;
  delta: number;
}

export interface GreekExplanation {
  greek: string;
  label: string;
  value: number;
  dollars: number | null;
  plain: string;
}

export interface Idea {
  id: string;
  symbol: string;
  strategy: string;
  name: string;
  bias: Bias;
  summary: string;
  legs: IdeaLeg[];
  expiration: string;
  dte: number;
  net_debit_credit: number;
  is_credit: boolean;
  max_profit: number | null;
  max_profit_when: string;
  max_loss: number;
  max_loss_when: string;
  breakeven: number;
  prob_profit: number;
  capital_required: number;
  requires_shares: number;
  shares_satisfied: boolean;
  conviction: Conviction;
  conviction_score: number;
  why: string[];
  greeks: Greeks;
  greeks_explained: GreekExplanation[];
  risks: string[];
  liquidity: { spread_pct: number; min_open_interest: number; min_volume: number };
  data_quality: DataQuality;
}

export interface MarketView {
  bias: Bias;
  score: number;
  headline: string;
  drivers: string[];
}

export interface VolatilityView {
  current_iv: number;
  iv_rank: number;
  hv_20: number;
  iv_vs_hv: number;
  regime: "high" | "elevated" | "normal" | "low";
  implication: "favors_selling" | "favors_buying" | "neutral";
  headline: string;
  detail: string;
  comparison: string;
}

export type ExpirationBucket = "0d" | "1w" | "2w" | "1m" | "3m" | "6m" | "12m" | "gt12m";

export interface IdeasResponse {
  symbol: string;
  as_of: string;
  data_quality: DataQuality;
  expiration: string;
  expiration_bucket: ExpirationBucket;
  dte: number;
  quote: { symbol: string; price: number; "52w_high": number; "52w_low": number; stale: boolean };
  market_view: MarketView;
  volatility: VolatilityView;
  ideas: Idea[];
  disclaimer: string;
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
