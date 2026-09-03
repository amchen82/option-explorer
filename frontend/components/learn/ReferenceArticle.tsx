import type { ReactNode } from "react";
import Link from "next/link";

const SITE_URL = "https://www.option-ideas.com";
// No individual is named anywhere on the site, so this is an organizational
// byline (real -- Option Ideas genuinely publishes this) rather than a
// fabricated person with invented credentials.
const AUTHOR_NAME = "Option Ideas Editorial Team";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  href: string;
  label: string;
}

export interface ReferenceArticleProps {
  eyebrow: string;
  h1: string;
  /** 40-70 word direct answer, shown immediately under the H1. */
  leadAnswer: string;
  canonicalPath: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) this page's content was first published. */
  published: string;
  /** ISO date this page's content was last substantively updated. */
  updated: string;
  breadcrumbLabel: string;
  /** Worked example, formulas, comparison tables -- whatever this specific page needs. */
  children: ReactNode;
  risks: string[];
  /** Named authoritative bodies for further reading. No hyperlinks: this app
   * does not construct links to third-party URLs it hasn't verified exist. */
  references: string[];
  faq: FaqItem[];
  related: RelatedLink[];
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ReferenceArticle({
  eyebrow,
  h1,
  leadAnswer,
  canonicalPath,
  title,
  description,
  published,
  updated,
  breadcrumbLabel,
  children,
  risks,
  references,
  faq,
  related,
}: ReferenceArticleProps) {
  const url = `${SITE_URL}${canonicalPath}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished: published,
    dateModified: updated,
    author: { "@type": "Organization", name: AUTHOR_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: "Option Ideas", url: SITE_URL },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_URL}/learn` },
      { "@type": "ListItem", position: 3, name: breadcrumbLabel, item: url },
    ],
  };

  const faqJsonLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{h1}</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[var(--text-primary)]">{leadAnswer}</p>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          By {AUTHOR_NAME} · Published {formatDate(published)}
          {updated !== published && <> · Updated {formatDate(updated)}</>}
        </p>
      </header>

      {children}

      {risks.length > 0 && (
        <section className="tv-panel rounded-xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Risks and assumptions</h2>
          <ul className="mt-3 space-y-2">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                <span aria-hidden="true" className="mt-2 h-px w-2 shrink-0 bg-[var(--text-warning)]" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {faq.length > 0 && (
        <section className="tv-panel rounded-xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">FAQ</h2>
          <div className="mt-3 space-y-4">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.question}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {references.length > 0 && (
        <section className="tv-panel rounded-xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Primary references</h2>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Not hyperlinked deliberately -- verify current material directly on each organization&apos;s own site.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[var(--text-secondary)]">
            {references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </section>
      )}

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-sm leading-6 text-[#f1c27a]">
        For educational purposes only. Options trading involves significant risk of loss. Consult a qualified
        financial advisor before trading.
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ideas"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          See real ideas for this strategy
        </Link>
        {related.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
