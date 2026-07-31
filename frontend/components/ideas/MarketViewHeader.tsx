import type { IdeasResponse } from "@/lib/types";
import BiasPill from "./BiasPill";

interface Props {
  data: IdeasResponse;
}

export default function MarketViewHeader({ data }: Props) {
  const { quote, market_view: view } = data;
  const high = quote["52w_high"];
  const low = quote["52w_low"];
  const range = high - low;
  const position = range > 0 ? Math.min(100, Math.max(0, ((quote.price - low) / range) * 100)) : 50;

  return (
    <section className="tv-panel rounded-xl px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{data.symbol}</h1>
        <span className="metric text-2xl text-[var(--text-primary)]">${quote.price.toFixed(2)}</span>
        <BiasPill bias={view.bias} />
      </div>

      <p className="mt-2 text-lg text-[var(--text-primary)]">{view.headline}</p>

      <ul className="mt-3 space-y-1.5">
        {view.drivers.map((driver) => (
          <li key={driver} className="flex gap-2 text-sm text-[var(--text-secondary)]">
            <span aria-hidden="true" className="mt-2 h-px w-2 shrink-0 bg-[var(--text-tertiary)]" />
            <span>{driver}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <div className="relative h-1.5 rounded-full bg-[var(--tv-surface-2)]">
          <div
            className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-[var(--text-accent)]"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="metric mt-1.5 flex justify-between text-[11px] text-[var(--text-tertiary)]">
          <span>52w low ${low.toFixed(2)}</span>
          <span>52w high ${high.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}
