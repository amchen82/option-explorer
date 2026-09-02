"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { QuotePreview } from "@/lib/types";

interface Props {
  initialSymbol?: string;
  loading?: boolean;
  onSearch: (symbol: string) => void;
}

const PREVIEW_DEBOUNCE_MS = 300;
// Real US equity/ETF tickers: 1-5 letters, optionally with a share-class
// suffix like BRK.B. Short-circuits a network call for anything that can't
// possibly be a valid symbol yet (a lone letter, a half-typed word).
const TICKER_PATTERN = /^[A-Z]{1,5}(\.[A-Z])?$/;

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TickerSearch({ initialSymbol = "", loading = false, onSearch }: Props) {
  const [value, setValue] = useState(initialSymbol);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setValue(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    abortRef.current?.abort();
    setPreview(null);

    const symbol = value.trim().toUpperCase();
    if (!TICKER_PATTERN.test(symbol)) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(() => {
      api.ideas
        .quotePreview(symbol, controller.signal)
        .then((quote: QuotePreview) => {
          if (!controller.signal.aborted) {
            setPreview(quote);
          }
        })
        .catch(() => {
          // Not a real ticker, or the lookup failed -- no preview, not an error state.
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const symbol = value.trim().toUpperCase();

    if (symbol) {
      onSearch(symbol);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          placeholder="Enter a ticker"
          aria-label="Ticker symbol"
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={10}
          className="metric min-w-0 flex-1 rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface)] px-4 py-3 text-lg tracking-wide text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--text-accent)]"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[rgba(76,141,255,0.28)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Loading" : "Find ideas"}
        </button>
      </div>

      {preview && (
        <p className="metric px-1 text-xs text-[var(--text-secondary)]">
          {preview.symbol} · {money(preview.price)}
          {preview.stale && <span className="text-[var(--text-tertiary)]"> (delayed)</span>}
        </p>
      )}
    </form>
  );
}
