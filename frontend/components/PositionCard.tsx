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
      className="group w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{position.symbol}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-50">{position.shares} shares</h3>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
          Long equity
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
          <dt className="text-slate-400">Cost basis</dt>
          <dd className="mt-1 font-medium text-slate-100">{money(position.cost_basis)}</dd>
        </div>
        <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
          <dt className="text-slate-400">Value</dt>
          <dd className="mt-1 font-medium text-slate-100">{money(price * position.shares)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`text-sm font-medium ${positive ? "text-emerald-300" : "text-rose-300"}`}>
          {hasCurrentPrice ? (
            <>
              {positive ? "+" : "-"}
              {money(Math.abs(pnl))} ({positive ? "+" : "-"}
              {Math.abs(pnlPct).toFixed(1)}%)
            </>
          ) : (
            <span className="text-slate-400">Market price unavailable</span>
          )}
        </div>
        <span className="text-xs text-slate-400 transition group-hover:text-slate-200">
          Explore strategies
        </span>
      </div>

      {position.notes && <p className="mt-4 text-sm leading-6 text-slate-400">{position.notes}</p>}
    </button>
  );
}
