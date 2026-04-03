"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import AddPositionModal from "@/components/AddPositionModal";
import PositionCard from "@/components/PositionCard";
import StrategyExplorer from "@/components/StrategyExplorer";
import { api } from "@/lib/api";
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
      <section className="flex w-full items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-xl shadow-cyan-950/20 backdrop-blur">
          Loading session...
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-accent)]">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">Strategy Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              {session ? (
                <>
                  Connected as <span className="text-[var(--text-primary)]">{session.user?.email}</span>. Track tickers below, then save portfolios and imports when you need persistence.
                </>
              ) : (
                "Analyze multiple tickers without signing in. Sign in only when you want to save positions, imports, and history."
              )}
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="grid gap-3 sm:min-w-[28rem] sm:grid-cols-[1fr_auto]">
            <label className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <span>Add ticker</span>
              <input
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
                placeholder="AAPL"
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50"
              />
            </label>
            <button
              type="submit"
              className="self-end rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Explore strategies
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-cyan-950/10">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-accent)]">Workspace</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">Track multiple symbols in one view</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            Add symbols to the list, switch between them from the left rail, and compare income and hedge ideas in the same workspace.
          </p>
        </div>

        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 shadow-lg shadow-cyan-950/10">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Account Features</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
            {session ? "Persistence unlocked" : "Sign in to save"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {session
              ? "Use the same analysis workspace, then save portfolios, positions, and imported activity to come back later."
              : "The analysis workspace is available now. Signing in unlocks saved portfolios, CSV imports, and account history."}
          </p>
          {!session && (
            <button
              type="button"
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Sign in to save your workspace
            </button>
          )}
        </div>
      </div>

      {session && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Positions</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{positions.length}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Equity holdings in the selected portfolio.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Average basis</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{positions.length ? money(averageCostBasis) : "-"}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Simple average across tracked stock positions.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Notional</p>
              <p className="metric mt-3 text-3xl font-semibold text-[var(--text-primary)]">{money(totalNotional)}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Calculated from shares and cost basis only.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-cyan-950/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-accent)]">Saved Portfolio Tools</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {selectedPortfolio?.name || "My Portfolio"}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex min-w-[14rem] flex-col gap-2 text-sm text-[var(--text-secondary)]">
                  <span>Portfolio</span>
                  <select
                    value={selectedPortfolioId ?? ""}
                    onChange={(event) => {
                      const nextId = Number(event.target.value);
                      setSelectedPortfolioId(Number.isNaN(nextId) ? null : nextId);
                    }}
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-cyan-400/50"
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
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add position
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadingPortfolios ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-[var(--text-secondary)]">
              Loading portfolios...
            </div>
          ) : portfolios.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-[var(--text-secondary)]">
              <p className="text-lg font-medium text-[var(--text-primary)]">No portfolios yet</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Create a portfolio in the API first, then return here to save positions and reuse them.
              </p>
            </div>
          ) : loadingPositions ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-[var(--text-secondary)]">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-[var(--text-secondary)]">
              <p className="text-lg font-medium text-[var(--text-primary)]">No stock positions yet</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                Add a position to save names and cost basis alongside the strategy workspace.
              </p>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                disabled={!canUseApi}
                className="mt-5 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-lg shadow-cyan-950/10">
          <p className="px-2 text-xs uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Tickers</p>
          <div className="mt-4 space-y-2">
            {trackedTickers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-[var(--text-tertiary)]">
                No tickers added yet.
              </div>
            ) : (
              trackedTickers.map((symbol) => {
                const isActive = symbol === selectedTicker;

                return (
                  <div
                    key={symbol}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 transition ${
                      isActive
                        ? "border-cyan-400/40 bg-cyan-400/10"
                        : "border-white/10 bg-slate-950/40 hover:bg-white/5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTicker(symbol)}
                      className="flex-1 text-left text-sm font-medium text-[var(--text-primary)]"
                    >
                      {symbol}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTicker(symbol)}
                      className="ml-3 rounded-full border border-white/10 px-2 py-1 text-xs text-[var(--text-tertiary)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
                      aria-label={`Remove ${symbol}`}
                    >
                      Remove
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
