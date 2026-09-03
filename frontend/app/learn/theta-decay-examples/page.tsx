import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Theta Decay Examples: How Time Value Erodes as Expiration Nears";
const description =
  "What theta actually measures, worked dollar examples at different days to expiration, and why decay accelerates as an option gets closer to expiring.";
const leadAnswer =
  "Theta measures how much an option's value erodes per day from time passing alone, holding the stock price and " +
  "volatility constant. It is usually a small negative number for a long option and the same size positive number " +
  "for the short side. Theta is not constant -- it accelerates as expiration approaches, so a 30-day option decays much faster in its final week than an option with 90 days left.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/theta-decay-examples" },
  openGraph: { title, description, url: "/learn/theta-decay-examples", type: "article" },
};

export default function ThetaDecayExamplesPage() {
  return (
    <ReferenceArticle
      eyebrow="The Greeks"
      h1="Theta decay examples"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/theta-decay-examples"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Theta decay examples"
      risks={[
        "The dollar figures below hold the stock price and implied volatility fixed to isolate time decay -- in reality, both move constantly and usually matter more day-to-day than theta alone.",
        "Theta is highest, in dollar terms, for at-the-money options. Deep in-the-money or far out-of-the-money options decay more slowly, since they have less time value left to lose.",
        "Selling for theta ('collecting rent') still carries the underlying risk of the position -- a short call or put's directional risk doesn't go away just because time decay is working in your favor.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Why does decay accelerate near expiration instead of being steady?",
          answer:
            "An option's time value is roughly proportional to the square root of the time remaining, not to time itself. That relationship means the same number of calendar days removes a larger share of the remaining value as expiration gets closer.",
        },
        {
          question: "Does theta ever help a long option holder?",
          answer:
            "Not directly -- theta always works against a long premium position, buyer's clock ticking against them. Only the seller of that same option benefits from the passage of time.",
        },
        {
          question: "Is theta the same every day until expiration?",
          answer: "No. It's recalculated continuously as time, the stock price, and implied volatility all change -- the figures below are a snapshot for one specific set of conditions, not a fixed schedule.",
        },
      ]}
      related={[
        { href: "/learn/options-greeks-explained", label: "Options Greeks explained" },
        { href: "/learn/choosing-an-expiration-date", label: "Choosing an expiration date" },
        { href: "/learn/covered-calls", label: "Covered calls" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Worked example: the same ATM call at different days to expiration
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Illustrative figures for a hypothetical $100 stock, $100 strike call, 30% implied volatility, holding the
          stock price and volatility fixed at each snapshot -- not a live quote.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Days to expiration</th>
                <th className="py-2 pr-4 font-medium">Approx. option value</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Approx. theta (per day)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">90</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$6.53</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">−$0.039 (−$3.94/contract)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">30</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$3.63</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">−$0.064 (−$6.38/contract)</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">7</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$1.70</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">−$0.125 (−$12.51/contract)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          The option lost $2.90 of value across the 60 days between the 90-day and 30-day marks. From 7 days to
          expiration, it's set to lose almost as much -- about $1.70 -- in that final week alone. Same option, same
          underlying pattern of decay, but a very different daily bill near the end.
        </p>
      </section>
    </ReferenceArticle>
  );
}
