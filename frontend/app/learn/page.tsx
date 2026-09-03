import type { Metadata } from "next";
import Link from "next/link";

const title = "Options Reference Center — Strategies, Formulas, and Definitions";
const description =
  "A full options reference: strategy guides, formulas for max profit/loss and breakeven, comparisons between strategies, and a glossary -- each with a worked example.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn" },
  openGraph: { title, description, url: "/learn", type: "website" },
};

interface Article {
  href: string;
  title: string;
  description: string;
}

const strategyGuides: Article[] = [
  {
    href: "/learn/covered-calls",
    title: "Covered calls",
    description: "Turn shares you already own into income, in exchange for capping your upside.",
  },
  {
    href: "/learn/cash-secured-puts",
    title: "Cash-secured puts",
    description: "Get paid to wait for a price you'd already be happy to buy at.",
  },
  {
    href: "/learn/protective-collars",
    title: "Protective collars",
    description: "Fence in a gain you've already made, without paying full price for insurance.",
  },
  {
    href: "/learn/bull-call-spread",
    title: "Bull call spread",
    description: "A cheaper, capped-upside way to make a bullish bet than buying a call outright.",
  },
  {
    href: "/learn/bear-put-spread",
    title: "Bear put spread",
    description: "A cheaper, capped-upside way to make a bearish bet than buying a put outright.",
  },
];

const formulasAndCalculations: Article[] = [
  {
    href: "/learn/credit-spread-max-loss",
    title: "Credit spread maximum loss",
    description: "The width-minus-credit formula, with a worked bull put spread example.",
  },
  {
    href: "/learn/iron-condor-breakeven",
    title: "Iron condor breakeven",
    description: "How to calculate both of an iron condor's breakeven prices.",
  },
  {
    href: "/learn/probability-of-profit",
    title: "Probability of profit",
    description: "The delta-based formula most tools use, and why it's an estimate, not a fact.",
  },
  {
    href: "/learn/bid-ask-spread",
    title: "Bid/ask spread",
    description: "How to calculate spread as a percentage of mid price, and why it matters.",
  },
];

const concepts: Article[] = [
  {
    href: "/learn/options-greeks-explained",
    title: "Options Greeks explained",
    description: "What delta, gamma, theta, and vega each actually measure.",
  },
  {
    href: "/learn/theta-decay-examples",
    title: "Theta decay examples",
    description: "Worked dollar examples of why decay accelerates as expiration nears.",
  },
  {
    href: "/learn/iv-percentile-vs-iv-rank",
    title: "IV percentile vs. IV rank",
    description: "Two different ways to measure today's implied volatility against its own history.",
  },
  {
    href: "/learn/defined-risk-vs-undefined-risk",
    title: "Defined-risk vs. undefined-risk",
    description: "Which strategies have a fixed maximum loss, and which don't.",
  },
];

const howToAndComparisons: Article[] = [
  {
    href: "/learn/choosing-an-expiration-date",
    title: "Choosing an expiration date",
    description: "Balancing time decay against how much room a trade needs to work.",
  },
  {
    href: "/learn/comparing-option-strategies",
    title: "Comparing two option strategies",
    description: "A five-number framework for judging any two strategies side by side.",
  },
  {
    href: "/learn/covered-call-vs-cash-secured-put",
    title: "Covered call vs. cash-secured put",
    description: "Why they produce nearly identical payoffs, and the one real difference between them.",
  },
];

const reference: Article[] = [
  {
    href: "/learn/glossary",
    title: "Glossary",
    description: "Every term used on this site -- premium, the Greeks, IV rank, breakeven, and more -- in one place.",
  },
];

function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {articles.map((article) => (
        <Link
          key={article.href}
          href={article.href}
          className="tv-panel rounded-xl transition hover:bg-[var(--tv-surface-2)]"
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{article.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{article.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default function LearnIndexPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Options reference center</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          Strategies, formulas, and definitions
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Every guide answers one specific question in depth: the exact mechanics, the real formulas, a worked
          numerical example, and honestly when it does and doesn&apos;t fit. New to options entirely? Start with the{" "}
          <Link href="/tutorial" className="text-[var(--text-accent)] underline underline-offset-2">
            tutorial
          </Link>{" "}
          first.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Strategies</h2>
        <ArticleGrid articles={strategyGuides} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Formulas &amp; calculations</h2>
        <ArticleGrid articles={formulasAndCalculations} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Concepts</h2>
        <ArticleGrid articles={concepts} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">How-to &amp; comparisons</h2>
        <ArticleGrid articles={howToAndComparisons} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reference</h2>
        <ArticleGrid articles={reference} />
      </section>
    </div>
  );
}
