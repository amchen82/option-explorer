import type { Bias } from "@/lib/types";

const STYLES: Record<Bias, string> = {
  bullish: "border-[rgba(25,179,155,0.4)] bg-[rgba(25,179,155,0.14)] text-[var(--text-positive)]",
  bearish: "border-[rgba(224,79,95,0.4)] bg-[rgba(224,79,95,0.14)] text-[var(--text-negative)]",
  neutral: "border-[var(--tv-border)] bg-[var(--tv-surface-2)] text-[var(--text-secondary)]",
};

const LABELS: Record<Bias, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

export default function BiasPill({ bias }: { bias: Bias }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] ${STYLES[bias]}`}
    >
      {LABELS[bias]}
    </span>
  );
}
