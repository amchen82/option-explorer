"use client";

import { FormEvent, useEffect, useState } from "react";

interface Props {
  initialSymbol?: string;
  loading?: boolean;
  onSearch: (symbol: string) => void;
}

export default function TickerSearch({ initialSymbol = "", loading = false, onSearch }: Props) {
  const [value, setValue] = useState(initialSymbol);

  useEffect(() => {
    setValue(initialSymbol);
  }, [initialSymbol]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const symbol = value.trim().toUpperCase();

    if (symbol) {
      onSearch(symbol);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
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
    </form>
  );
}
