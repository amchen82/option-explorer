import type { Metadata } from "next";
import Link from "next/link";

const title = "About Option Ideas";
const description =
  "Option Ideas exists to educate: understand real options trade ideas built from real market data, across a wide range of strategies for any ticker.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title, description, url: "/about", type: "website" },
};

// Only verifiable facts: no founder/team Person entities, since none are
// publicly named anywhere on the site -- inventing "real authors" for
// schema would be exactly the kind of fabrication this is meant to avoid.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Option Ideas",
  url: "https://www.option-ideas.com",
  description,
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">About us</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          Our goal is to help you understand the trade, not just see the numbers
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Option Ideas exists to educate. Every idea is generated from real market data and a real, current option
          chain for the ticker you choose — never a hypothetical placeholder — so you can explore a wide range of
          genuine strategies and actually understand why each one works before you ever consider trading it.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Educational first</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">We explain terminology, trade structure, and risk alongside the numbers, so you understand the trade, not just its payoff.</p>
        </article>
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Real data, real market</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Every idea is priced from a live option chain, not a hypothetical — and estimates are labeled clearly whenever live quotes aren&apos;t available.</p>
        </article>
        <article className="tv-panel rounded-xl">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Many ideas to explore</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Up to eight strategies at once for any ticker, ranked and explained, so you can compare instead of guessing at just one.</p>
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