import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Start with an idea",
    description: "Open Option Ideas. The page selects a liquid, widely traded ticker at random, or enter a ticker you want to explore.",
  },
  {
    number: "02",
    title: "Read the market snapshot",
    description: "Review the current price, market bias, RSI, short-term range, and volatility context before looking at any strategy.",
  },
  {
    number: "03",
    title: "Compare trade cards",
    description: "Each card shows the strategy, its maximum profit and loss, probability estimate, capital requirement, and directional bias.",
  },
  {
    number: "04",
    title: "Open the detail",
    description: "Expand a card to review the option legs, breakeven, Greeks, payoff chart, and the risks that could affect the trade.",
  },
];

export default function HowToPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Getting started</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">How to use Option Ideas</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Option Ideas is an educational research tool. It turns a ticker&apos;s market data and option chain into
          comparable strategy examples—it does not place trades or provide personalized investment advice. New to
          options? Start with the <Link href="/tutorial" className="text-[var(--text-accent)] underline underline-offset-2">tutorial</Link> first.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <article key={step.number} className="tv-panel rounded-xl">
            <span className="metric text-xs text-[var(--text-accent)]">{step.number}</span>
            <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
          </article>
        ))}
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Key terms</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">One contract</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">A standard U.S. equity option contract represents 100 shares.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Strike price</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The agreed price at which shares may be bought or sold if the option is exercised.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Expiration</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The last date the option contract is valid. After this date, it expires.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Modeled data</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">A calculated estimate shown only when live option quotes are unavailable.</dd>
          </div>
        </dl>
      </section>

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-sm leading-6 text-[#f1c27a]">
        Options can lose value quickly and some strategies can involve substantial risk. Verify live quotes, contract
        specifications, and assignment risk with a broker before making any decision.
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ideas"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          Explore option ideas
        </Link>
        <Link
          href="/faq"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Read the FAQ
        </Link>
      </div>
    </div>
  );
}
