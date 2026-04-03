"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";

type AppSession = Session & {
  apiToken?: string;
};

interface Props {
  portfolioId: number;
  onImported: () => void;
}

type ImportResult = {
  imported: number;
  skipped_duplicates: number;
  duplicate_symbols: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CSVImport({ portfolioId, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
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

  const token = session?.apiToken ?? "";

  async function handleFile(file: File) {
    if (!token) {
      setError("Sign in before importing a CSV.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/portfolios/${portfolioId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const payload: { detail?: string } = await response.json().catch(() => ({}));
        throw new Error(payload.detail || `Import failed with status ${response.status}`);
      }

      const data: ImportResult = await response.json();
      setResult(data);
      setStatus("done");
      onImported();
    } catch (uploadError: unknown) {
      setStatus("error");
      setError(uploadError instanceof Error ? uploadError.message : "Failed to import CSV");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (hydrating) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-sm text-slate-300">
        Loading import tools...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8">
        <p className="text-lg font-medium text-slate-50">Sign in to import a CSV</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          The import endpoint uses your backend token, so you need an authenticated session before uploading.
        </p>
        <button
          type="button"
          onClick={() => signIn(undefined, { callbackUrl: "/import" })}
          className="mt-5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />

      {status === "idle" && (
        <div className="text-center">
          <p className="text-lg font-medium text-slate-50">Upload a broker CSV</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Supported formats include Schwab, Fidelity, TD Ameritrade, and Robinhood exports.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
          >
            Choose CSV file
          </button>
        </div>
      )}

      {status === "uploading" && (
        <div className="py-4 text-center text-sm text-slate-300">Importing positions...</div>
      )}

      {status === "done" && result && (
        <div className="space-y-3 text-center">
          <p className="text-lg font-medium text-emerald-300">
            Imported {result.imported} position{result.imported === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-slate-400">
            Skipped {result.skipped_duplicates} duplicate
            {result.skipped_duplicates === 1 ? "" : "s"}
          </p>
          {result.duplicate_symbols.length > 0 && (
            <p className="text-xs text-slate-500">
              Duplicates: {result.duplicate_symbols.join(", ")}
            </p>
          )}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Import another file
          </button>
        </div>
      )}

      {status === "error" && error && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-rose-200">{error}</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
