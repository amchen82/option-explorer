import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Defined-Risk vs. Undefined-Risk Options Strategies";
const description =
  "The difference between a strategy with a fixed maximum loss and one with a substantial or unlimited maximum loss, with examples of each and the trade-offs between them.";
const leadAnswer =
  "A defined-risk strategy has a maximum possible loss that is fixed the moment the trade is opened, no matter " +
  "how far the stock moves -- a long option or a spread, for example. An undefined-risk strategy has a maximum " +
  "loss that is substantial or theoretically unlimited, such as a naked short call or an uncovered short put. The trade-off is usually more premium collected for taking on undefined risk.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/defined-risk-vs-undefined-risk" },
  openGraph: { title, description, url: "/learn/defined-risk-vs-undefined-risk", type: "article" },
};

export default function DefinedRiskVsUndefinedRiskPage() {
  return (
    <ReferenceArticle
      eyebrow="Risk categories"
      h1="Defined-risk vs. undefined-risk strategies"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/defined-risk-vs-undefined-risk"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Defined-risk vs. undefined-risk"
      risks={[
        "\"Substantial\" is doing real work in a covered call or cash-secured put's risk profile -- the stock going to zero is a defined worst case mathematically, but it is still effectively the entire position's value.",
        "A naked short call's loss is unbounded on paper because a stock's price has no theoretical ceiling; in practice a large enough adverse move can still exceed a trader's ability to cover it.",
        "Converting an undefined-risk position into a defined-risk one (for example, buying a further OTM option to cap a naked short) changes the position's cost and breakeven -- it is not a free adjustment.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Is a covered call defined-risk or undefined-risk?",
          answer:
            "It's grouped with the \"substantial but not unlimited\" case: the stock can only fall to $0, so the loss is mathematically bounded, but that bound is the full value of the stock -- much larger than the premium collected.",
        },
        {
          question: "Why would anyone take on undefined risk?",
          answer:
            "It generally collects more premium than the defined-risk equivalent, since the buyer on the other side is paying for the seller to carry that larger, uncapped worst case.",
        },
        {
          question: "Which strategies on this site are defined-risk?",
          answer:
            "Long call, long put, bull call spread, and bear put spread all have a maximum loss fixed at the premium paid or the spread's net debit. Covered call, cash-secured put, collar, and bear call spread all carry a larger, though not literally unlimited, worst case.",
        },
      ]}
      related={[
        { href: "/learn/credit-spread-max-loss", label: "Credit spread max loss" },
        { href: "/learn/comparing-option-strategies", label: "Comparing two strategies" },
        { href: "/learn/covered-call-vs-cash-secured-put", label: "Covered call vs. cash-secured put" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Where each strategy falls</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Examples</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Max loss</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Defined risk</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Long call, long put, bull call spread, bear put spread, iron condor
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Fixed at trade entry — premium paid or spread width minus credit</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Substantial, bounded</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Covered call, cash-secured put, collar</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Stock falling to $0, minus premium collected</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Undefined / uncapped</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Naked short call, bear call spread without the long leg</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">No theoretical ceiling on how far the stock can rise</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
