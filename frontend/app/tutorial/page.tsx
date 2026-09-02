import type { Metadata } from "next";
import Link from "next/link";

const pageTitle = "Options Trading Tutorial for Beginners";
const pageDescription = "A beginner's blueprint for options: core vocabulary, moneyness, time decay, and the four foundational strategies, with a comparison matrix.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/tutorial" },
  openGraph: { title: pageTitle, description: pageDescription, url: "/tutorial", type: "website" },
};

const vocabulary = [
  {
    term: "Premium",
    definition: "The price a buyer pays (and a seller receives) for the option contract.",
    insight: "“Cost of admission” for the buyer; maximum profit potential for the seller.",
  },
  {
    term: "Strike price",
    definition: "The stated price per share at which the stock may be bought or sold upon exercise.",
    insight: "Your “execution target.” Determines when the contract gains or loses intrinsic value.",
  },
  {
    term: "Expiration date",
    definition: "The fixed date when the option contract becomes void and ceases to exist.",
    insight: "The “timer.” Options are wasting assets; if your thesis doesn’t materialize by this date, the contract expires worthless.",
  },
];

const moneyness = [
  { status: "In-the-money (ITM)", call: "Stock price above strike price", put: "Stock price below strike price" },
  { status: "At-the-money (ATM)", call: "Stock price equals strike price", put: "Stock price equals strike price" },
  { status: "Out-of-the-money (OTM)", call: "Stock price below strike price", put: "Stock price above strike price" },
];

type Level = "NOVICE" | "INTERMEDIATE" | "ADVANCED";

const levelStyles: Record<Level, string> = {
  NOVICE: "border-[rgba(18,183,106,0.4)] bg-[rgba(18,183,106,0.12)] text-[#5fd897]",
  INTERMEDIATE: "border-[rgba(76,141,255,0.4)] bg-[rgba(76,141,255,0.12)] text-[#8fb4ff]",
  ADVANCED: "border-[rgba(240,68,56,0.4)] bg-[rgba(240,68,56,0.12)] text-[#f79a92]",
};

const strategies: {
  name: string;
  level: Level;
  bias: string;
  goal: string;
  maxRisk: string;
  maxReward: string;
  theta: string;
  tip: string;
}[] = [
  {
    name: "Long Call",
    level: "NOVICE",
    bias: "Bullish — expecting the stock to rise",
    goal: "Capital gain through leverage",
    maxRisk: "Capped — limited to the premium paid",
    maxReward: "Uncapped — profit grows as stock rises",
    theta: "Hurts position (time decay works against the buyer)",
    tip: "Avoid cheap short-term options. Give your trade 3–6 months to be right.",
  },
  {
    name: "Short Call (Naked)",
    level: "ADVANCED",
    bias: "Bearish or neutral — expecting the stock to fall or stay flat",
    goal: "Income generation — collecting the premium",
    maxRisk: "Uncapped — a stock can theoretically rise to infinity",
    maxReward: "Capped — limited to the premium received",
    theta: "Helps position (time decay works for the seller)",
    tip: "Structurally dangerous as a standalone trade. Rarely recommended for beginners.",
  },
  {
    name: "Long Put",
    level: "NOVICE",
    bias: "Bearish — expecting the stock to fall",
    goal: "Capital gain from a decline, or portfolio protection",
    maxRisk: "Capped — limited to the premium paid",
    maxReward: "Substantial — limited only by the stock reaching zero",
    theta: "Hurts position (time decay works against the buyer)",
    tip: "Often superior to “shorting” a stock. Your maximum loss is strictly limited to the premium.",
  },
  {
    name: "Short Put (Naked)",
    level: "INTERMEDIATE",
    bias: "Bullish or neutral — expecting the stock to rise or stabilize",
    goal: "Income generation or acquiring stock at a lower cost basis",
    maxRisk: "Substantial — capped only by the stock falling to zero",
    maxReward: "Capped — limited to the premium received",
    theta: "Helps position (time decay works for the seller)",
    tip: "Only sell puts on high-quality stocks you would happily own at the strike price.",
  },
];

