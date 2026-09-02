import type { Metadata } from "next";
import Link from "next/link";

const title = "Options Trading Glossary — Every Term Explained Plainly";
const description = "Plain-language definitions for every options term you'll see on this site: premium, strike, the Greeks, IV rank, breakeven, assignment, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/glossary" },
  openGraph: { title, description, url: "/learn/glossary", type: "website" },
};

const glossaryJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Options Trading Glossary",
  description,
};

type Term = { term: string; definition: string };

const basics: Term[] = [
  { term: "Premium", definition: "The price a buyer pays (and a seller receives) for one option contract." },
  { term: "Strike price", definition: "The fixed price per share at which the stock may be bought or sold if the option is exercised." },
  { term: "Expiration", definition: "The last date the contract is valid. After this date, it either gets exercised, assigned, or expires worthless." },
  { term: "1 contract", definition: "Represents 100 shares of the underlying stock, unless otherwise noted." },
  { term: "Moneyness", definition: "Where the stock price sits relative to the strike — in-the-money (ITM), at-the-money (ATM), or out-of-the-money (OTM)." },
  { term: "Exercise", definition: "When an option's buyer uses their right to buy (call) or sell (put) the stock at the strike price." },
  { term: "Assignment", definition: "What happens to the seller of an option when the buyer exercises it — they're obligated to fulfill the contract." },
  { term: "Credit / debit", definition: "A credit trade collects money up front (you're a net seller). A debit trade pays money up front (you're a net buyer)." },
];

const greeks: Term[] = [
  { term: "Delta", definition: "How much an option's value changes per $1 move in the stock. Also a rough (not exact) proxy for the odds of finishing in the money." },
  { term: "Gamma", definition: "How much delta itself changes per $1 move in the stock — the rate of change of the rate of change." },
  { term: "Theta", definition: "How much value an option loses per day from time passing alone, all else equal. Negative for buyers, positive for sellers." },
  { term: "Vega", definition: "How much an option's value changes for a 1-point move in implied volatility." },
];

const volatility: Term[] = [
  { term: "Implied volatility (IV)", definition: "The market's forecast, baked into an option's price, for how much the stock will move before expiration." },
  { term: "Historical / realized volatility (HV)", definition: "How much the stock has actually moved recently, measured from its own price history — not a forecast, a fact." },
  { term: "IV rank", definition: "Where today's implied volatility sits relative to its own recent range — near the top (expensive) or bottom (cheap) of where it's typically been." },
  { term: "Live vs. estimated", definition: "\"Live\" means a number came from a real, current market quote. \"Estimated\" means no usable live quote existed, so it was derived from recent price history instead — this site labels the difference rather than blur it." },
];

const cardTerms: Term[] = [
  { term: "Breakeven", definition: "The stock price at expiration where the trade neither makes nor loses money." },
  { term: "Chance of profit", definition: "Estimated from delta — roughly the odds the position finishes in the money. Not the same as a guaranteed probability." },
  { term: "Capital required", definition: "What the trade ties up: premium paid for a debit trade, cash reserved for a cash-secured put, or the value of shares already held for a covered call or collar." },
  { term: "Conviction score", definition: "A weighted score (not a guarantee) combining whether the trend agrees with the idea's direction, whether IV rank favors this structure, how liquid the contracts are, and whether earnings fall inside the trade's life." },
  { term: "Open interest", definition: "How many contracts at that strike are currently open (not yet closed or expired) — a rough proxy for how easy the contract is to trade." },
];

function TermTable({ terms }: { terms: Term[] }) {
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      {terms.map((item) => (
        <div key={item.term}>
          <dt className="text-sm font-medium text-[var(--text-primary)]">{item.term}</dt>
          <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.definition}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function GlossaryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Reference</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Glossary</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Every term used on this site, defined plainly in one place. For a guided walkthrough instead, see the{" "}
          <Link href="/tutorial" className="text-[var(--text-accent)] underline underline-offset-2">
            tutorial
          </Link>
          .
        </p>
      </header>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Options basics</h2>
        <TermTable terms={basics} />
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The Greeks</h2>
        <TermTable terms={greeks} />
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Volatility &amp; data quality</h2>
        <TermTable terms={volatility} />
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Terms on an idea card</h2>
        <TermTable terms={cardTerms} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ideas"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          Explore option ideas
        </Link>
        <Link
          href="/learn"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Browse strategy guides
        </Link>
      </div>
    </div>
  );
}
