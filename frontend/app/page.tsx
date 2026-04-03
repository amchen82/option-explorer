"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
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
      if (session) {
        setError(
          "Signed in, but no backend token is available yet. Check the auth bridge and backend contract.",
        );
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
  }, [selectedPortfolioId, session?.apiToken]);

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
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-300">
            Options Strategy Tool
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Portfolio options strategies for income and hedging.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Sign in with Google or GitHub to connect the frontend shell to the backend API and
            start managing portfolios.
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

  const selectedPortfolio = portfolios.find((portfolio) => portfolio.id === selectedPortfolioId);

  return (
    <section className="w-full">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {selectedPortfolio?.name || "My Portfolio"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Connected as <span className="text-slate-100">{session.user?.email}</span>
          </p>
        </div>

        <label className="flex min-w-[14rem] flex-col gap-2 text-sm text-slate-300">
          <span>Portfolio</span>
          <select
            value={selectedPortfolioId ?? ""}
            onChange={(event) => {
              const nextId = Number(event.target.value);
              setSelectedPortfolioId(Number.isNaN(nextId) ? null : nextId);
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
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loadingPortfolios ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading portfolios...
        </div>
      ) : portfolios.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-300">
          <p className="text-lg font-medium text-slate-100">No portfolios yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Create a portfolio in the API first, then return here to view positions and strategy
            recommendations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loadingPositions ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-300 md:col-span-2 xl:col-span-3">
              <p className="text-lg font-medium text-slate-100">No stock positions yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add a position through the API to begin generating options strategy ideas.
              </p>
            </div>
          ) : (
            positions.map((position) => (
              <article
                key={position.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-cyan-950/10 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                      {position.symbol}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-100">
                      {position.shares} shares
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Long equity
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
                    <dt className="text-slate-400">Cost basis</dt>
                    <dd className="mt-1 font-medium text-slate-100">
                      {money(position.cost_basis)}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 px-3 py-3">
                    <dt className="text-slate-400">Notional</dt>
                    <dd className="mt-1 font-medium text-slate-100">
                      {money(position.cost_basis * position.shares)}
                    </dd>
                  </div>
                </dl>
                {position.notes && (
                  <p className="mt-4 text-sm leading-6 text-slate-400">{position.notes}</p>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
