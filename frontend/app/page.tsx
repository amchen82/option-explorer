import Link from "next/link";

const sellingPoints = [
  {
    title: "Educational first",
    description: "We explain terminology, trade structure, and risk alongside the numbers—not just a strategy name and a payoff.",
  },
  {
    title: "Data-aware",
    description: "Live option data is labeled clearly, and estimates are visibly marked whenever real quotes are unavailable.",
  },
  {
    title: "No trade execution",
    description: "The tool does not connect to a broker, place orders, or recommend position sizes. It's research, not execution.",
  },
  {
    title: "Free, no sign-in required",
    description: "Pick a ticker and start comparing strategy ideas immediately—no account needed to explore.",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick a ticker",
    description: "Start with a random liquid ticker or search for one you're watching.",
  },
  {
    number: "02",
    title: "Read the snapshot",
    description: "See price, bias, RSI, and volatility context before any strategy.",
  },
  {
    number: "03",
    title: "Compare trade ideas",
    description: "Every card shows max profit, max loss, probability, and capital required.",
  },
  {
    number: "04",
    title: "Open the detail",
    description: "Expand a card for legs, breakeven, Greeks, and the payoff chart.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2">
      <header className="tv-panel rounded-xl text-center sm:text-left">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Option Ideas</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
          Understand an options trade before you make one
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:mx-0">
          Option Ideas turns a ticker&apos;s market data and option chain into comparable strategy examples, each
          with plain-language reasoning behind it. No broker connection, no sign-in, no jargon left unexplained.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row sm:justify-start">
          <Link
            href="/ideas"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
          >
            Explore option ideas
          </Link>
          <Link
            href="/how-to"
            className="tv-chip inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
          >
            See how it works
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">See it in action</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          A quick look at the tool, the education, and the help along the way.
        </p>
        <div className="tv-panel mt-3 rounded-xl">
          <div className="overflow-hidden rounded-lg border border-[var(--tv-border)]">
            <video
              className="block w-full"
              src="/videos/walkthrough.mp4"
              poster="/videos/walkthrough-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          </div>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">How it works</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="metric text-xs text-[var(--text-accent)]">{step.number}</span>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
            </div>
          ))}
        </div>
        <Link href="/how-to" className="mt-4 inline-flex text-sm font-medium text-[var(--text-accent)] hover:underline">
          Read the full walkthrough &rarr;
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Why Option Ideas</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sellingPoints.map((point) => (
            <article key={point.title} className="tv-panel rounded-xl">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{point.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-6 py-10 text-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Ready to explore a ticker?</h2>
        <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Pick any liquid stock or ETF and see the strategy ideas Option Ideas would consider, with the reasoning
          behind each one.
        </p>
        <Link
          href="/ideas"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          Explore option ideas
        </Link>
      </section>

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-center text-xs leading-6 text-[#f1c27a]">
        For educational purposes only. Options trading involves significant risk of loss. Nothing here is
        investment, financial, legal, or tax advice.
      </aside>
    </div>
  );
}
