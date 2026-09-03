import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Cash-Secured Puts Explained — Get Paid to Wait for Your Price";
const description =
  "How a cash-secured put works, its real max profit and max loss, breakeven, and when it fits — with a worked example and honest risks.";
const leadAnswer =
  "A cash-secured put sells someone the right to make you buy 100 shares at a chosen strike price, while you " +
  "hold enough cash to cover that purchase. The premium collected is the maximum profit if the put expires " +
  "worthless. Maximum loss remains substantial, since the stock can still fall most of the way toward zero after assignment.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/cash-secured-puts" },
  openGraph: { title, description, url: "/learn/cash-secured-puts", type: "article" },
};

export default function CashSecuredPutsPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy guide"
      h1="Cash-secured puts: get paid to wait for your price"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/cash-secured-puts"
      title={title}
      description={description}
      published="2026-09-01"
      updated="2026-09-02"
      breadcrumbLabel="Cash-secured puts"
      risks={[
        "Maximum loss is substantial, not eliminated: if the stock falls well below the strike, you're assigned at the strike regardless, and the premium only offsets a small part of the decline.",
        "The full cash reserve is tied up for the life of the trade, whether or not the put ends up assigned.",
        "Assignment can happen before expiration if the put goes deep enough in the money, handing you the shares (and the cash outlay) sooner than the calendar suggested.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Do I need to actually want to own the stock?",
          answer: "Yes, genuinely -- this only works as intended on a stock you'd be a happy buyer of at the strike. Selling puts purely for premium on a stock you don't want defeats the point of the strategy.",
        },
        {
          question: "What happens if I don't have the full cash reserved?",
          answer: "A broker won't let a true cash-secured put be opened without the cash (or approved margin) to cover assignment -- without it, you'd be selling a naked put instead, a different, higher-risk position.",
        },
        {
          question: "Can I close the put before expiration?",
          answer: "Yes -- buying back the same put closes the position early, locking in a gain or loss without waiting to see whether assignment happens.",
        },
      ]}
      related={[
        { href: "/learn/covered-calls", label: "Covered calls" },
        { href: "/learn/covered-call-vs-cash-secured-put", label: "Covered call vs. cash-secured put" },
        { href: "/learn/probability-of-profit", label: "Probability of profit" },
      ]}
    >
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
          <a href="/ideas" className="text-[var(--text-accent)] underline underline-offset-2">
            ideas
          </a>{" "}
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
    </ReferenceArticle>
  );
}
