"use client";

import type { StockPosition } from "@/lib/types";

interface Props {
  position: StockPosition;
  currentPrice?: number;
  onClick: () => void;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PositionCard({ position, currentPrice, onClick }: Props) {
  const price = currentPrice ?? position.cost_basis;
  const pnl = (price - position.cost_basis) * position.shares;
  const pnlPct = position.cost_basis === 0 ? 0 : ((price - position.cost_basis) / position.cost_basis) * 100;
  const positive = pnl >= 0;
  const hasCurrentPrice = currentPrice !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded border border-[var(--tv-border)] bg-[var(--tv-surface)] p-4 text-left transition hover:border-[var(--text-accent)] hover:bg-[var(--tv-surface-2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-accent)]">{position.symbol}</p>
          <h3 className="mt-1.5 text-lg font-semibold text-[var(--text-primary)]">{position.shares} shares</h3>
        </div>
        <span className="rounded border border-[rgba(38,166,154,0.3)] bg-[rgba(38,166,154,0.08)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-positive)]">
          Long
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded bg-[var(--tv-bg)] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Cost basis</dt>
          <dd className="metric mt-1 text-[13px] font-medium text-[var(--text-primary)]">{money(position.cost_basis)}</dd>
        </div>
        <div className="rounded bg-[var(--tv-bg)] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Value</dt>
          <dd className="metric mt-1 text-[13px] font-medium text-[var(--text-primary)]">{money(price * position.shares)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className={`metric text-[13px] font-medium ${positive ? "text-[var(--text-positive)]" : "text-[var(--text-negative)]"}`}>
          {hasCurrentPrice ? (
            <>
              {positive ? "+" : "−"}
              {money(Math.abs(pnl))} ({positive ? "+" : "−"}
              {Math.abs(pnlPct).toFixed(1)}%)
            </>
          ) : (
            <span className="text-[var(--text-tertiary)]">Market price unavailable</span>
          )}
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] transition group-hover:text-[var(--text-accent)]">
          Explore →
        </span>
      </div>

      {position.notes && <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">{position.notes}</p>}
    </button>
  );
}
