"use client";

import { useEffect, useState } from "react";
import type { Alert, StrategiesResponse, StrategyResult } from "@/lib/types";
import { api } from "@/lib/api";
import StrategyCard from "./StrategyCard";

interface Props {
  portfolioId: number;
  symbol: string;
  currentPrice: number;
  token: string;
  onClose: () => void;
}

type Tab = "income" | "hedge" | "all";

const TAB_LABELS: Record<Tab, string> = {
  income: "Income",
  hedge: "Hedge",
  all: "All",
};

export default function StrategyExplorer({ portfolioId, symbol, currentPrice, token, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("income");
  const [data, setData] = useState<StrategiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.strategies
      .get(portfolioId, symbol, token)
      .then((response: StrategiesResponse) => {
        if (active) {
          setData(response);
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setData(null);
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load strategies");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [portfolioId, symbol, token]);

  const strategies: StrategyResult[] = data ? data[tab] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-cyan-950/30">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Strategy explorer</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">
              {symbol}
              <span className="ml-3 text-sm font-normal text-slate-400">Reference {currentPrice.toFixed(2)}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            aria-label="Close strategy explorer"
          >
            Close
          </button>
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

        <div className="max-h-[calc(92vh-14rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
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
                <StrategyCard key={`${strategy.strategy}-${strategy.expiration}-${strategy.strike ?? "na"}`} strategy={strategy} currentPrice={currentPrice} />
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
    </div>
  );
}
