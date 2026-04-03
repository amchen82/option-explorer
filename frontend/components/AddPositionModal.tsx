"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  portfolioId: number | null;
  token: string;
  onClose: () => void;
  onCreated: () => void;
}

type FormState = {
  symbol: string;
  shares: string;
  cost_basis: string;
  purchase_date: string;
  notes: string;
};

const initialForm: FormState = {
  symbol: "",
  shares: "",
  cost_basis: "",
  purchase_date: "",
  notes: "",
};

export default function AddPositionModal({ open, portfolioId, token, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (portfolioId === null) {
      setError("Select a portfolio before adding a position.");
      return;
    }

    if (!token) {
      setError("Backend auth token is missing.");
      return;
    }

    const shares = Number(form.shares);
    const costBasis = Number(form.cost_basis);

    if (!form.symbol.trim() || Number.isNaN(shares) || Number.isNaN(costBasis)) {
      setError("Enter a symbol, share count, and cost basis.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.positions.addStock(
        portfolioId,
        {
          symbol: form.symbol.trim().toUpperCase(),
          shares,
          cost_basis: costBasis,
          purchase_date: form.purchase_date || undefined,
          notes: form.notes.trim() || undefined,
        },
        token,
      );
      onCreated();
      onClose();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add position");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-cyan-950/30">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Add position</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">Track a long equity position</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Symbol</span>
              <input
                value={form.symbol}
                onChange={(event) => setForm({ ...form, symbol: event.target.value })}
                placeholder="AAPL"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Shares</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.shares}
                onChange={(event) => setForm({ ...form, shares: event.target.value })}
                placeholder="100"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Cost basis</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost_basis}
                onChange={(event) => setForm({ ...form, cost_basis: event.target.value })}
                placeholder="150.00"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Purchase date</span>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(event) => setForm({ ...form, purchase_date: event.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Optional context about the position"
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Add position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
