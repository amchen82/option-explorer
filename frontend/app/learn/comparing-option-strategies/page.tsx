import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "How to Compare Two Option Strategies (Not Just Their Return)";
const description =
  "A five-number framework for comparing any two option strategies -- max profit, max loss, breakeven, probability of profit, and capital required -- with a worked side-by-side example.";
const leadAnswer =
  "Comparing two option strategies means lining up the same handful of numbers for each: maximum profit, maximum " +
  "loss, breakeven price, probability of profit, and capital required. The 'better' strategy depends on which of " +
  "those numbers matters most for a given market view and risk tolerance, not on which one has the highest headline return.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/comparing-option-strategies" },
  openGraph: { title, description, url: "/learn/comparing-option-strategies", type: "article" },
};

export default function ComparingOptionStrategiesPage() {
  return (
    <ReferenceArticle
      eyebrow="How to"
      h1="How to compare two option strategies"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/comparing-option-strategies"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Comparing option strategies"
      risks={[
        "The highest max profit is often the strategy with the lowest probability of profit -- the two numbers usually trade off against each other rather than one strategy winning on both.",
        "Capital required isn't just about affordability. Two positions with the same dollar risk can tie up very different amounts of buying power (a spread's defined risk vs. a cash-secured put's full strike reservation, for example).",
        "None of these numbers account for how liquid the actual contracts are -- a strategy that looks better on paper can be worse in practice if its legs have wide bid/ask spreads.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Should I always pick the strategy with the higher probability of profit?",
          answer:
            "Not automatically -- it usually comes with a smaller maximum profit and a larger maximum loss relative to that profit. The right trade-off depends on how the position fits the rest of a portfolio, not on probability alone.",
        },
        {
          question: "How does this app rank ideas for the same ticker?",
          answer:
            "Each idea gets a conviction score weighted across whether the trend agrees with its direction (40%), whether IV rank favors buying or selling here (30%), how liquid the contracts are (20%), and whether earnings fall inside the trade's life (10%) -- not a single number like max profit alone.",
        },
        {
          question: "Is comparing strategies across different expirations meaningful?",
          answer:
            "Only with care -- a longer-dated position will generally show a larger dollar max profit and max loss simply because more time (and more possible stock movement) is involved. Comparing at the same or similar expiration is more apples-to-apples.",
        },
      ]}
      related={[
        { href: "/learn/probability-of-profit", label: "Probability of profit" },
        { href: "/learn/defined-risk-vs-undefined-risk", label: "Defined-risk vs. undefined-risk" },
        { href: "/learn/covered-call-vs-cash-secured-put", label: "Covered call vs. cash-secured put" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The five numbers to line up</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The best case, in dollars.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The worst case, in dollars.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The stock price where the trade neither makes nor loses money.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Probability of profit</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              A delta-based estimate of the odds the position finishes profitable.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Capital required</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              What the trade actually ties up -- not always the same as max loss.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Worked example: long call vs. bull call spread
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Same stock at $100, same $100 strike -- the numbers from the{" "}
          <a href="/learn/bull-call-spread" className="text-[var(--text-accent)] underline underline-offset-2">
            bull call spread
          </a>{" "}
          guide, side by side with buying that call outright.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Metric</th>
                <th className="py-2 pr-4 font-medium">Long $100 call</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">$100/$110 bull call spread</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Capital required</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$500</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$300</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Max profit</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">Unlimited</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$700 (capped at $110)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Max loss</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$500</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$300</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Breakeven</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$105</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$103</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          The spread costs less, breaks even sooner, and loses less if wrong -- in exchange for giving up
          everything above $110. Neither is objectively better; the spread fits a moderate-rally view, while the
          plain call fits a conviction that the move could run much further.
        </p>
      </section>
    </ReferenceArticle>
  );
}
