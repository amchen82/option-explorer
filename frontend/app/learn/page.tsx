import type { Metadata } from "next";
import Link from "next/link";

const title = "Options Strategy Guides — Learn Before You Trade";
const description = "Plain-language guides to individual options strategies: what they are, the real numbers, and when they fit.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn" },
  openGraph: { title, description, url: "/learn", type: "website" },
};

const articles = [
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
    href: "/learn/glossary",
    title: "Glossary",
    description: "Every term used on this site — premium, the Greeks, IV rank, breakeven, and more — in one place.",
  },
];

export default function LearnIndexPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Strategy guides</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Learn one strategy at a time</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Each guide covers one strategy in depth: the exact mechanics, real max profit and max loss, breakeven, a
          worked example, and honestly when it does and doesn&apos;t fit. New to options entirely? Start with the{" "}
          <Link href="/tutorial" className="text-[var(--text-accent)] underline underline-offset-2">
            tutorial
          </Link>{" "}
          first.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="tv-panel rounded-xl transition hover:bg-[var(--tv-surface-2)]"
          >
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{article.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
