import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "IV Percentile vs. IV Rank: What's the Difference?";
const description =
  "IV rank and IV percentile both describe today's implied volatility relative to its own history -- but they measure different things and can disagree sharply.";
const leadAnswer =
  "IV rank measures where today's implied volatility sits between its own 52-week low and high, as a percentage " +
  "of that range. IV percentile measures the percentage of trading days in the same period where implied " +
  "volatility was lower than it is today. Rank only looks at the two extremes; percentile looks at the entire distribution, so a single outlier day skews rank far more than it skews percentile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/iv-percentile-vs-iv-rank" },
  openGraph: { title, description, url: "/learn/iv-percentile-vs-iv-rank", type: "article" },
};

export default function IvPercentileVsIvRankPage() {
  return (
    <ReferenceArticle
      eyebrow="How it's calculated"
      h1="IV percentile vs. IV rank"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/iv-percentile-vs-iv-rank"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="IV percentile vs. IV rank"
      risks={[
        "Both metrics need real historical IV data to mean what they claim. Free data sources often don't provide a genuine historical IV time series, so tools sometimes approximate using realized (historical) price volatility instead -- worth knowing which one a specific number actually reflects.",
        "A wide 52-week range (common after a single volatility spike, like an earnings surprise or a market shock) can make IV rank misleadingly low for months afterward, even while the stock's options are genuinely pricier than normal.",
        "Neither metric says anything about direction -- a high reading means options are relatively expensive to buy and rich to sell, not that the stock is about to move a particular way.",
      ]}
      references={["Cboe Options Institute", "The Options Industry Council"]}
      faq={[
        {
          question: "Which one should I use?",
          answer:
            "Percentile is generally the more robust of the two, since it isn't distorted by a single extreme day the way rank's min/max range can be. Rank is simpler to compute and more commonly shown, which is why both remain in use.",
        },
        {
          question: "Can IV rank and IV percentile disagree?",
          answer:
            "Yes, often sharply. A stock that spent most of the year calm with one brief volatility spike can show a low IV rank (today looks unremarkable against that one extreme high) while still showing a high IV percentile (today is still above most individual days).",
        },
        {
          question: "Is either one the same as implied volatility itself?",
          answer:
            "No. Implied volatility is a single number -- the market's current forecast for how much the stock will move. Rank and percentile both describe where that number sits relative to its own history, not the number itself.",
        },
      ]}
      related={[
        { href: "/learn/probability-of-profit", label: "Probability of profit" },
        { href: "/learn/theta-decay-examples", label: "Theta decay examples" },
        { href: "/learn/glossary", label: "Glossary" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formulas</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">IV rank</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Current IV − 52-week low IV) ÷ (52-week high IV − 52-week low IV) × 100.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">IV percentile</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Number of days in the period with IV below today's) ÷ (total days) × 100.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          A case where they sharply disagree
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Imagine a stock whose IV sat quietly between 25% and 35% for eleven months, then spiked to 90% for one
          week around an acquisition rumor before settling back to 35% today.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">52-week low / high</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">25% / 90%</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Today's IV</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">35%</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">IV rank</td>
                <td className="py-2 text-[var(--text-secondary)]">(35 − 25) ÷ (90 − 25) × 100 ≈ 15 — looks low</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">IV percentile</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Roughly 60-70% of days were below 35% (most of the year sat under it) — looks moderately elevated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          One outlier week drags IV rank down for the rest of the year. IV percentile barely notices it, because it
          weighs every day equally rather than just the single highest one.
        </p>
      </section>
    </ReferenceArticle>
  );
}
