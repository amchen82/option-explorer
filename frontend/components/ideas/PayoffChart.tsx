"use client";

import { useId } from "react";
import type { Idea } from "@/lib/types";

const CONTRACT_MULTIPLIER = 100;
const WIDTH = 320;
const HEIGHT = 120;

/**
 * Profit or loss at expiration, computed from the legs themselves rather than
 * per-strategy special cases. Any combination of legs is handled the same way.
 */
export function payoffAt(idea: Idea, price: number, spot: number): number {
  let total = 0;

  for (const leg of idea.legs) {
    const direction = leg.action === "buy" ? 1 : -1;
    const intrinsic =
      leg.contract_type === "call" ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);

    total += direction * (intrinsic - leg.price) * leg.quantity * CONTRACT_MULTIPLIER;
  }

  // Strategies written against stock also carry the shares' own gain or loss.
  if (idea.requires_shares > 0) {
    total += (price - spot) * idea.requires_shares;
  }

  return total;
}

export default function PayoffChart({ idea, spot }: { idea: Idea; spot: number }) {
  const gradientId = useId();
  const low = spot * 0.75;
  const high = spot * 1.25;
  const steps = 60;

  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const price = low + ((high - low) * index) / steps;
    return { price, value: payoffAt(idea, price, spot) };
  });

  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const span = maxValue - minValue || 1;

  const x = (price: number) => ((price - low) / (high - low)) * WIDTH;
  const y = (value: number) => HEIGHT - ((value - minValue) / span) * HEIGHT;

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.price).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const zeroY = y(0);

  return (
    <figure className="mt-1">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Profit and loss at expiration for ${idea.name}, breakeven at $${idea.breakeven.toFixed(2)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text-positive)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--text-positive)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={`${line} L${WIDTH},${zeroY} L0,${zeroY} Z`} fill={`url(#${gradientId})`} />
        <line x1="0" y1={zeroY} x2={WIDTH} y2={zeroY} stroke="var(--tv-border)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={x(spot)} y1="0" x2={x(spot)} y2={HEIGHT} stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="2 4" />
        <path d={line} fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <figcaption className="metric mt-1 flex justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>${low.toFixed(0)}</span>
        <span>Breakeven ${idea.breakeven.toFixed(2)}</span>
        <span>${high.toFixed(0)}</span>
      </figcaption>
    </figure>
  );
}
