import type { VolatilityView } from "@/lib/types";

const REGIME_COLOR: Record<VolatilityView["regime"], string> = {
  high: "var(--text-warning)",
  elevated: "var(--text-warning)",
  normal: "var(--text-accent)",
  low: "var(--text-positive)",
};

const IMPLICATION_LABEL: Record<VolatilityView["implication"], string> = {
  favors_selling: "Favors selling options",
  favors_buying: "Favors buying options",
  neutral: "No edge either way",
};

export default function VolatilityCard({ volatility }: { volatility: VolatilityView }) {
  const color = REGIME_COLOR[volatility.regime];
  const rank = Math.min(100, Math.max(0, volatility.iv_rank));

  return (
    <section className="tv-panel rounded-xl px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Volatility</p>
        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color }}>
          {IMPLICATION_LABEL[volatility.implication]}
        </span>
      </div>

      <p className="mt-2 text-lg font-medium text-[var(--text-primary)]">{volatility.headline}</p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[var(--text-secondary)]">IV rank</span>
          <span className="metric text-xl font-semibold" style={{ color }}>
            {rank.toFixed(0)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--tv-surface-2)]">
          <div className="h-full rounded-full transition-[width]" style={{ width: `${rank}%`, background: color }} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{volatility.detail}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{volatility.comparison}</p>

      <dl className="metric mt-4 grid grid-cols-3 gap-2 border-t border-[var(--tv-border)] pt-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Implied</dt>
          <dd className="text-sm text-[var(--text-primary)]">{(volatility.current_iv * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Actual (20d)</dt>
          <dd className="text-sm text-[var(--text-primary)]">{(volatility.hv_20 * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Ratio</dt>
          <dd className="text-sm text-[var(--text-primary)]">{volatility.iv_vs_hv.toFixed(2)}x</dd>
        </div>
      </dl>
    </section>
  );
}
