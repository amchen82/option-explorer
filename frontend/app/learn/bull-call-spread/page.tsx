import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Bull Call Spread Explained: Formula, Example, and When It Fits";
const description =
  "How a bull call spread works: the max profit and max loss formulas, a worked numerical example, breakeven, and when it fits versus a plain long call.";
const leadAnswer =
  "A bull call spread buys a call at a lower strike and sells a call at a higher strike, both with the same " +
  "expiration. The short call's premium lowers the cost of the long call, capping both potential profit and loss. " +
  "It profits from a moderate rise in the stock, with a defined maximum gain and loss set the moment the trade opens.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/bull-call-spread" },
  openGraph: { title, description, url: "/learn/bull-call-spread", type: "article" },
};

export default function BullCallSpreadPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy guide"
      h1="Bull call spread explained"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/bull-call-spread"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Bull call spread"
      risks={[
        "Debit paid is at risk in full if the stock closes at or below the long strike at expiration.",
        "The short call caps upside above its strike -- a strong rally does not add extra profit past that point.",
        "Both legs need a real, liquid market to enter and exit at a fair price; a wide bid/ask spread on either leg erodes the edge the structure is meant to provide.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Why buy a spread instead of just the call?",
          answer:
            "The short call's premium partially pays for the long call, lowering the cost and the breakeven price -- at the cost of capping how much the position can make above the short strike.",
        },
        {
          question: "What happens if the stock finishes between the two strikes?",
          answer:
            "The long call has intrinsic value, the short call expires worthless, and the position is worth the difference between the stock price and the long strike, up to the width of the spread.",
        },
        {
          question: "Is a bull call spread the same as a covered call?",
          answer:
            "No. A covered call sells a call against 100 shares you already own. A bull call spread owns no stock at all -- both legs are options, bought and sold together as one position.",
        },
      ]}
      related={[
        { href: "/learn/bear-put-spread", label: "Bear put spread" },
        { href: "/learn/covered-calls", label: "Covered calls" },
        { href: "/learn/comparing-option-strategies", label: "Comparing two strategies" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formulas</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Short strike − long strike) × 100 − net debit paid.
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
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Long strike + net debit per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Bullish, but not expecting a runaway move -- the short strike is where the thesis "pays off in full."
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
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $100 call for $5.00</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $110 call for $2.00 — net debit $3.00 ($300)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Width</td>
                <td className="py-2 text-[var(--text-secondary)]">$10 × 100 = $1,000</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max profit</td>
                <td className="py-2 text-[var(--text-secondary)]">$1,000 − $300 = $700, if the stock closes at or above $110</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max loss</td>
                <td className="py-2 text-[var(--text-secondary)]">$300, if the stock closes at or below $100</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Breakeven</td>
                <td className="py-2 text-[var(--text-secondary)]">$100 + $3.00 = $103</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bull call spread vs. a plain long call</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Trait</th>
                <th className="py-2 pr-4 font-medium">Long call alone</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Bull call spread</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Cost</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Full premium, e.g. $500</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Reduced by the short call's premium, e.g. $300</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Max profit</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Unlimited</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Capped at the width minus the debit</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Breakeven</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Higher (full premium to overcome)</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Lower (only the net debit to overcome)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
