import Link from "next/link";

const faqs = [
  {
    question: "What does one options contract actually control?",
    answer:
      "A standard U.S. equity option contract represents 100 shares of the underlying stock. When you buy or sell one contract, you're controlling the rights (or obligation) tied to 100 shares—not one share.",
  },
  {
    question: "What happens if my option expires out-of-the-money (OTM)?",
    answer:
      "It expires worthless. A buyer loses the entire premium paid, which is also the maximum possible loss for a long option. A seller who was OTM at expiration keeps the full premium as profit, since the contract was never worth exercising.",
  },
  {
    question: "Why would I sell an option instead of buying one?",
    answer:
      "Buying options is a bet that the stock moves far enough, fast enough, to beat time decay—max loss is capped at the premium, but time decay works against you. Selling options collects premium up front and lets time decay work in your favor, at the cost of capped profit and (for naked positions) potentially large risk if the stock moves against you.",
  },
  {
    question: "What's the difference between novice, intermediate, and advanced strategies?",
    answer:
      "Novice strategies (long calls, long puts, covered calls) have simple, capped risk and teach how stock movement interacts with premium. Intermediate strategies (credit spreads, iron condors, short puts) define risk on both sides of a trade and introduce income generation. Advanced strategies (naked calls, short iron condors, backspreads) use higher leverage and require disciplined risk management, since losses can be substantial or uncapped.",
  },
  {
    question: "What is \"moneyness\" and why does it matter?",
    answer:
      "Moneyness describes where the stock price sits relative to an option's strike price: in-the-money (ITM), at-the-money (ATM), or out-of-the-money (OTM). It's the fastest way to tell whether an option has intrinsic value today, which affects both its price and how it will behave as expiration approaches.",
  },
  {
    question: "What is time decay (theta), and does it help or hurt me?",
    answer:
      "Time decay is the steady erosion of an option's time value as expiration approaches. It hurts option buyers (a \"burning fuse\" working against them) and helps option sellers (like \"collecting rent\" as the option they sold loses value). Decay accelerates in the final weeks before expiration.",
  },
  {
    question: "Should I buy short-term or long-term options?",
    answer:
      "As a buyer, longer-dated options (3+ months) give your thesis more time to play out and slow the effect of time decay. As a seller, shorter-dated options (1 month or less) decay faster, which works in your favor. There's no universal answer—it depends on your strategy and market outlook.",
  },
  {
    question: "Is selling a naked call or naked put safe for beginners?",
    answer:
      "No. A naked short call has theoretically uncapped risk if the stock keeps rising, and a naked short put has substantial risk if the stock falls toward zero. Both are generally considered advanced or intermediate strategies and are rarely recommended as a first options trade.",
  },
  {
    question: "Does Option Ideas place trades for me?",
    answer:
      "No. Option Ideas is an educational research tool. It turns a ticker's market data and option chain into comparable strategy examples with plain-language risk explanations—it does not connect to a broker, place orders, or provide personalized investment advice.",
  },
  {
    question: "What does \"modeled data\" mean on a strategy card?",
    answer:
      "It's a calculated estimate shown only when live option quotes are unavailable for that ticker or expiration. Always verify live quotes and contract specifications with a broker before making any decision.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2">
      <script
        type="application/ld+json"
        // JSON we generate ourselves from the static faqs array above, not user input;
        // still escape "<" so a literal "</script>" in an answer can't break out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="tv-panel rounded-xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-accent)]">FAQ</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Frequently asked questions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Common questions about options basics and how to use Option Ideas. For a deeper walkthrough, see the{" "}
          <Link href="/tutorial" className="text-[var(--text-accent)] underline underline-offset-2">
            tutorial
          </Link>
          .
        </p>
      </header>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <article key={faq.question} className="tv-panel rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{faq.question}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{faq.answer}</p>
          </article>
        ))}
      </section>

      <aside className="rounded-xl border border-[rgba(211,139,44,0.35)] bg-[rgba(211,139,44,0.12)] px-5 py-4 text-sm leading-6 text-[#f1c27a]">
        For educational purposes only. Options trading involves significant risk of loss. Consult a qualified
        financial advisor before trading.
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/how-to"
          className="inline-flex rounded-lg border border-[var(--text-accent)] bg-[rgba(76,141,255,0.18)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[rgba(76,141,255,0.28)]"
        >
          How to use this app
        </Link>
        <Link
          href="/ideas"
          className="tv-chip inline-flex rounded-lg px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
        >
          Explore option ideas
        </Link>
      </div>
    </div>
  );
}
