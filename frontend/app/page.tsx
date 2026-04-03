"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { api } from "@/lib/api";
import type { Portfolio, StockPosition } from "@/lib/types";
import AddPositionModal from "@/components/AddPositionModal";
import PositionCard from "@/components/PositionCard";
import StrategyExplorer from "@/components/StrategyExplorer";

type AppSession = Session & {
  apiToken?: string;
};

type ExplorerState = {
  symbol: string;
  referencePrice: number;
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
  const [explorer, setExplorer] = useState<ExplorerState | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [positionsVersion, setPositionsVersion] = useState(0);
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
          setError(
            "Signed in, but the backend token exchange is unavailable. Portfolio data will not load.",
          );
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
    const token = session?.apiToken;

    if (!token) {
      setPortfolios([]);
      setSelectedPortfolioId(null);
      setPositions([]);
      setExplorer(null);
      if (session) {
        setError("Signed in, but no backend token is available yet. Check the auth bridge and backend contract.");
      }
      return;
    }

    let active = true;
    setLoadingPortfolios(true);
    setError(null);

    api.portfolios
      .list(token)
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
  }, [session?.apiToken]);

  useEffect(() => {
    const token = session?.apiToken;

    if (!token || selectedPortfolioId === null) {
      setPositions([]);
      setExplorer(null);
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
  }, [positionsVersion, selectedPortfolioId, session?.apiToken]);

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

  if (!session) {
    return (
      <section className="flex w-full items-center justify-center">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-300">Options Strategy Tool</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Portfolio options strategies for income and hedging.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Sign in with Google or GitHub to connect the frontend shell to the backend API and start
            managing portfolios.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-200">
              FastAPI backend
            </span>
            <span className="rounded-full border border-slate-500/30 bg-slate-800/60 px-4 py-2 text-slate-200">
              Next.js 14 frontend
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-200">
              OAuth ready
            </span>
          </div>
          <button
            onClick={() => signIn(undefined, { callbackUrl: "/" })}
            className="mt-8 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {selectedPortfolio?.name || "My Portfolio"}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Connected as <span className="text-slate-100">{session.user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[14rem] flex-col gap-2 text-sm text-slate-300">
              <span>Portfolio</span>
              <select
                value={selectedPortfolioId ?? ""}
                onChange={(event) => {
                  const nextId = Number(event.target.value);
                  setSelectedPortfolioId(Number.isNaN(nextId) ? null : nextId);
                  setExplorer(null);
                }}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-cyan-400/50"
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

      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Positions</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{positions.length}</p>
          <p className="mt-2 text-sm text-slate-400">Equity holdings in the selected portfolio.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Average basis</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{positions.length ? money(averageCostBasis) : "-"}</p>
          <p className="mt-2 text-sm text-slate-400">Simple average across tracked stock positions.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notional</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{money(totalNotional)}</p>
          <p className="mt-2 text-sm text-slate-400">Calculated from shares and cost basis only.</p>
        </div>
      </div>

      {loadingPortfolios ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading portfolios...
        </div>
      ) : portfolios.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-300">
          <p className="text-lg font-medium text-slate-100">No portfolios yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Create a portfolio in the API first, then return here to view positions and strategy recommendations.
          </p>
        </div>
      ) : loadingPositions ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading positions...
        </div>
      ) : positions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-300">
          <p className="text-lg font-medium text-slate-100">No stock positions yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Add a position to start exploring covered calls, puts, collars, and spreads.
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
              onClick={() =>
                setExplorer({
                  symbol: position.symbol,
                  referencePrice: position.cost_basis,
                })
              }
            />
          ))}
        </div>
      )}

      {explorer && selectedPortfolioId !== null && (
        <StrategyExplorer
          portfolioId={selectedPortfolioId}
          symbol={explorer.symbol}
          currentPrice={explorer.referencePrice}
          token={token}
          onClose={() => setExplorer(null)}
        />
      )}

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