const matrix = [
  { strategy: "Long Call", bias: "Bullish", goal: "Capital gain", maxRisk: "Capped (premium)", maxReward: "Uncapped", theta: "Hurts" },
  { strategy: "Short Call", bias: "Bearish/Neutral", goal: "Income", maxRisk: "Uncapped", maxReward: "Capped (premium)", theta: "Helps" },
  { strategy: "Long Put", bias: "Bearish", goal: "Capital gain", maxRisk: "Capped (premium)", maxReward: "Substantial*", theta: "Hurts" },
  { strategy: "Short Put", bias: "Bullish/Neutral", goal: "Income", maxRisk: "Substantial*", maxReward: "Capped (premium)", theta: "Helps" },
];

const proficiency = [
  {
    level: "Novice",
    strategies: "Long calls, long puts, covered calls",
    objective: "Understand how stock movement interacts with premium",
  },
  {
    level: "Intermediate",
    strategies: "Bull put / bear call spreads, iron butterflies, iron condors, short puts",
    objective: "Define risk on both sides; begin income-generation strategies",
  },
  {
    level: "Advanced",
    strategies: "Naked calls, short iron condors, backspreads",
    objective: "High-leverage architectures requiring deep risk management discipline",
  },
];

export default function TutorialPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">Options fundamentals</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          A beginner&apos;s blueprint for options
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          An option is a financial contract representing 100 shares of an underlying stock. Options are
          derivatives — instruments whose value is structured upon the price movement of the underlying asset.
          While often viewed as complex, they are the primary building blocks, or &ldquo;legs,&rdquo; used to
          construct the sophisticated strategies employed by professional traders to navigate any market
          condition.
        </p>
      </header>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Why trade options?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Leverage (asset control)</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Control 100 shares of stock for a fraction of their full cost. Achieve significantly higher
              percentage returns while keeping capital liquid for other opportunities.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Income generation</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              As a &ldquo;net seller&rdquo; of options, collect premiums on a regular basis — profiting from
              sideways markets where traditional stock positions would stagnate.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Risk reduction</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Structure options as insurance (protective puts) to hedge against portfolio declines. Define your
              maximum potential loss in advance, providing a safety net during high volatility.
            </p>
          </div>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">The core vocabulary</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Every options trade is supported by three essential pillars that define the &ldquo;risk picture&rdquo;
          you are drawing:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--tv-border)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="py-2 pr-4 font-medium">Key term</th>
                <th className="py-2 pr-4 font-medium">Definition</th>
                <th className="py-2 font-medium">Learner insight</th>
              </tr>
            </thead>
            <tbody>
              {vocabulary.map((row) => (
                <tr key={row.term} className="border-b border-[var(--tv-border)] last:border-0">
                  <td className="py-3 pr-4 align-top font-medium text-[var(--text-primary)]">{row.term}</td>
                  <td className="py-3 pr-4 align-top leading-6 text-[var(--text-secondary)]">{row.definition}</td>
                  <td className="py-3 align-top leading-6 text-[var(--text-secondary)]">{row.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Moneyness: navigating ITM, ATM, and OTM</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Moneyness describes the relationship between the strike price and the current market price. It is the
          primary indicator of whether an option has immediate intrinsic value.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Call option (stock vs. strike)</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Put option (stock vs. strike)</th>
              </tr>
            </thead>
            <tbody>
              {moneyness.map((row) => (
                <tr key={row.status} className="border-b border-[var(--tv-border)] last:border-0">
                  <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">{row.status}</td>
                  <td className="py-3 pr-4 align-top leading-6 text-[var(--text-secondary)]">{row.call}</td>
                  <td className="py-3 pr-3 align-top leading-6 text-[var(--text-secondary)]">{row.put}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm italic leading-6 text-[var(--text-tertiary)]">
          Moneyness provides a snapshot of value today, but it is constantly being eroded by the invisible force
          of time.
        </p>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          The &ldquo;Rule of the Opposites&rdquo;: mastering time decay
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          In options education, the Rule of the Opposites states: if a factor hurts the buyer, it must help the
          seller, and vice versa. Time decay (theta) is the most prominent example of this rule in action.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Buyer (long)</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Time decay is a &ldquo;burning fuse.&rdquo; Every passing day erodes the time value of the option.
              The buyer needs the stock to move quickly before the fuse runs out.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Seller (short)</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Time decay is like &ldquo;collecting rent.&rdquo; As the fuse burns, the value of the option the
              seller &ldquo;rented out&rdquo; decreases — they keep the premium as profit.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-4 py-3 text-sm leading-6 text-[#f1c27a]">
          <span className="font-medium">Pro rule:</span> Buy options with 3+ months to expiration to slow the
          burning fuse. Sell options with 1 month or less to maximize time-decay speed in your favor.
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">The four foundational strategies</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            All complex trading architectures are constructed using one or more of these four directions.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {strategies.map((strategy) => (
            <article key={strategy.name} className="tv-panel rounded-xl">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{strategy.name}</h3>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${levelStyles[strategy.level]}`}
                >
                  {strategy.level}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-sm leading-6">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-[var(--text-tertiary)]">Market bias</dt>
                  <dd className="text-[var(--text-secondary)]">{strategy.bias}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-[var(--text-tertiary)]">Primary goal</dt>
                  <dd className="text-[var(--text-secondary)]">{strategy.goal}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-[var(--text-tertiary)]">Max risk</dt>
                  <dd className="text-[var(--text-secondary)]">{strategy.maxRisk}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-[var(--text-tertiary)]">Max reward</dt>
                  <dd className="text-[var(--text-secondary)]">{strategy.maxReward}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-[var(--text-tertiary)]">Theta impact</dt>
                  <dd className="text-[var(--text-secondary)]">{strategy.theta}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-[var(--tv-border)] pt-3 text-sm leading-6 text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">Pro tip: </span>
                {strategy.tip}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Strategy comparison matrix</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          This matrix summarizes the &ldquo;risk pictures&rdquo; of the four foundations to assist in rapid
          decision-making.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--tv-surface-2)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="rounded-l-md py-2 pl-3 pr-4 font-medium">Strategy</th>
                <th className="py-2 pr-4 font-medium">Directional bias</th>
                <th className="py-2 pr-4 font-medium">Primary goal</th>
                <th className="py-2 pr-4 font-medium">Max risk</th>
                <th className="py-2 pr-4 font-medium">Max reward</th>
                <th className="rounded-r-md py-2 pr-3 font-medium">Theta</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.strategy} className="border-b border-[var(--tv-border)] last:border-0">
                  <td className="py-3 pl-3 pr-4 align-top font-medium text-[var(--text-primary)]">{row.strategy}</td>
                  <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">{row.bias}</td>
                  <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">{row.goal}</td>
                  <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">{row.maxRisk}</td>
                  <td className="py-3 pr-4 align-top text-[var(--text-secondary)]">{row.maxReward}</td>
                  <td className="py-3 pr-3 align-top text-[var(--text-secondary)]">{row.theta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs italic text-[var(--text-tertiary)]">
          * Substantial risk/reward for puts is capped only by the stock reaching a price of zero.
        </p>
      </section>

      <section className="tv-panel rounded-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your path to proficiency</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          The fundamental trade-off of the options market is the choice between being the &ldquo;player&rdquo; or
          the &ldquo;house.&rdquo; Buying options offers the potential for uncapped gains but requires you to
          fight the burning fuse of time. Selling options allows you to collect steady rent as the house, but
          demands disciplined management of the risk of significant moves against you.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--tv-border)] text-left text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                <th className="py-2 pr-4 font-medium">Level</th>
                <th className="py-2 pr-4 font-medium">Strategies</th>
                <th className="py-2 font-medium">Key learning objective</th>
              </tr>
            </thead>
            <tbody>
              {proficiency.map((row) => (
                <tr key={row.level} className="border-b border-[var(--tv-border)] last:border-0">
                  <td className="py-3 pr-4 align-top font-medium text-[var(--text-primary)]">{row.level}</td>
                  <td className="py-3 pr-4 align-top leading-6 text-[var(--text-secondary)]">{row.strategies}</td>
                  <td className="py-3 align-top leading-6 text-[var(--text-secondary)]">{row.objective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm italic leading-6 text-[var(--text-secondary)]">
          Remember: the penny only drops when you stop looking at numbers and start seeing these concepts as
          pictures of risk and reward. Study each strategy&apos;s shape until it tells the whole story.
        </p>
      </section>

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-sm leading-6 text-[#f1c27a]">
        For educational purposes only. Options trading involves significant risk of loss, including the
        potential loss of the full premium paid and, for certain strategies, losses greater than the initial
        amount received. Consult a qualified financial advisor before trading.
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/how-to"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          How to use this app
        </Link>
        <Link
          href="/faq"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Read the FAQ
        </Link>
      </div>
    </div>
  );
}
