import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Covered Calls Explained — Turn Stock You Own Into Income";
const description =
  "How a covered call works, its real max profit and max loss, breakeven, and when it fits — with a worked example and honest risks.";
const leadAnswer =
  "A covered call combines ownership of 100 shares with the sale of one call option against them. The premium " +
  "collected produces income but caps the position's upside above the strike price. Maximum loss remains " +
  "substantial, not eliminated, because the underlying shares can still fall toward zero regardless of the premium received.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/covered-calls" },
  openGraph: { title, description, url: "/learn/covered-calls", type: "article" },
};

export default function CoveredCallsPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy guide"
      h1="Covered calls: turn shares you own into income"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/covered-calls"
      title={title}
      description={description}
      published="2026-09-01"
      updated="2026-09-02"
      breadcrumbLabel="Covered calls"
      risks={[
        "You give up everything above the strike -- a sharp rally caps your gain at exactly the same profit as a much smaller move to the strike.",
        "Maximum loss is substantial, not eliminated: the premium cushions a decline but does not protect against the shares falling most of the way to zero.",
        "Assignment can happen before expiration, especially close to a dividend date, leaving you without the shares (and without the ability to sell another call) sooner than planned.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Do I need to already own the shares?",
          answer: "Yes. A covered call specifically means selling a call against stock you already hold -- selling a call without owning the shares is a naked call, a very different, undefined-risk position.",
        },
        {
          question: "What happens on assignment?",
          answer: "Your shares are sold at the strike price, and you keep the premium already collected. You no longer own the stock, and you're free to buy it back or move on.",
        },
        {
          question: "Can I roll the call instead of letting it get assigned?",
          answer: "Yes -- closing the current call and selling a new one, usually at a later expiration or different strike, is common practice for continuing to collect premium without the shares being called away.",
        },
      ]}
      related={[
        { href: "/learn/cash-secured-puts", label: "Cash-secured puts" },
        { href: "/learn/covered-call-vs-cash-secured-put", label: "Covered call vs. cash-secured put" },
        { href: "/learn/protective-collars", label: "Protective collars" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The mechanics</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          You need 100 shares (or a multiple of 100) of the underlying stock. You sell one call option per 100
          shares, above the current price. You collect the premium immediately. Two things can happen by expiration:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Stock stays below the strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              The call expires worthless. You keep the shares and the premium. You can sell another call the next
              cycle — this is what makes it a repeatable income strategy.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Stock rises above the strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Your shares get &ldquo;called away&rdquo; — sold at the strike price. You keep the premium and the
              gain up to the strike, but miss out on anything above it.
            </p>
          </div>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The numbers, precisely</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Strike − cost basis) × 100, plus the premium collected. You give up everything above the strike.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss (substantial, not capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The stock going to $0, minus the premium you collected. The premium only cushions the fall — this is
              still full downside stock ownership.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Cost basis − premium per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Neutral to mildly bullish — you&apos;re fine with the stock going nowhere or up a little, not with a
              sharp rally past your strike.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A worked example</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Illustrative numbers, not live quotes — for that, see the{" "}
          <a href="/ideas" className="text-[var(--text-accent)] underline underline-offset-2">
            ideas
          </a>{" "}
          page, which prices covered calls from a real, current option chain.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You own</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">100 shares at $100 cost basis</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $110 call for $3.00 premium</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $108</td>
                <td className="py-2 text-[var(--text-secondary)]">Call expires worthless. You keep $300 and the shares.</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $130</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Shares called away at $110. Profit capped at $1,300 ($1,000 stock gain + $300 premium) — you miss
                  the extra $2,000 the stock actually moved.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $70</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Call expires worthless, but the shares are down $3,000. Premium only offsets $300 of that.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">When it fits, and when it doesn&apos;t</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[rgba(18,183,106,0.35)] bg-[rgba(18,183,106,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#5fd897]">Fits</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You already own the shares, don&apos;t expect a big near-term rally, and want to generate income while
              you wait.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(240,68,56,0.35)] bg-[rgba(240,68,56,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#f79a92]">Doesn&apos;t fit</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You expect the stock to run hard (you&apos;ll cap your own upside), or you can&apos;t stomach owning
              100 shares through a real decline — the call doesn&apos;t protect you from that.
            </p>
          </div>
        </div>
      </section>
    </ReferenceArticle>
  );
}
