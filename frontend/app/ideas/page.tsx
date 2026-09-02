"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import IdeaCard from "@/components/ideas/IdeaCard";
import MarketViewHeader from "@/components/ideas/MarketViewHeader";
import TickerSearch from "@/components/ideas/TickerSearch";
import VolatilityCard from "@/components/ideas/VolatilityCard";
import { api } from "@/lib/api";
import type { Bias, ExpirationBucket, IdeasResponse } from "@/lib/types";

type Filter = "all" | Bias;

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

const EXPIRATION_LABELS: Record<ExpirationBucket, string> = {
  "0d": "0 days",
  "1w": "1 week",
  "2w": "2 weeks",
  "1m": "1 month",
  "3m": "3 months",
  "6m": "6 months",
  "12m": "12 months",
  gt12m: ">12 months",
};

const EXPIRATION_BUCKETS = Object.keys(EXPIRATION_LABELS) as ExpirationBucket[];

// A widely-recognized ticker everyone can make sense of, so the first thing a
// new visitor sees is real ideas rather than a blank loading spinner while
// they figure out what to search for.
const DEFAULT_TICKER = "SPY";

function isExpirationBucket(value: string | null): value is ExpirationBucket {
  return value !== null && (EXPIRATION_BUCKETS as string[]).includes(value);
}

function IdeasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<IdeasResponse | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [expirationBucket, setExpirationBucket] = useState<ExpirationBucket>("1m");

  // Keeps the URL a shareable, bookmarkable snapshot of what's on screen
  // (?symbol=AAPL&expiration=3m) without adding a history entry per search.
  const syncUrl = useCallback(
    (nextSymbol: string, bucket: ExpirationBucket) => {
      const params = new URLSearchParams({ symbol: nextSymbol, expiration: bucket });
      router.replace(`/ideas?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const search = useCallback(
    async (nextSymbol: string, bucket: ExpirationBucket) => {
      setLoading(true);
      setError(null);
      setSymbol(nextSymbol);

      try {
        const response: IdeasResponse = await api.ideas.get(nextSymbol, 0, bucket);
        setData(response);
        setFilter("all");
        syncUrl(nextSymbol, bucket);
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
    },
    [syncUrl],
  );

  useEffect(() => {
    const urlSymbol = searchParams.get("symbol")?.trim().toUpperCase();
    const urlExpirationRaw = searchParams.get("expiration");
    const initialExpiration = isExpirationBucket(urlExpirationRaw) ? urlExpirationRaw : "1m";
    const initialSymbol = urlSymbol || DEFAULT_TICKER;

    setExpirationBucket(initialExpiration);
    setSymbol(initialSymbol);
    void search(initialSymbol, initialExpiration);
    // Only run once, on mount, to load whatever the URL (or the default) says.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeExpiration = useCallback(
    (bucket: ExpirationBucket) => {
      setExpirationBucket(bucket);
      if (symbol) {
        void search(symbol, bucket);
      }
    },
    [search, symbol],
  );

  const ideas = data?.ideas.filter((idea) => filter === "all" || idea.bias === filter) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Option ideas</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)] lg:text-3xl">
            Options strategy finder and trade idea analyzer
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
            Enter any stock or ETF ticker to compare options strategies built from live market data and the current
            option chain. Every idea shows its max profit, max loss, breakeven, probability of profit, and Greeks —
            explained in plain English, not just numbers. No sign-in, no broker connection, not a recommendation to
            trade.
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <TickerSearch
            initialSymbol={symbol ?? ""}
            loading={loading}
            onSearch={(nextSymbol) => void search(nextSymbol, expirationBucket)}
          />
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
              onClick={() => search(symbol, expirationBucket)}
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
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  Expiration
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {EXPIRATION_BUCKETS.map((bucket) => (
                    <button
                      key={bucket}
                      type="button"
                      disabled={loading}
                      onClick={() => changeExpiration(bucket)}
                      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                        expirationBucket === bucket
                          ? "border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] text-white"
                          : "border-[var(--tv-border)] bg-[var(--tv-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {EXPIRATION_LABELS[bucket]}
                    </button>
                  ))}
                </div>
              </div>

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

export default function IdeasPage() {
  return (
    <Suspense
      fallback={
        <p className="rounded-xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
          Loading option ideas…
        </p>
      }
    >
      <IdeasPageInner />
    </Suspense>
  );
}
