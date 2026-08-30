"use client";

import { useCallback, useEffect, useState } from "react";
import IdeaCard from "@/components/ideas/IdeaCard";
import MarketViewHeader from "@/components/ideas/MarketViewHeader";
import TickerSearch from "@/components/ideas/TickerSearch";
import VolatilityCard from "@/components/ideas/VolatilityCard";
import { api } from "@/lib/api";
import type { Bias, IdeasResponse } from "@/lib/types";

type Filter = "all" | Bias;

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

const DEFAULT_TICKERS = ["AAPL", "NVDA", "GOOG", "TSLA", "META", "SPY", "AMD"];

function randomTicker() {
  return DEFAULT_TICKERS[Math.floor(Math.random() * DEFAULT_TICKERS.length)];
}

export default function IdeasPage() {
  const [data, setData] = useState<IdeasResponse | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const search = useCallback(async (nextSymbol: string) => {
    setLoading(true);
    setError(null);
    setSymbol(nextSymbol);

    try {
      const response: IdeasResponse = await api.ideas.get(nextSymbol);
      setData(response);
      setFilter("all");
    } catch (fetchError: unknown) {
      setData(null);
      const message = fetchError instanceof Error ? fetchError.message : "Something went wrong";
      setError(
        message.includes("400") || message.includes("404")
          ? `We couldn't find "${nextSymbol}". Check the ticker and try again.`
          : "Couldn't reach the market data service. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void search(randomTicker());
  }, [search]);

  const ideas = data?.ideas.filter((idea) => filter === "all" || idea.bias === filter) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Options ideas</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)] lg:text-3xl">
            Option ideas for a randomly selected ticker
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Every idea explains its own reasoning, in plain English.
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <TickerSearch initialSymbol={symbol ?? ""} loading={loading} onSearch={search} />
        </div>
      </header>

      {loading && (
        <p className="rounded-xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
          Reading the option chain for {symbol}…
        </p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-[rgba(224,79,95,0.35)] bg-[rgba(224,79,95,0.12)] px-4 py-5 text-sm text-[#f0b7bf]">
          <p>{error}</p>
          {symbol && (
            <button
              type="button"
              onClick={() => search(symbol)}
              className="mt-3 rounded-md border border-[rgba(224,79,95,0.4)] px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition hover:bg-[rgba(224,79,95,0.16)]"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-xl border border-dashed border-[var(--tv-border)] bg-[var(--tv-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
          Loading option ideas…
        </div>
      )}

      {data && !loading && (
        <>
          {data.data_quality === "modeled" && (
            <div className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-4 py-3 text-sm text-[#f1c27a]">
              Live option quotes weren&apos;t available, so these strikes and premiums are calculated estimates rather
              than real market prices. Check against your broker before acting on anything here.
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              <MarketViewHeader data={data} />
              <VolatilityCard volatility={data.volatility} />
            </aside>

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {(Object.keys(FILTER_LABELS) as Filter[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFilter(option)}
                      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs transition ${
                        filter === option
                          ? "border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] text-white"
                          : "border-[var(--tv-border)] bg-[var(--tv-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {FILTER_LABELS[option]}
                    </button>
                  ))}
                </div>
                <span className="metric shrink-0 text-[11px] text-[var(--text-tertiary)]">
                  Exp {data.expiration} · {data.dte}d
                </span>
              </div>

              {ideas.length === 0 ? (
                <p className="rounded-xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                  No {filter} ideas for this ticker right now.
                </p>
              ) : (
                <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
                  {ideas.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} spot={data.quote.price} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mt-2 text-center text-xs leading-relaxed text-[var(--text-tertiary)]">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}
