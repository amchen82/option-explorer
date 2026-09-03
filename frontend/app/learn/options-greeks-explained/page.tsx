import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Options Greeks Explained: Delta, Gamma, Theta, Vega";
const description =
  "What each options Greek actually measures, in plain language and dollar terms, with a worked example of reading a position's net Greeks.";
const leadAnswer =
  "The options Greeks are a set of numbers that describe how an option's price is expected to change: delta " +
  "measures sensitivity to the stock price, gamma measures how delta itself changes, theta measures the daily " +
  "cost of time passing, and vega measures sensitivity to implied volatility. Together they describe an option position's real-time exposure, not just its price.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/options-greeks-explained" },
  openGraph: { title, description, url: "/learn/options-greeks-explained", type: "article" },
};

export default function OptionsGreeksExplainedPage() {
  return (
    <ReferenceArticle
      eyebrow="The Greeks"
      h1="Options Greeks explained"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/options-greeks-explained"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Options Greeks explained"
      risks={[
        "The Greeks are all computed from a pricing model, which itself depends on an implied volatility input -- if that input is stale or estimated rather than a real live quote, every Greek derived from it inherits that uncertainty.",
        "They describe instantaneous, small-move sensitivity. A large, fast move in the stock changes gamma and vega exposure too, so a position's Greeks after a big move can look very different from before it.",
        "Delta and gamma assume all other things stay equal -- in practice, implied volatility and time both move alongside the stock price, not independently of it.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "What is rho, and why isn't it discussed as often?",
          answer:
            "Rho measures sensitivity to interest rates. It matters most for long-dated options; for the shorter-dated contracts most retail traders use, its dollar impact is usually small next to delta, theta, and vega.",
        },
        {
          question: "Do the Greeks come directly from a broker's data feed?",
          answer:
            "Not always. Options market data itself (bid, ask, volume, open interest) is real-time. The Greeks are frequently computed by whichever platform is displaying them, from a pricing model fed by that market data -- as this app does.",
        },
        {
          question: "Which Greek matters most for a beginner to understand first?",
          answer:
            "Delta -- it's the most intuitive (roughly, 'how many shares does this behave like') and the one most other tools, including probability-of-profit estimates, are built on top of.",
        },
      ]}
      related={[
        { href: "/learn/theta-decay-examples", label: "Theta decay examples" },
        { href: "/learn/probability-of-profit", label: "Probability of profit" },
        { href: "/learn/glossary", label: "Glossary" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The four Greeks, plainly</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Greek</th>
                <th className="py-2 pr-4 font-medium">Measures</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Rough share equivalent</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Delta</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Dollar change per $1 move in the stock
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">A 0.40 delta call ≈ 40 shares</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Gamma</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  How fast delta itself changes as the stock moves
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Acceleration of the delta above</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Theta</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Dollar cost (or gain) per day from time passing alone
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">No share equivalent</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Vega</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Dollar change per 1-point move in implied volatility
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">No share equivalent</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reading a position's net Greeks</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          A multi-leg position's Greeks are just the sum of each leg's Greeks, signed for whether that leg was
          bought or sold. Example: a bull call spread, long one $100 call (delta 0.55) and short one $110 call
          (delta 0.30).
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Long $100 call</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">+0.55 delta</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Short $110 call</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">−0.30 delta</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Net position delta</td>
                <td className="py-2 text-[var(--text-secondary)]">0.55 − 0.30 = 0.25 (≈ 25 shares of upside exposure)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          The short call doesn't just cap profit at expiration -- it also reduces the position's day-to-day directional
          exposure the whole time the trade is open, which is why the spread moves less than the long call alone as
          the stock moves.
        </p>
      </section>
    </ReferenceArticle>
  );
}
