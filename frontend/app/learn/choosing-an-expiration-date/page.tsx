import type { Metadata } from "next";
import ReferenceArticle from "@/components/learn/ReferenceArticle";

const title = "How to Choose an Options Expiration Date";
const description =
  "How to weigh time decay against how much room a trade needs to work, for both buyers and sellers of options, with a table of common expiration ranges.";
const leadAnswer =
  "Choosing an expiration date means balancing time decay against how much room the trade needs to work. Buyers " +
  "generally want more time to reduce theta's drag and give a thesis room to develop; sellers generally want less " +
  "time so decay works faster in their favor. There is no single correct expiration -- it depends on the strategy and how confident the trade's timing is.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/choosing-an-expiration-date" },
  openGraph: { title, description, url: "/learn/choosing-an-expiration-date", type: "article" },
};

export default function ChoosingAnExpirationDatePage() {
  return (
    <ReferenceArticle
      eyebrow="How to"
      h1="How to choose an expiration date"
      leadAnswer={leadAnswer}
      canonicalPath="/learn/choosing-an-expiration-date"
      title={title}
      description={description}
      published="2026-09-02"
      updated="2026-09-02"
      breadcrumbLabel="Choosing an expiration date"
      risks={[
        "A longer expiration reduces the daily drag of theta, but ties up capital longer and increases exposure to events (earnings, macro data, general drift) between now and expiration.",
        "A shorter expiration decays faster for a seller, but leaves a buyer's thesis less room to develop if the move takes longer than expected.",
        "Very short-dated options (0-7 days) can have wide bid/ask spreads and thin open interest on all but the most heavily traded underlyings, which erodes the edge of trading them at all.",
      ]}
      references={["Cboe Options Institute", "The Options Industry Council"]}
      faq={[
        {
          question: "Is a longer-dated option always safer for a buyer?",
          answer:
            "Not automatically safer, but generally more forgiving -- it costs more upfront and has a higher breakeven in dollar terms, but the daily theta cost is smaller and the thesis has more time to play out.",
        },
        {
          question: "Why do premium sellers often prefer 30-45 days to expiration?",
          answer:
            "That window is commonly cited as sitting near where theta's acceleration curve starts to steepen meaningfully, while still leaving enough absolute premium in the option to make selling it worthwhile.",
        },
        {
          question: "Does this app pick an expiration for me?",
          answer:
            "You choose the target window (0 days out to over a year) on the ideas page, and the tool matches it to the closest expiration actually listed for that ticker's option chain.",
        },
      ]}
      related={[
        { href: "/learn/theta-decay-examples", label: "Theta decay examples" },
        { href: "/learn/bid-ask-spread", label: "Why bid/ask spreads matter" },
        { href: "/learn/comparing-option-strategies", label: "Comparing two strategies" },
      ]}
    >
      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Common expiration ranges and their typical use</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Range</th>
                <th className="py-2 pr-4 font-medium">Often used for</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Trade-off</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">0-2 weeks</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Selling premium fast, or a very specific near-term catalyst
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Fastest decay, least room for the thesis to be early</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">30-45 days</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  A common default for both premium selling and defined-risk spreads
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Balances decay speed against thesis room</td>
              </tr>
              <tr className="border-b border-[var(--tv-border)]">
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">3-6 months</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Buyers wanting a slower-developing thesis more room to work
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Higher upfront cost, slower daily decay</td>
              </tr>
              <tr>
                <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">12+ months (LEAPS)</td>
                <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">
                  Long-term directional or stock-replacement positions
                </td>
                <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">Highest cost, slowest decay, most room to be right eventually</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReferenceArticle>
  );
}
