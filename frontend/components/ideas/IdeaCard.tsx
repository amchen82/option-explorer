"use client";

import { useState } from "react";
import type { Conviction, Idea } from "@/lib/types";
import Tooltip from "../Tooltip";
import BiasPill from "./BiasPill";
import GreeksTable from "./GreeksTable";
import PayoffChart from "./PayoffChart";

const CHANCE_OF_PROFIT_EXPLANATION =
  "Estimated from the option's delta — roughly the odds it expires in the money. " +
  "Short options: 1 minus |delta|. Long options: |delta|.";

const CAPITAL_EXPLANATION =
  "What this trade ties up: premium paid for a debit trade, cash reserved for a cash-secured put, " +
  "or the value of shares you already hold for a covered call or collar.";

const CONVICTION_EXPLANATION =
  "A weighted score, not a guarantee: does the trend agree with this idea's direction (40%), " +
  "is IV rank favorable for buying or selling here (30%), are the contracts liquid enough to " +
  "trade at a fair price (20%), and does an earnings report fall inside the trade's life (10%, a penalty if so).";

const CONVICTION_STYLE: Record<Conviction, string> = {
  high: "text-[var(--text-positive)]",
  medium: "text-[var(--text-accent)]",
  low: "text-[var(--text-tertiary)]",
};

function money(value: number): string {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Stat({
  label,
  value,
  tone,
  tooltip,
}: {
  label: string;
  value: string;
  tone?: string;
  tooltip?: string;
}) {
  return (
    <div>
      <dt className="flex min-h-[28px] items-end text-[10px] uppercase leading-[14px] tracking-[0.12em] text-[var(--text-tertiary)]">
        {tooltip ? <Tooltip text={tooltip}>{label}</Tooltip> : label}
      </dt>
      <dd className={`metric text-sm ${tone ?? "text-[var(--text-primary)]"}`}>{value}</dd>
    </div>
  );
}

export default function IdeaCard({ idea, spot }: { idea: Idea; spot: number }) {
  const [open, setOpen] = useState(false);
  const needsStock = idea.requires_shares > 0 && !idea.shares_satisfied;

  return (
    <article className="tv-panel overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="w-full px-4 py-3.5 text-left transition hover:bg-[var(--tv-surface-2)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{idea.name}</h3>
          <BiasPill bias={idea.bias} />
          {idea.data_quality === "modeled" && (
            <Tooltip text="Live option quotes weren't available for this leg, so its strike and premium are a calculated estimate rather than a real market price.">
              <span className="rounded-md border border-[rgba(211,139,44,0.4)] bg-[rgba(211,139,44,0.12)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#f1c27a]">
                Modeled
              </span>
            </Tooltip>
          )}
        </div>

        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{idea.summary}</p>

        {needsStock && (
          <p className="mt-2 inline-block rounded border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-2 py-0.5 text-[11px] text-[#f1c27a]">
            Requires owning {idea.requires_shares} shares
          </p>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
          <Stat
            label="Max profit"
            value={idea.max_profit === null ? "Unlimited" : money(idea.max_profit)}
            tone="text-[var(--text-positive)]"
            tooltip={idea.max_profit_when}
          />
          <Stat
            label="Max loss"
            value={money(idea.max_loss)}
            tone="text-[var(--text-negative)]"
            tooltip={idea.max_loss_when}
          />
          <Stat
            label="Chance of profit"
            value={`${(idea.prob_profit * 100).toFixed(0)}%`}
            tooltip={CHANCE_OF_PROFIT_EXPLANATION}
          />
          <Stat label="Capital" value={money(idea.capital_required)} tooltip={CAPITAL_EXPLANATION} />
        </dl>

        <p className="mt-2.5 text-[11px] uppercase tracking-[0.12em] text-[var(--text-accent)]">
          {open ? "Hide detail" : "Why this trade →"}
        </p>
      </button>

      {open && (
        <div className="space-y-5 border-t border-[var(--tv-border)] px-4 py-4">
          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Why this trade</h4>
            <ul className="mt-2 space-y-2">
              {idea.why.map((reason) => (
                <li key={reason} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <span aria-hidden="true" className="mt-2 h-px w-2 shrink-0 bg-[var(--text-accent)]" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">The trade</h4>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              1 contract = 100 shares of the underlying stock.
            </p>
            <ul className="mt-2 space-y-1.5">
              {idea.legs.map((leg) => (
                <li
                  key={`${leg.action}-${leg.contract_type}-${leg.strike}`}
                  className="metric flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface)] px-3 py-2 text-sm"
                >
                  <span className="text-[var(--text-primary)]">
                    <span className={leg.action === "buy" ? "text-[var(--text-positive)]" : "text-[var(--text-negative)]"}>
                      {leg.action === "buy" ? "Buy" : "Sell"}
                    </span>{" "}
                    {leg.quantity}x ${leg.strike} {leg.contract_type}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    ${leg.price.toFixed(2)}
                    <span className="ml-2 text-[var(--text-tertiary)]">
                      Δ{leg.delta.toFixed(2)} · OI {leg.open_interest.toLocaleString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="metric mt-2 text-sm text-[var(--text-secondary)]">
              {idea.is_credit ? "You collect" : "You pay"} {money(Math.abs(idea.net_debit_credit))} up front · breakeven $
              {idea.breakeven.toFixed(2)} · {idea.dte} days to expiry
            </p>
          </section>

          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Profit at expiration</h4>
            <PayoffChart idea={idea} spot={spot} />
          </section>

          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">What the Greeks mean</h4>
            <div className="mt-2">
              <GreeksTable rows={idea.greeks_explained} />
            </div>
          </section>

          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-warning)]">What could go wrong</h4>
            <ul className="mt-2 space-y-2">
              {idea.risks.map((risk) => (
                <li key={risk} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <span aria-hidden="true" className="mt-2 h-px w-2 shrink-0 bg-[var(--text-warning)]" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">
              <Tooltip text={CONVICTION_EXPLANATION}>Conviction score</Tooltip>
            </h4>
            <p className={`metric mt-1 text-lg font-semibold ${CONVICTION_STYLE[idea.conviction]}`}>
              {(idea.conviction_score * 100).toFixed(0)}%
            </p>
          </section>
        </div>
      )}
    </article>
  );
}
