import type { Metadata } from "next";
import Link from "next/link";

const title = "Cash-Secured Puts Explained — Get Paid to Wait for Your Price";
const description =
  "How a cash-secured put works, its real max profit and max loss, breakeven, and when it fits — with a worked example and honest risks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/cash-secured-puts" },
  openGraph: { title, description, url: "/learn/cash-secured-puts", type: "article" },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url: "https://www.option-ideas.com/learn/cash-secured-puts",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.option-ideas.com/" },
    { "@type": "ListItem", position: 2, name: "Learn", item: "https://www.option-ideas.com/learn" },
    { "@type": "ListItem", position: 3, name: "Cash-secured puts", item: "https://www.option-ideas.com/learn/cash-secured-puts" },
  ],
};

export default function CashSecuredPutsPage() {
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

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Strategy guide</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          Cash-secured puts: get paid to wait for your price
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          A cash-secured put is selling someone else the right to make you buy 100 shares at a price you pick, by a
          date you pick — while you hold the cash to actually buy them. It only makes sense on a stock you&apos;d be
          genuinely happy to own at that price.
        </p>
      </header>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The mechanics</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          You set aside strike × 100 in cash — the &ldquo;secured&rdquo; part. You sell one put per 100 shares you&apos;re
          willing to buy, below the current price. You collect the premium immediately. Two things can happen by
          expiration:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Stock stays above the strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              The put expires worthless. You keep the premium and never buy the stock. You can sell another put the
              next cycle.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Stock falls below the strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You&apos;re assigned — you buy 100 shares at the strike, using the cash you set aside. Your effective
              cost is the strike minus the premium you already collected.
            </p>
          </div>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The numbers, precisely</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The premium collected, in full — if the put expires worthless, that&apos;s the entire return.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss (substantial, not capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Strike × 100) − premium, in the worst case of the stock going to $0. You&apos;re on the hook for the
              full strike price regardless of how far the stock actually falls.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Strike − premium per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Bullish or neutral — you&apos;re fine with the stock staying flat or rising, and genuinely willing to
              own it if it falls to your strike.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A worked example</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Illustrative numbers, not live quotes — for that, see the{" "}
          <Link href="/ideas" className="text-[var(--text-accent)] underline underline-offset-2">
            ideas
          </Link>{" "}
          page, which prices cash-secured puts from a real, current option chain.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Stock trading at</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">$100</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">
                  1x $90 put for $2.50 premium, holding $9,000 in cash
                </td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $95</td>
                <td className="py-2 text-[var(--text-secondary)]">Put expires worthless. You keep the $250, no stock bought.</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $85</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Assigned 100 shares at $90. Effective cost basis: $87.50 — below today&apos;s $100, and below the
                  $85 the stock is worth on paper only if it keeps falling further.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $40</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Assigned at $90 regardless — a $5,000 unrealized loss on shares, offset by only $250 of premium.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">When it fits, and when it doesn&apos;t</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[rgba(18,183,106,0.35)] bg-[rgba(18,183,106,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#5fd897]">Fits</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You&apos;d be a genuinely happy buyer of the stock at the strike, and you&apos;re comfortable holding
              the full cash reserve until expiration — this only works as advertised on a stock you actually want.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(240,68,56,0.35)] bg-[rgba(240,68,56,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#f79a92]">Doesn&apos;t fit</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You&apos;re selling the put purely for the premium on a stock you wouldn&apos;t otherwise want, or you
              can&apos;t actually afford to have that cash tied up (or the shares assigned) through a sharp decline.
            </p>
          </div>
        </div>
      </section>

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-sm leading-6 text-[#f1c27a]">
        For educational purposes only. Options trading involves significant risk of loss. Consult a qualified
        financial advisor before trading.
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ideas"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          See real cash-secured put ideas
        </Link>
        <Link
          href="/learn/protective-collars"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Next: protective collars
        </Link>
      </div>
    </div>
  );
}
