import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Iron Condor Breakeven Formula, With a Worked Example";
const description =
  "How to calculate an iron condor's two breakeven prices, its max profit and max loss, with a full worked numerical example.";
const leadAnswer =
  "An iron condor has two breakeven prices, one above and one below the stock's starting range. The upper " +
  "breakeven equals the short call's strike plus the total credit received; the lower breakeven equals the short " +
  "put's strike minus the total credit received. The position profits only while the stock stays between these two prices at expiration.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/iron-condor-breakeven" },
  openGraph: { title, description, url: "/learn/iron-condor-breakeven", type: "article" },
};

export default function IronCondorBreakevenPage() {
  return (
    <ReferenceArticle
      eyebrow="Formula reference"
      h1="Iron condor breakeven: the formula"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/iron-condor-breakeven"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Iron condor breakeven"
      risks={[
        "Four legs means four commissions (where applicable) and four bid/ask spreads to cross -- the edge from selling premium can be eaten by transaction costs on a small position.",
        "A sharp move in either direction breaches one side fully; the position does not benefit from picking the 'right' direction, since it profits from the stock going nowhere.",
        "This formula assumes both spreads are the same width. If they aren't, the true max loss is the wider spread's width times 100, minus the total credit -- not simply width times 100.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "What is an iron condor, exactly?",
          answer:
            "A bear call spread and a bull put spread opened at the same time on the same underlying and expiration -- selling premium on both the upside and the downside, betting the stock stays in a range.",
        },
        {
          question: "Why are there two breakeven prices instead of one?",
          answer:
            "Because the position can lose money in two different directions -- a big enough rally breaches the call side, a big enough decline breaches the put side. Each has its own breakeven.",
        },
        {
          question: "How is max loss different from a single credit spread's max loss?",
          answer:
            "It isn't, in the case that matters: only one side can be breached at expiration (the stock can't finish both above and below its range), so the max loss is the same width-minus-credit formula as a single credit spread, applied to whichever side is wider.",
        },
      ]}
      related={[
        { href: "/learn/credit-spread-max-loss", label: "Credit spread max loss" },
        { href: "/learn/bull-call-spread", label: "Bull call spread" },
        { href: "/learn/bear-put-spread", label: "Bear put spread" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The formulas</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Upper breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Short call strike + total net credit per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Lower breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Short put strike − total net credit per share.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max profit</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The total net credit received, if the stock closes between the two short strikes.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Width of the breached spread × 100) − total net credit.
            </dd>
          </div>
        </dl>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A worked example</h2>
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
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Put side</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">Sell $90 put $1.50 / buy $85 put $0.75 — credit $0.75</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Call side</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">Sell $110 call $1.50 / buy $115 call $0.75 — credit $0.75</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Total credit</td>
                <td className="py-2 text-[var(--text-secondary)]">$0.75 + $0.75 = $1.50 ($150)</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Width (each side)</td>
                <td className="py-2 text-[var(--text-secondary)]">$5 × 100 = $500</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max profit</td>
                <td className="py-2 text-[var(--text-secondary)]">$150, if the stock closes between $90 and $110</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Max loss</td>
                <td className="py-2 text-[var(--text-secondary)]">$500 − $150 = $350, on either side</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Upper breakeven</td>
                <td className="py-2 text-[var(--text-secondary)]">$110 + $1.50 = $111.50</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">Lower breakeven</td>
                <td className="py-2 text-[var(--text-secondary)]">$90 − $1.50 = $88.50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
