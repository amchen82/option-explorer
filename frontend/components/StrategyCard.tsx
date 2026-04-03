"use client";

import { useState } from "react";
import type { StrategyResult } from "@/lib/types";
import PnLChart from "./PnLChart";

interface Props {
  strategy: StrategyResult;
  currentPrice: number;
}

const STRATEGY_LABELS: Record<string, string> = {
  covered_call: "Covered Call",
  cash_secured_put: "Cash-Secured Put",
  protective_put: "Protective Put",
  collar: "Collar",
  bull_call_spread: "Bull Call Spread",
  bear_put_spread: "Bear Put Spread",
};

const STRENGTH_STYLES: Record<StrategyResult["recommendation_strength"], string> = {
  strong: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  moderate: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  weak: "border-slate-500/30 bg-slate-500/10 text-slate-200",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value?: number | null) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${(value * 100).toFixed(0)}%`;
}

export default function StrategyCard({ strategy, currentPrice }: Props) {
  const [expanded, setExpanded] = useState(false);
  const premium = strategy.premium_collected ?? strategy.net_credit ?? strategy.cost ?? strategy.net_debit;
  const premiumIsPositive = strategy.premium_collected !== undefined || strategy.net_credit !== undefined;
  const premiumLabel = strategy.cost !== undefined || strategy.net_debit !== undefined ? "Net debit" : "Premium";

  return (
    <article
      className={`rounded-3xl border p-4 shadow-lg shadow-cyan-950/10 ${STRENGTH_STYLES[strategy.recommendation_strength]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-50">
              {STRATEGY_LABELS[strategy.strategy] ?? strategy.strategy.replace(/_/g, " ")}
            </h3>
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-300">
              {strategy.recommendation_strength}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-200">{strategy.action}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{premiumLabel}</div>
          <div className="mt-1 text-sm font-semibold text-slate-50">
            {premiumIsPositive ? "+" : "-"}
            {money(Math.abs(premium ?? 0))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-950/50 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Breakeven</div>
          <div className="mt-1 font-medium text-slate-100">
            {strategy.breakeven ? money(strategy.breakeven) : "-"}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950/50 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Probability</div>
          <div className="mt-1 font-medium text-slate-100">{percent(strategy.prob_profit)}</div>
        </div>
        <div className="rounded-2xl bg-slate-950/50 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">IV rank</div>
          <div className="mt-1 font-medium text-slate-100">{strategy.timing_signals.iv_rank.toFixed(0)}</div>
        </div>
        <div className="rounded-2xl bg-slate-950/50 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">DTE</div>
          <div className="mt-1 font-medium text-slate-100">{strategy.dte} days</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
          Delta {strategy.greeks.delta.toFixed(3)}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
          Theta {strategy.greeks.theta.toFixed(3)}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
          Vega {strategy.greeks.vega.toFixed(3)}
        </span>
        {strategy.timing_signals.earnings_days_away !== undefined &&
          strategy.timing_signals.earnings_days_away !== null && (
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
              Earnings {strategy.timing_signals.earnings_days_away}d
            </span>
          )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <PnLChart strategy={strategy} currentPrice={currentPrice} />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/50 px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Max profit</div>
              <div className="mt-1 text-sm font-semibold text-emerald-300">{money(strategy.max_profit)}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Max loss</div>
              <div className="mt-1 text-sm font-semibold text-rose-300">{money(strategy.max_loss)}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">RSI</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">
                {strategy.timing_signals.rsi_14.toFixed(1)} /{" "}
                {strategy.timing_signals.above_50dma ? "Above" : "Below"}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
