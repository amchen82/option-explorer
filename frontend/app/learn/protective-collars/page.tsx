import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "Protective Collars Explained — Fence In Gains Without Paying Full Price";
const description =
  "How a protective collar works, its real max profit and max loss, breakeven, and when it fits — with a worked example and honest risks.";
const leadAnswer =
  "A protective collar combines ownership of 100 shares with a sold call above the price and a bought put below " +
  "it, usually financed by the call's premium. Both maximum profit and maximum loss are fixed the moment the " +
  "trade opens. It fences in an existing gain, trading away further upside for defined downside protection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/protective-collars" },
  openGraph: { title, description, url: "/learn/protective-collars", type: "article" },
};

export default function ProtectiveCollarsPage() {
  return (
    <ReferenceArticle
      eyebrow="Strategy guide"
      h1="Protective collars: fence in gains without paying full price for insurance"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/protective-collars"
      title={title}
      description={description}
      published="2026-09-01"
      updated="2026-09-02"
      breadcrumbLabel="Protective collars"
      risks={[
        "The call strike caps upside just like a plain covered call -- a strong rally past it still leaves the same gain on the table.",
        "Between the two strikes, a collar behaves like plain stock ownership plus a small net premium adjustment -- it doesn't add income the way a standalone covered call does over multiple cycles.",
        "Assignment on the short call can happen before expiration, especially near a dividend date, unwinding the structure sooner than planned.",
      ]}
      references={["The Options Clearing Corporation (OCC)", "Cboe Options Institute"]}
      faq={[
        {
          question: "Is a collar the same as a covered call plus a protective put?",
          answer: "Yes -- that's exactly what it is, opened as one combined position rather than two separate trades, usually sized so the call's premium offsets most or all of the put's cost.",
        },
        {
          question: "Why not just buy the put alone, without selling the call?",
          answer: "A standalone protective put costs full price and doesn't cap the upside. A collar is cheaper (sometimes a net credit) specifically because you're giving up gains above the call strike to help pay for it.",
        },
        {
          question: "Does the collar protect the original cost basis or today's price?",
          answer: "Whichever the put strike is set relative to -- the strikes are chosen independently of cost basis, so the actual floor is the put strike, adjusted by the net premium, not automatically today's price or the original purchase price.",
        },
      ]}
      related={[
        { href: "/learn/covered-calls", label: "Covered calls" },
        { href: "/learn/bear-put-spread", label: "Bear put spread" },
        { href: "/learn/defined-risk-vs-undefined-risk", label: "Defined-risk vs. undefined-risk" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The mechanics</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          You need 100 shares. You sell one call above the current price (collecting premium) and buy one put below
          the current price (paying premium) — usually sized so the call mostly or fully pays for the put. By
          expiration, the stock lands in one of three zones:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Above the call strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Shares called away at the call strike — your gain is capped there, same trade-off as a covered call.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Between the two strikes</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Both options expire worthless. You keep the shares, and simply own the stock (minus or plus whatever
              net premium the collar cost or paid you).
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Below the put strike</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              The put protects you — your loss stops at the put strike, no matter how much further the stock falls.
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
              (Call strike − cost basis) × 100, plus or minus the net premium. Fixed the moment you open the collar.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Max loss (capped)</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              (Put strike − cost basis) × 100, plus or minus the net premium. Also fixed the moment you open the
              collar — this is the whole point of the put leg.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Breakeven</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Cost basis, adjusted by the net premium (a net credit lowers it; a net debit raises it).
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-[var(--text-primary)]">Market view</dt>
            <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Neutral — you&apos;re not trying to squeeze more upside out of the stock, you&apos;re defending what
              it&apos;s already made you.
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
          page, which prices collars from a real, current option chain.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You own</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">100 shares, cost basis $80, now at $100</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You sell</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $110 call for $3.00</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">You buy</td>
                <td className="py-2 font-medium text-[var(--text-primary)]">1x $90 put for $2.50 — net $0.50 credit</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $130</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Called away at $110. Profit capped at $3,050 — the $2,000 stock gain to $110 was mostly locked in
                  well before this close.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[var(--text-tertiary)]">If stock closes at $50</td>
                <td className="py-2 text-[var(--text-secondary)]">
                  Put protects you at $90. Loss capped at $950, versus $3,000 for the shares alone.
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
              A stock you hold has already run up, you want to lock in most of the gain without selling outright, and
              you don&apos;t mind giving up further upside to get downside protection cheaply.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(240,68,56,0.35)] bg-[rgba(240,68,56,0.1)] p-4">
            <h3 className="text-sm font-medium text-[#f79a92]">Doesn&apos;t fit</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You still expect meaningful further upside — the call strike caps that exactly like a plain covered
              call would, and a full-price put alone would protect you without capping the top.
            </p>
          </div>
        </div>
      </section>
    </ReferenceArticle>
  );
}
