import type { GreekExplanation } from "@/lib/types";

export default function GreeksTable({ rows }: { rows: GreekExplanation[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.greek} className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface)] px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">{row.label}</span>
            <span className="metric text-sm text-[var(--text-secondary)]">
              {row.value.toFixed(3)}
              {row.dollars !== null && (
                <span className="ml-2 text-[var(--text-tertiary)]">
                  {row.dollars >= 0 ? "+" : "-"}${Math.abs(row.dollars).toFixed(0)}
                </span>
              )}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{row.plain}</p>
        </div>
      ))}
    </div>
  );
}
