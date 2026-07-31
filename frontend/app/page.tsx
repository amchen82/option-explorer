"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import AddPositionModal from "@/components/AddPositionModal";
import PositionCard from "@/components/PositionCard";
import StrategyExplorer from "@/components/StrategyExplorer";
import { api } from "@/lib/api";
import { authEnabled } from "@/lib/auth";
import type { Portfolio, StockPosition } from "@/lib/types";

type AppSession = Session & {
  apiToken?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HomePage() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [positionsVersion, setPositionsVersion] = useState(0);
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [trackedTickers, setTrackedTickers] = useState<string[]>(["AAPL"]);
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const token = session?.apiToken ?? "";
  const canUseApi = Boolean(token);

  useEffect(() => {
    if (!authEnabled) {
      setSession(null);
      setHydrating(false);
      return;
    }

    let active = true;

    getSession()
      .then((nextSession) => {
        if (!active) {
          return;
        }

        const hydratedSession = (nextSession as AppSession | null) ?? null;
        setSession(hydratedSession);

        if (hydratedSession && !hydratedSession.apiToken) {
          setError("Signed in, but the backend token exchange is unavailable. Portfolio data will not load.");
        }
      })
      .finally(() => {
        if (active) {
          setHydrating(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authEnabled) {
      return;
    }

    const nextToken = session?.apiToken;

    if (!nextToken) {
      setPortfolios([]);
      setSelectedPortfolioId(null);
      setPositions([]);
      if (session) {
        setError("Signed in, but no backend token is available yet. Check the auth bridge and backend contract.");
      }
      return;
    }

    let active = true;
    setLoadingPortfolios(true);
    setError(null);

    api.portfolios
      .list(nextToken)
      .then((data: Portfolio[]) => {
        if (!active) {
          return;
        }

        setPortfolios(data);
        setSelectedPortfolioId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((fetchError: unknown) => {
        if (!active) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load portfolios");
        setPortfolios([]);
        setSelectedPortfolioId(null);
      })
      .finally(() => {
        if (active) {
          setLoadingPortfolios(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.apiToken, session]);

  useEffect(() => {
    if (!authEnabled) {
      return;
    }

    if (!token || selectedPortfolioId === null) {
      setPositions([]);
      return;
    }

    let active = true;
    setLoadingPositions(true);
    setError(null);

    api.positions
      .listStock(selectedPortfolioId, token)
      .then((data: StockPosition[]) => {
        if (active) {
          setPositions(data);
        }
      })
      .catch((fetchError: unknown) => {
        if (!active) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load positions");
        setPositions([]);
      })
      .finally(() => {
        if (active) {
          setLoadingPositions(false);
        }
      });

    return () => {
      active = false;
    };
  }, [positionsVersion, selectedPortfolioId, token]);

  function addTicker(rawSymbol: string) {
    const symbol = rawSymbol.trim().toUpperCase();

    if (!symbol) {
      setError("Enter a ticker symbol to explore strategies.");
      return;
    }

    setTrackedTickers((current) => (current.includes(symbol) ? current : [...current, symbol]));
    setSelectedTicker(symbol);
    setSymbolInput(symbol);
    setError(null);
  }

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTicker(symbolInput);
  }

  function removeTicker(symbol: string) {
    setTrackedTickers((current) => {
      const next = current.filter((item) => item !== symbol);
      const fallback = next[0] ?? null;

      setSelectedTicker((currentTicker) => (currentTicker === symbol ? fallback ?? "" : currentTicker));
      return next;
    });
  }

  const selectedPortfolio = portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null;
  const totalNotional = positions.reduce((sum, position) => sum + position.cost_basis * position.shares, 0);
  const averageCostBasis =
    positions.length > 0
      ? positions.reduce((sum, position) => sum + position.cost_basis, 0) / positions.length
      : 0;

  if (hydrating) {
    return (
      <section className="flex w-full items-center justify-center py-20">
        <div className="tv-panel flex items-center gap-3 rounded px-6 py-4 text-sm text-[var(--text-secondary)]">
          <span className="spinner" />
          Loading session…
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-3">
      <div className="tv-panel rounded p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-accent)]">Strategy Terminal</p>
            <h1 className="gradient-heading mt-1.5 text-[1.6rem] font-semibold tracking-tight sm:text-[1.85rem]">Strategy Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              {authEnabled && session ? (
                <>
                  Connected as <span className="text-[var(--text-primary)]">{session.user?.email}</span>. Track tickers below, then save portfolios and imports when you need persistence.
                </>
              ) : (
                authEnabled
                  ? "Analyze multiple tickers without signing in. Sign in only when you want to save positions, imports, and history."
                  : "Analyze multiple tickers without signing in. Public mode is active until OAuth is configured."
              )}
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="grid gap-3 sm:min-w-[28rem] sm:grid-cols-[1fr_auto]">
            <label className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Add ticker</span>
              <input
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
                placeholder="AAPL"
                className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--text-accent)]"
              />
            </label>
            <button
              type="submit"
              className="self-end rounded bg-[var(--text-accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Explore strategies
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {authEnabled && session && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="tv-panel rounded p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Positions</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{positions.length}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Equity holdings in the selected portfolio.</p>
            </div>
            <div className="tv-panel rounded p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Average basis</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{positions.length ? money(averageCostBasis) : "-"}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Simple average across tracked stock positions.</p>
            </div>
            <div className="tv-panel rounded p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Notional</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{money(totalNotional)}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Calculated from shares and cost basis only.</p>
            </div>
          </div>

          <div className="tv-panel rounded p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-accent)]">Saved Portfolio Tools</p>
                <h2 className="mt-2 text-[1.5rem] font-semibold text-[var(--text-primary)]">
                  {selectedPortfolio?.name || "My Portfolio"}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex min-w-[14rem] flex-col gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Portfolio</span>
                  <select
                    value={selectedPortfolioId ?? ""}
                    onChange={(event) => {
                      const nextId = Number(event.target.value);
                      setSelectedPortfolioId(Number.isNaN(nextId) ? null : nextId);
                    }}
                    className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--text-accent)]"
                  >
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(true)}
                    disabled={selectedPortfolioId === null || !canUseApi}
                    className="rounded bg-[var(--text-accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add position
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadingPortfolios ? (
            <div className="tv-panel flex items-center gap-3 rounded p-6 text-sm text-[var(--text-secondary)]">
              <span className="spinner" />
              Loading portfolios…
            </div>
          ) : portfolios.length === 0 ? (
            <div className="tv-panel rounded p-8 text-[var(--text-secondary)]">
              <p className="text-lg font-medium text-[var(--text-primary)]">No portfolios yet</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Create a portfolio in the API first, then return here to save positions and reuse them.
              </p>
            </div>
          ) : loadingPositions ? (
            <div className="tv-panel flex items-center gap-3 rounded p-6 text-sm text-[var(--text-secondary)]">
              <span className="spinner" />
              Loading positions…
            </div>
          ) : positions.length === 0 ? (
            <div className="tv-panel rounded p-8 text-[var(--text-secondary)]">
              <p className="text-lg font-medium text-[var(--text-primary)]">No stock positions yet</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Add a position to save names and cost basis alongside the strategy workspace.
              </p>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                disabled={!canUseApi}
                className="mt-5 rounded bg-[var(--text-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add your first position
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {positions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClick={() => addTicker(position.symbol)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="tv-panel rounded p-3">
          <div className="border-b border-[var(--tv-border)] px-2 pb-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Watchlist</p>
          </div>
          <div className="mt-4 space-y-2">
            {trackedTickers.length === 0 ? (
              <div className="rounded border border-dashed border-[var(--tv-border)] px-4 py-5 text-sm text-[var(--text-tertiary)]">
                No tickers added yet.
              </div>
            ) : (
              trackedTickers.map((symbol) => {
                const isActive = symbol === selectedTicker;

                return (
                  <div
                    key={symbol}
                    className={`flex items-center justify-between rounded border px-3 py-3 transition ${
                      isActive
                        ? "border-[var(--text-accent)] bg-[rgba(0,180,216,0.15)]"
                        : "border-[var(--tv-border)] bg-[var(--tv-surface)] hover:bg-[var(--tv-surface-2)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTicker(symbol)}
                      className="flex-1 text-left text-sm font-medium tracking-[0.06em] text-[var(--text-primary)]"
                    >
                      {symbol}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTicker(symbol)}
                      className="ml-2 flex h-6 w-6 items-center justify-center rounded border border-[var(--tv-border)] text-[var(--text-tertiary)] transition hover:border-[var(--text-negative)] hover:text-[var(--text-negative)]"
                      aria-label={`Remove ${symbol}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <StrategyExplorer symbol={selectedTicker || null} />
      </div>

      <AddPositionModal
        open={addModalOpen}
        portfolioId={selectedPortfolioId}
        token={token}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => setPositionsVersion((value) => value + 1)}
      />
    </section>
  );
}
