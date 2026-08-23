import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">About us</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Clearer options research</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Option Ideas helps people explore common options strategies with understandable market context, payoff
          estimates, and plain-language risk explanations.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Educational first</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">We explain terminology, trade structure, and risk alongside the numbers.</p>
        </article>
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Data-aware</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Live option data is labeled clearly, and estimates are visibly marked when quotes are unavailable.</p>
        </article>
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">No trade execution</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">The tool does not connect to a broker, place orders, or recommend position sizes.</p>
        </article>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Important disclosure</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Content in this application is for educational and informational purposes only. It is not investment,
          financial, legal, or tax advice. Options involve risk, including the potential loss of the full amount paid
          for an option and, for certain strategies, losses greater than the initial amount received.
        </p>
      </section>

      <Link
        href="/tutorial"
        className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
      >
        Read the tutorial
      </Link>
    </div>
  );
}