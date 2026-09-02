import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Bear Put Spread Explained: Formula, Example, and When It Fits";
const description =
  "How a bear put spread works: the max profit and max loss formulas, a worked numerical example, breakeven, and when it fits versus a plain long put.";
const leadAnswer =
  "A bear put spread buys a put at a higher strike and sells a put at a lower strike, both with the same " +
  "expiration. The short put's premium lowers the cost of the long put, capping both potential profit and loss. " +
  "It profits from a moderate decline in the stock, with a defined maximum gain and loss set the moment the trade opens.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/bear-put-spread" },
  openGraph: { title, description, url: "/learn/bear-put-spread", type: "article" },
};

export default function BearPutSpreadPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy guide"
      h1="Bear put spread explained"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/bear-put-spread"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Bear put spread"
      risks={[
        "Debit paid is at risk in full if the stock closes at or above the long strike at expiration.",
        "The short put caps profit below its strike -- a sharp decline does not add extra profit past that point.",
        "Both legs need a real, liquid market to enter and exit at a fair price; a wide bid/ask spread on either leg erodes the edge the structure is meant to provide.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Why buy a spread instead of just the put?",
          answer:
            "The short put's premium partially pays for the long put, lowering the cost and raising the breakeven price closer to today's stock price -- at the cost of capping how much the position can make below the short strike.",
        },
        {
          question: "What happens if the stock finishes between the two strikes?",
          answer:
            "The long put has intrinsic value, the short put expires worthless, and the position is worth the difference between the long strike and the stock price, up to the width of the spread.",
        },
        {
          question: "Is a bear put spread the same as buying a protective put?",
          answer:
            "No. A protective put is bought against stock you already own, to limit downside on a position you want to keep. A bear put spread owns no stock -- it's a standalone bearish bet with a capped cost and capped payoff.",
        },
      ]}
      related={[
        { href: "/learn/bull-call-spread", label: "Bull call spread" },
        { href: "/learn/protective-collars", label: "Protective collars" },
        { href: "/learn/defined-risk-vs-undefined-risk", label: "Defined-risk vs. undefined-risk" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formulas</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Long strike − short strike) × 100 − net debit paid.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The net debit paid, in full -- this is the most the position can lose.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Long strike − net debit per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Bearish, but not expecting a collapse -- the short strike is where the thesis "pays off in full."
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A worked example</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Illustrative numbers, not live quotes -- for that, see the real, current option chain on the{" "}
          <a href="/ideas" className="text-[var(--text-accent)] underline underline-offset-2">
            ideas
          </a>{" "}
          page.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Stock trading at</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">$100</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Buy</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $100 put for $5.00</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $90 put for $2.00 — net debit $3.00 ($300)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Width</td>
                <td className="py-2 text-[var(--text-secondary)]">$10 × 100 = $1,000</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max profit</td>
                <td className="py-2 text-[var(--text-secondary)]">$1,000 − $300 = $700, if the stock closes at or below $90</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max loss</td>
                <td className="py-2 text-[var(--text-secondary)]">$300, if the stock closes at or above $100</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Breakeven</td>
                <td className="py-2 text-[var(--text-secondary)]">$100 − $3.00 = $97</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
