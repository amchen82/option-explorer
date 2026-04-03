"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Alert, StrategiesResponse, StrategyResult } from "@/lib/types";
import StrategyCard from "./StrategyCard";

interface Props {
  symbol: string | null;
  guestShares?: number;
  guestCostBasis?: number;
}

type Tab = "income" | "hedge" | "all";

const TAB_LABELS: Record<Tab, string> = {
  income: "Income",
  hedge: "Hedges",
  all: "All",
};

export default function StrategyExplorer({ symbol, guestShares = 100, guestCostBasis }: Props) {
  const [tab, setTab] = useState<Tab>("income");
  const [data, setData] = useState<StrategiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    api.strategies
      .getPublic(symbol, guestShares, guestCostBasis)
      .then((response: StrategiesResponse) => {
        if (active) {
          setData(response);
        }
      })
      .catch((fetchError: unknown) => {
        if (!active) {
          return;
        }

        setData(null);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load strategies");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [guestCostBasis, guestShares, symbol]);

  const strategies: StrategyResult[] = data ? data[tab] : [];
  const referencePrice = data?.reference_price ?? guestCostBasis ?? 0;

  return (
    <div className="min-h-[32rem] rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-cyan-950/20">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Strategy explorer</p>
        {symbol ? (
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">
            {symbol}
            <span className="ml-3 text-sm font-normal text-slate-400">Reference {referencePrice.toFixed(2)}</span>
          </h2>
        ) : (
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">Select a ticker</h2>
        )}
      </div>

      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2 border-b border-white/10 px-5 py-4 sm:px-6">
          {data.alerts.map((alert: Alert, index: number) => (
            <div
              key={`${alert.message}-${index}`}
              className={`rounded-2xl px-4 py-3 text-sm ${
                alert.severity === "warning"
                  ? "border border-amber-400/20 bg-amber-400/10 text-amber-100"
                  : "border border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-white/10 px-5 py-4 sm:px-6">
        {(["income", "hedge", "all"] as Tab[]).map((nextTab) => {
          const isActive = tab === nextTab;

          return (
            <button
              key={nextTab}
              type="button"
              onClick={() => setTab(nextTab)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-slate-100"
              }`}
            >
              {TAB_LABELS[nextTab]}
            </button>
          );
        })}
      </div>

      <div className="max-h-[48rem] overflow-y-auto px-5 py-5 sm:px-6">
        {!symbol ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
            Add a ticker above to start comparing strategy ideas.
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
            Loading strategy ideas...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-10 text-center text-sm text-rose-100">
            {error}
          </div>
        ) : strategies.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
            No strategies available for this view.
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <StrategyCard
                key={`${strategy.strategy}-${strategy.expiration}-${strategy.strike ?? strategy.long_strike ?? strategy.short_strike ?? "na"}`}
                strategy={strategy}
                currentPrice={referencePrice}
              />
            ))}
          </div>
        )}

        {data?.market_data_stale && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Market data may be stale.
          </div>
        )}
      </div>
    </div>
  );
}
