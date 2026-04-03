"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Portfolio } from "@/lib/types";
import CSVImport from "@/components/CSVImport";

type AppSession = Session & {
  apiToken?: string;
};

export default function ImportPage() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getSession()
      .then((nextSession) => {
        if (active) {
          setSession((nextSession as AppSession | null) ?? null);
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
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load portfolios");
          setPortfolios([]);
          setSelectedPortfolioId(null);
        }
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

  if (hydrating) {
    return (
      <section className="mx-auto flex w-full max-w-4xl items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Loading import page...
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">CSV import</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Import portfolio positions</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Sign in first, then upload a broker CSV to create stock positions in one of your portfolios.
          </p>
          <button
            type="button"
            onClick={() => signIn(undefined, { callbackUrl: "/import" })}
            className="mt-5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">CSV import</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Import portfolio positions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Upload a broker CSV to create stock positions in the selected portfolio. The backend will detect the
          broker format, skip symbols that already exist, and return a summary of what was imported.
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex min-w-[16rem] flex-col gap-2 text-sm text-slate-300">
            <span>Select portfolio</span>
            <select
              value={selectedPortfolioId ?? ""}
              onChange={(event) => {
                const nextId = Number(event.target.value);
                setSelectedPortfolioId(Number.isNaN(nextId) ? null : nextId);
              }}
              className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400/50"
            >
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </label>

          <p className="text-sm text-slate-400">
            {loadingPortfolios ? "Loading portfolios..." : `${portfolios.length} portfolio(s) available`}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {selectedPortfolioId === null ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-400">
            Create a portfolio before importing positions.
          </div>
        ) : (
          <div className="mt-4">
            <CSVImport portfolioId={selectedPortfolioId} onImported={() => undefined} />
          </div>
        )}
      </div>
    </section>
  );
}
