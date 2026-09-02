import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Credit Spread Maximum Loss: The Formula, Explained With Numbers";
const description =
  "The exact formula for a credit spread's maximum loss -- strike width minus net credit -- with worked examples for both a bull put spread and a bear call spread.";
const leadAnswer =
  "A credit spread's maximum loss equals the distance between its two strikes, multiplied by 100 shares per " +
  "contract, minus the net credit collected. This is the same formula whether the position is a bull put spread " +
  "or a bear call spread, and it is fixed the moment the trade is opened, no matter how far the stock ultimately moves against it.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/credit-spread-max-loss" },
  openGraph: { title, description, url: "/learn/credit-spread-max-loss", type: "article" },
};

export default function CreditSpreadMaxLossPage() {
  return (
    <ReferenceArticle
      eyebrow="Formula reference"
      h1="Credit spread maximum loss: the formula"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/credit-spread-max-loss"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Credit spread maximum loss"
      risks={[
        "The maximum loss is the realistic worst case for the position, but it can still be a large multiple of the credit collected -- size the trade by what you could lose, not by what you collect.",
        "Early assignment on the short leg (especially near a dividend date, for calls) can disrupt the position before expiration, though the long leg still caps the eventual loss.",
        "This formula assumes both legs expire or are closed together. Closing only one leg early turns a defined-risk position into an undefined-risk one.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Does the formula change between a bull put spread and a bear call spread?",
          answer:
            "No. Both are credit spreads with the same shape: sell the strike closer to the stock price, buy a further strike as protection. Width minus credit is the max loss either way.",
        },
        {
          question: "Why is capital required usually shown as equal to the max loss?",
          answer:
            "Because a defined-risk credit spread's broker margin requirement is typically set at the worst case the position can produce -- the same number as its maximum loss.",
        },
        {
          question: "What's the maximum profit on a credit spread?",
          answer: "The net credit received, in full, if both legs expire worthless (or are closed at zero).",
        },
      ]}
      related={[
        { href: "/learn/bull-call-spread", label: "Bull call spread" },
        { href: "/learn/bear-put-spread", label: "Bear put spread" },
        { href: "/learn/iron-condor-breakeven", label: "Iron condor breakeven" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formula</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Strike width × 100) − net credit received.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">The net credit received, in full.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Strike width</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The dollar distance between the short strike and the long strike.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Capital required</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Equal to the max loss -- that's the number a broker holds as margin for a defined-risk credit spread.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Worked example: a bull put spread</h2>
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
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $95 put for $2.50</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Buy</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $90 put for $1.00 — net credit $1.50 ($150)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Width</td>
                <td className="py-2 text-[var(--text-secondary)]">$5 × 100 = $500</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max loss</td>
                <td className="py-2 text-[var(--text-secondary)]">$500 − $150 = $350, if the stock closes at or below $90</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max profit</td>
                <td className="py-2 text-[var(--text-secondary)]">$150, if the stock closes at or above $95</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Breakeven</td>
                <td className="py-2 text-[var(--text-secondary)]">$95 − $1.50 = $93.50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
