"use client";

import type { StrategyResult } from "@/lib/types";

interface Props {
  strategy: StrategyResult;
  currentPrice: number;
}

function buildPayoff(strategy: StrategyResult, price: number, referencePrice: number): number {
  const premium =
    strategy.premium_collected ?? strategy.net_credit ?? -(strategy.cost ?? strategy.net_debit ?? 0);
  const premiumValue = premium ?? 0;

  switch (strategy.strategy) {
    case "covered_call":
    case "cash_secured_put":
      return premiumValue + Math.min(0, price - (strategy.strike ?? strategy.short_strike ?? price));
    case "protective_put":
      return -Math.max(0, (strategy.strike ?? strategy.long_strike ?? price) - price) - (strategy.cost ?? 0);
    case "collar":
      return (
        premiumValue +
        Math.min(0, price - (strategy.call_strike ?? strategy.short_strike ?? price)) +
        Math.max(0, (strategy.put_strike ?? strategy.long_strike ?? price) - price)
      );
    case "bull_call_spread":
      return (
        -Math.max(0, price - (strategy.short_strike ?? strategy.call_strike ?? price)) +
        Math.max(0, price - (strategy.long_strike ?? strategy.strike ?? price)) +
        premiumValue
      );
    case "bear_put_spread":
      return (
        Math.max(0, (strategy.short_strike ?? strategy.put_strike ?? price) - price) -
        Math.max(0, (strategy.long_strike ?? strategy.strike ?? price) - price) +
        premiumValue
      );
    default:
      return premiumValue + price - referencePrice;
  }
}

export default function PnLChart({ strategy, currentPrice }: Props) {
  const width = 360;
  const height = 160;
  const padding = { top: 16, right: 18, bottom: 24, left: 18 };

  const anchorPrice = Math.max(currentPrice, strategy.strike ?? currentPrice);
  const span = Math.max(anchorPrice * 0.2, 5);
  const low = Math.max(0.01, anchorPrice - span);
  const high = anchorPrice + span;
  const samples = 24;
  const prices = Array.from({ length: samples }, (_, index) => low + ((high - low) * index) / (samples - 1));
  const payoffs = prices.map((price) => buildPayoff(strategy, price, currentPrice));
  const minPnl = Math.min(...payoffs, 0);
  const maxPnl = Math.max(...payoffs, 0);
  const range = Math.max(maxPnl - minPnl, 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const toX = (price: number) => padding.left + ((price - low) / (high - low)) * chartWidth;
  const toY = (pnl: number) => padding.top + ((maxPnl - pnl) / range) * chartHeight;

  const points = prices.map((price, index) => `${toX(price)},${toY(payoffs[index])}`).join(" ");
  const zeroY = toY(0);
  const fillPoints = `${toX(low)},${zeroY} ${points} ${toX(high)},${zeroY}`;
  const markerX = toX(currentPrice);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-500">
        <span>Estimated payoff</span>
        <span>Reference {currentPrice.toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[160px] w-full">
        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="#334155"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <polygon points={fillPoints} fill="#22d3ee" fillOpacity={0.12} />
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth={2} />
        <line
          x1={markerX}
          y1={padding.top}
          x2={markerX}
          y2={height - padding.bottom}
          stroke="#818cf8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={padding.left} y={height - 6} fill="#64748b" fontSize={10}>
          ${low.toFixed(0)}
        </text>
        <text x={width - padding.right - 28} y={height - 6} fill="#64748b" fontSize={10}>
          ${high.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}
