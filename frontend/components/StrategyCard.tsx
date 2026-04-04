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

const STRATEGY_COLORS: Record<string, string> = {
  covered_call: "#ffd60a",
  cash_secured_put: "#ff9f1c",
  protective_put: "#4cc9f0",
  collar: "#ff85c2",
  bull_call_spread: "#00d2a0",
  bear_put_spread: "#ff4d6d",
};

const STRENGTH_STYLES: Record<StrategyResult["recommendation_strength"], string> = {
  strong: "border-[rgba(25,179,155,0.28)] bg-[rgba(25,179,155,0.06)] text-[var(--text-primary)]",
  moderate: "border-[var(--tv-border)] bg-[var(--tv-surface-2)] text-[var(--text-primary)]",
  weak: "border-[var(--tv-border)] bg-[var(--tv-surface)] text-[var(--text-primary)]",
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
  const strategyColor = STRATEGY_COLORS[strategy.strategy] ?? "#a78bfa";
  const premium = strategy.premium_collected ?? strategy.net_credit ?? strategy.cost ?? strategy.net_debit;
  const premiumIsPositive = strategy.premium_collected !== undefined || strategy.net_credit !== undefined;
  const premiumLabel = strategy.cost !== undefined || strategy.net_debit !== undefined ? "Net debit" : "Premium";
  const greeks = strategy.greeks;
  const timingSignals = strategy.timing_signals;

  function greekValue(value?: number) {
    return typeof value === "number" ? value.toFixed(3) : "-";
  }

  return (
    <article
      className={`rounded border p-4 ${STRENGTH_STYLES[strategy.recommendation_strength]}`}
      style={{
        borderLeftColor: strategyColor,
        borderLeftWidth: "3px",
        boxShadow: `0 4px 28px ${strategyColor}28, inset 0 0 60px ${strategyColor}06`,
        background: `linear-gradient(135deg, ${strategyColor}12 0%, var(--tv-surface) 55%)`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-lg font-semibold tracking-tight"
              style={{ color: STRATEGY_COLORS[strategy.strategy] ?? "var(--text-label)" }}
            >
              {STRATEGY_LABELS[strategy.strategy] ?? strategy.strategy.replace(/_/g, " ")}
            </h3>
            <span className="flex items-center gap-1.5 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              <span className={`h-1.5 w-1.5 rounded-full ${
                strategy.recommendation_strength === "strong"
                  ? "bg-[var(--text-positive)]"
                  : strategy.recommendation_strength === "moderate"
                    ? "bg-[var(--text-warning)]"
                    : "bg-[var(--text-tertiary)]"
              }`} />
              {strategy.recommendation_strength}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{strategy.action}</p>
        </div>
        <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-label)]">{premiumLabel}</div>
          <div className="metric mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {premiumIsPositive ? "+" : "-"}
            {money(Math.abs(premium ?? 0))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-label)]">Breakeven</div>
          <div className="metric mt-1 font-medium text-[var(--text-primary)]">
            {strategy.breakeven ? money(strategy.breakeven) : "-"}
          </div>
        </div>
        <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-label)]">Probability</div>
          <div className="metric mt-1 font-medium text-[var(--text-primary)]">{percent(strategy.prob_profit)}</div>
        </div>
        <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-label)]">IV rank</div>
          <div className="metric mt-1 font-medium text-[var(--text-primary)]">
            {typeof timingSignals.iv_rank === "number" ? timingSignals.iv_rank.toFixed(0) : "-"}
          </div>
        </div>
        <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-label)]">DTE</div>
          <div className="metric mt-1 font-medium text-[var(--text-primary)]">{strategy.dte} days</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-primary)]">
        <span className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-1">
          <span className="text-[var(--text-label)]">Delta</span>{" "}{greekValue(greeks?.delta)}
        </span>
        <span className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-1">
          <span className="text-[var(--text-label)]">Theta</span>{" "}{greekValue(greeks?.theta)}
        </span>
        <span className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-1">
          <span className="text-[var(--text-label)]">Vega</span>{" "}{greekValue(greeks?.vega)}
        </span>
        {timingSignals.earnings_days_away !== undefined &&
          timingSignals.earnings_days_away !== null && (
            <span className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-1">
              <span className="text-[var(--text-label)]">Earnings</span>{" "}{timingSignals.earnings_days_away}d
            </span>
          )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-accent)] transition hover:opacity-80"
        >
          {expanded ? "Hide details" : "Show details"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M2.5 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <PnLChart strategy={strategy} currentPrice={currentPrice} />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-label)]">Max profit</div>
              <div className="metric mt-1 text-sm font-semibold text-[var(--text-positive)]">{money(strategy.max_profit)}</div>
            </div>
            <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-label)]">Max loss</div>
              <div className="metric mt-1 text-sm font-semibold text-[var(--text-negative)]">{money(strategy.max_loss)}</div>
            </div>
            <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-label)]">RSI</div>
              <div className="metric mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {typeof timingSignals.rsi_14 === "number" ? timingSignals.rsi_14.toFixed(1) : "-"} /{" "}
                {typeof timingSignals.above_50dma === "boolean"
                  ? timingSignals.above_50dma
                    ? "Above"
                    : "Below"
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
