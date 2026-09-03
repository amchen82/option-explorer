import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Why Option Bid/Ask Spreads Matter";
const description =
  "What a bid/ask spread actually costs a trader, how to calculate spread as a percentage of mid price, and why it matters more for options than for stocks.";
const leadAnswer =
  "The bid/ask spread is the gap between what buyers are currently willing to pay and what sellers are currently " +
  "asking for an option contract. A wide spread means a trader gives up more value just entering and exiting the " +
  "position, since a market order typically fills closer to the worse side of that gap. Tighter spreads generally mean a more liquid, more fairly priced contract.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/bid-ask-spread" },
  openGraph: { title, description, url: "/learn/bid-ask-spread", type: "article" },
};

export default function BidAskSpreadPage() {
  return (
    <ReferenceArticle
      eyebrow="Reading the option chain"
      h1="Why bid/ask spreads matter"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/bid-ask-spread"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Bid/ask spread"
      risks={[
        "The 'mid' price used to judge a spread is a reference point, not a price anyone is guaranteed to actually get filled at.",
        "Wide spreads are common on options with low open interest and volume, and can widen further right when the market is moving fastest -- exactly when a trader might most want to act.",
        "A multi-leg strategy compounds this: each leg has its own spread, so the effective cost of entering a 4-leg position can be meaningfully worse than any single leg's spread suggests.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Why do options usually have wider spreads than the underlying stock?",
          answer:
            "A single stock has one order book. Each expiration and strike is its own separate, thinner market -- fewer participants trading any one specific contract means market makers typically demand a wider spread to compensate for the risk of holding it.",
        },
        {
          question: "What's considered a 'good' spread?",
          answer:
            "There's no universal number, but a spread under roughly 5-10% of the mid price is generally considered reasonably tight for a liquid underlying; anything well above that is worth noticing before trading it.",
        },
        {
          question: "Does a limit order fix the problem?",
          answer:
            "It controls the worst price you'll accept, but doesn't guarantee a fill -- on a wide-spread contract, a limit order priced near the mid may simply never execute.",
        },
      ]}
      related={[
        { href: "/learn/choosing-an-expiration-date", label: "Choosing an expiration date" },
        { href: "/learn/glossary", label: "Glossary" },
        { href: "/ideas", label: "See real option chains" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formula</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Mid price</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">(Bid + ask) ÷ 2.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Spread, as a percentage</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">(Ask − bid) ÷ mid price.</dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Two contracts, same underlying</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">A: bid $1.05 / ask $1.10</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Mid $1.075, spread $0.05 → 0.05 ÷ 1.075 ≈ 4.7% — tight, liquid
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">B: bid $1.00 / ask $1.20</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Mid $1.10, spread $0.20 → 0.20 ÷ 1.10 ≈ 18.2% — wide, thin
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Both contracts have the same $1.10-ish mid price. Trading contract B instead of A costs roughly four
          times as much of the position's value just to cross the spread once, before the stock has moved at all.
        </p>
      </section>
    </ReferenceArticle>
  );
}
