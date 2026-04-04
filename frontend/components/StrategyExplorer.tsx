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
    <div className="tv-panel min-h-[32rem] rounded-xl">
      <div className="border-b border-[var(--tv-border)] px-5 py-4 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Strategy explorer</p>
        {symbol ? (
          <h2 className="mt-1 text-[1.55rem] font-semibold text-[var(--text-primary)]">
            {symbol}
            <span className="metric ml-3 text-sm font-normal text-[var(--text-secondary)]">Reference {referencePrice.toFixed(2)}</span>
          </h2>
        ) : (
          <h2 className="mt-1 text-[1.55rem] font-semibold text-[var(--text-primary)]">Select a ticker</h2>
        )}
      </div>

      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2 border-b border-white/10 px-5 py-4 sm:px-6">
          {data.alerts.map((alert: Alert, index: number) => (
            <div
              key={`${alert.message}-${index}`}
              className={`rounded-2xl px-4 py-3 text-sm ${
                alert.severity === "warning"
                  ? "border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] text-[#f1c27a]"
                  : "border border-[rgba(76,141,255,0.3)] bg-[rgba(76,141,255,0.12)] text-[#b5ceff]"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-[var(--tv-border)] px-5 py-4 sm:px-6">
        {(["income", "hedge", "all"] as Tab[]).map((nextTab) => {
          const isActive = tab === nextTab;

          return (
            <button
              key={nextTab}
              type="button"
              onClick={() => setTab(nextTab)}
              className={`rounded-md border px-4 py-2 text-sm transition ${
                isActive
                  ? "border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] text-white"
                  : "border-[var(--tv-border)] bg-[var(--tv-surface)] text-[var(--text-secondary)] hover:bg-[var(--tv-surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              {TAB_LABELS[nextTab]}
            </button>
          );
        })}
      </div>

      <div className="max-h-[48rem] overflow-y-auto px-5 py-5 sm:px-6">
        {!symbol ? (
          <div className="rounded-md border border-dashed border-[var(--tv-border)] bg-[var(--tv-surface)] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
            Add a ticker above to start comparing strategy ideas.
          </div>
        ) : loading ? (
          <div className="rounded-md border border-[var(--tv-border)] bg-[var(--tv-surface)] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading strategy ideas...
          </div>
        ) : error ? (
          <div className="rounded-md border border-[rgba(224,79,95,0.35)] bg-[rgba(224,79,95,0.12)] px-6 py-10 text-center text-sm text-[#f0b7bf]">
            {error}
          </div>
        ) : strategies.length === 0 ? (
          <div className="rounded-md border border-[var(--tv-border)] bg-[var(--tv-surface)] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
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
          <div className="mt-4 rounded-md border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-4 py-3 text-sm text-[#f1c27a]">
            Market data may be stale.
          </div>
        )}
      </div>
    </div>
  );
}
