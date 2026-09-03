import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "How Probability of Profit Is Calculated (and Why It's an Estimate)";
const description =
  "The delta-based formula commonly used to estimate an option position's probability of profit, why it's an approximation, and a worked example.";
const leadAnswer =
  "Probability of profit is commonly approximated from an option's delta: for a short option, it's 1 minus the " +
  "absolute value of delta; for a long option, it's the absolute value of delta itself. This is a widely used " +
  "shortcut, not an exact calculation -- delta measures the odds of finishing in the money, which is a related but different question from whether the trade is actually profitable.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/probability-of-profit" },
  openGraph: { title, description, url: "/learn/probability-of-profit", type: "article" },
};

export default function ProbabilityOfProfitPage() {
  return (
    <ReferenceArticle
      eyebrow="How it's calculated"
      h1="How probability of profit is calculated"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/probability-of-profit"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Probability of profit"
      risks={[
        "Delta is itself computed from an implied volatility input -- if that input is wrong (stale, estimated, or from a thin market), the resulting probability estimate inherits that error.",
        "This shortcut ignores the premium paid or received for a long position specifically becoming profitable, not just finishing in the money -- see the formula section below for why that matters.",
        "Real-world stock returns don't follow the same statistical distribution options pricing models assume, so any probability estimate is a model output, not a guarantee.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Is delta really the same thing as probability of profit?",
          answer:
            "Not exactly. Delta is closer to the probability of finishing in the money at expiration. For a long option, being in the money isn't the same as being profitable -- you also need to clear the premium you paid, which sits at a worse price than the strike itself.",
        },
        {
          question: "Why do short options use 1 minus delta instead of delta directly?",
          answer:
            "Because a short option profits when it expires out of the money (worthless), which is the opposite condition from what delta itself measures. 1 minus |delta| approximates that opposite probability.",
        },
        {
          question: "Does yfinance or a broker provide probability of profit directly?",
          answer:
            "Not usually as a raw data field -- most retail tools, including this one, compute it themselves from delta, which itself is usually computed locally rather than pulled from a data feed.",
        },
      ]}
      related={[
        { href: "/learn/options-greeks-explained", label: "Options Greeks explained" },
        { href: "/learn/iv-percentile-vs-iv-rank", label: "IV percentile vs. IV rank" },
        { href: "/learn/glossary", label: "Glossary" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formula</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Short option (sold)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">1 − |delta|</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Long option (bought)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">|delta|</dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Why it's an approximation, not a fact</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Under the Black-Scholes model, the true probability a call finishes in the money is a value statisticians
          call N(d2). Delta is a different value, N(d1) -- mathematically related, but not identical. The two
          converge for short-dated, low-volatility options and diverge more for longer-dated or higher-volatility
          ones. Using delta as a probability-of-profit proxy is standard industry practice, not a flaw specific to
          any one tool, but it's an estimate layered on an estimate: the volatility that produces delta is itself
          usually a forecast, not a certainty.
        </p>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A worked example</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Position</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">Sell a cash-secured put, delta −0.30</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Probability of profit</td>
                <td className="py-2 text-[var(--text-secondary)]">1 − |−0.30| = 1 − 0.30 = 0.70, or about 70%</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Same delta, as a long put instead</td>
                <td className="py-2 text-[var(--text-secondary)]">|−0.30| = 0.30, or about 30%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Same option, same delta -- opposite side of the trade, opposite probability. Selling premium is
          structurally the higher-probability-of-profit side of most single-leg trades; the trade-off is a capped
          gain against a larger potential loss.
        </p>
      </section>
    </ReferenceArticle>
  );
}
