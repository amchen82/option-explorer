import type { Metadata } from "next";
import Link from "next/link";

const title = "Protective Collars Explained — Fence In Gains Without Paying Full Price";
const description =
  "How a protective collar works, its real max profit and max loss, breakeven, and when it fits — with a worked example and honest risks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/protective-collars" },
  openGraph: { title, description, url: "/learn/protective-collars", type: "article" },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url: "https://www.option-ideas.com/learn/protective-collars",
};

export default function ProtectiveCollarsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Strategy guide</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          Protective collars: fence in gains without paying full price for insurance
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          A collar combines two trades you may already know: sell a covered call above the stock price, and use that
          premium to buy a protective put below it. The result is a position with both a floor and a ceiling —
          useful after a stock you own has already run up and you want to protect the gain cheaply.
        </p>
      </header>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The mechanics</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          You need 100 shares. You sell one call above the current price (collecting premium) and buy one put below
          the current price (paying premium) — usually sized so the call mostly or fully pays for the put. By
          expiration, the stock lands in one of three zones:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Above the call strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Shares called away at the call strike — your gain is capped there, same trade-off as a covered call.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Between the two strikes</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Both options expire worthless. You keep the shares, and simply own the stock (minus or plus whatever
              net premium the collar cost or paid you).
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Below the put strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              The put protects you — your loss stops at the put strike, no matter how much further the stock falls.
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
              (Call strike − cost basis) × 100, plus or minus the net premium. Fixed the moment you open the collar.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Put strike − cost basis) × 100, plus or minus the net premium. Also fixed the moment you open the
              collar — this is the whole point of the put leg.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Cost basis, adjusted by the net premium (a net credit lowers it; a net debit raises it).
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Neutral — you&apos;re not trying to squeeze more upside out of the stock, you&apos;re defending what
              it&apos;s already made you.
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
          page, which prices collars from a real, current option chain.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You own</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">100 shares, cost basis $80, now at $100</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $110 call for $3.00</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You buy</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $90 put for $2.50 — net $0.50 credit</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $130</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Called away at $110. Profit capped at $3,050 — the $2,000 stock gain to $110 was mostly locked in
                  well before this close.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $50</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Put protects you at $90. Loss capped at $950, versus $3,000 for the shares alone.
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
              A stock you hold has already run up, you want to lock in most of the gain without selling outright, and
              you don&apos;t mind giving up further upside to get downside protection cheaply.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(240,68,56,0.35)] bg-[rgba(240,68,56,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#f79a92]">Doesn&apos;t fit</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You still expect meaningful further upside — the call strike caps that exactly like a plain covered
              call would, and a full-price put alone would protect you without capping the top.
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
          See real collar ideas
        </Link>
        <Link
          href="/learn/covered-calls"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Back to covered calls
        </Link>
      </div>
    </div>
  );
}
