import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Covered Call vs. Cash-Secured Put: What's the Real Difference?";
const description =
  "Why a covered call and a cash-secured put at the same strike produce nearly identical payoffs, and the one real difference between them: what you already own.";
const leadAnswer =
  "A covered call and a cash-secured put are economically similar: both sell an option for premium, both cap the " +
  "maximum profit, and both carry substantial downside risk if the stock falls. The main difference is starting " +
  "position -- a covered call requires already owning 100 shares, while a cash-secured put requires cash set aside to buy them if assigned. Their payoff diagrams end up nearly identical.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/covered-call-vs-cash-secured-put" },
  openGraph: { title, description, url: "/learn/covered-call-vs-cash-secured-put", type: "article" },
};

export default function CoveredCallVsCashSecuredPutPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy comparison"
      h1="Covered call vs. cash-secured put"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/covered-call-vs-cash-secured-put"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Covered call vs. cash-secured put"
      risks={[
        "This near-equivalence assumes similar strikes and premiums; in practice, tax treatment (for a covered call on shares with unrealized gains) and margin requirements can differ meaningfully between the two even when the payoff shape looks the same.",
        "Both carry substantial downside risk if the stock falls -- the premium collected cushions a decline, it doesn't remove the risk of owning (or being assigned) the stock.",
        "Starting position matters for taxes and logistics even when payoff math matches: selling a covered call against shares can trigger a taxable event on assignment that a cash-secured put's assignment does not.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Why do they produce almost the same payoff?",
          answer:
            "It follows from put-call parity: at the same strike and expiration, a covered call (long stock, short call) and a cash-secured put (short put, cash reserved) are different combinations of the same underlying risk, priced by the same market.",
        },
        {
          question: "So which one should I use?",
          answer:
            "It depends on what you already have. If you own the shares, a covered call monetizes them. If you don't and would be happy to acquire them at a lower price, a cash-secured put gets you paid to wait for that price.",
        },
        {
          question: "Do they behave the same if the stock gaps down sharply?",
          answer:
            "Yes, in payoff terms -- both lose along with the stock below breakeven, cushioned only by the premium collected either way.",
        },
      ]}
      related={[
        { href: "/learn/covered-calls", label: "Covered calls" },
        { href: "/learn/cash-secured-puts", label: "Cash-secured puts" },
        { href: "/learn/defined-risk-vs-undefined-risk", label: "Defined-risk vs. undefined-risk" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Same strike, same premium: nearly the same payoff
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Illustrative numbers, both at the $100 strike on a $100 stock, both collecting the same $4.00 premium.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Metric</th>
                <th className="py-2 pr-4 font-medium">Covered call (own 100 shares, sell $100 call)</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Cash-secured put (sell $100 put, hold $10,000)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Premium collected</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$400</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$400</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Max profit</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$400</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$400</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Max loss</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$9,600 (stock to $0)</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$9,600 (stock to $0)</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">Breakeven</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">$96</td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">$96</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Identical numbers, by construction -- the only real-world difference is what you start with: 100 shares
          already owned, or $10,000 in cash set aside to potentially buy them.
        </p>
      </section>
    </ReferenceArticle>
  );
}
