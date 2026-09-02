import type { MetadataRoute } from "next";

const BASE_URL = "https://www.option-ideas.com";

// lastModified is a signal Google uses to decide whether to recrawl a page --
// it must reflect a genuine, significant content update, or Google stops
// trusting it. Two rules:
//   1. Set it to the real date content last meaningfully changed, as a fixed
//      literal string. Never `new Date()` -- that stamps every URL with
//      "whenever the build ran," which is deploy time, not content time, and
//      it changes on every redeploy even when nothing on the page did.
//   2. Omit it entirely for a route with no fixed content to date (a redirect,
//      or a page whose actual content is live/dynamic and never "settles").
// When you make a real content change to one of the dated routes below,
// update its date to match -- and only that one.
const routes: { path: string; lastModified?: string }[] = [
  // "/" is a client-side redirect to "/ideas" with no content of its own.
  { path: "/" },
  // "/ideas" renders live market data -- there is no fixed content state to
  // date; its own last-updated date would be misleading either way.
  { path: "/ideas" },
  { path: "/tutorial", lastModified: "2026-09-02" },
  { path: "/how-to", lastModified: "2026-09-02" },
  { path: "/faq", lastModified: "2026-09-02" },
  { path: "/about", lastModified: "2026-09-02" },
  { path: "/learn", lastModified: "2026-09-02" },
  { path: "/learn/covered-calls", lastModified: "2026-09-02" },
  { path: "/learn/cash-secured-puts", lastModified: "2026-09-02" },
  { path: "/learn/protective-collars", lastModified: "2026-09-02" },
  { path: "/learn/bull-call-spread", lastModified: "2026-09-02" },
  { path: "/learn/bear-put-spread", lastModified: "2026-09-02" },
  { path: "/learn/credit-spread-max-loss", lastModified: "2026-09-02" },
  { path: "/learn/iron-condor-breakeven", lastModified: "2026-09-02" },
  { path: "/learn/probability-of-profit", lastModified: "2026-09-02" },
  { path: "/learn/bid-ask-spread", lastModified: "2026-09-02" },
  { path: "/learn/options-greeks-explained", lastModified: "2026-09-02" },
  { path: "/learn/theta-decay-examples", lastModified: "2026-09-02" },
  { path: "/learn/iv-percentile-vs-iv-rank", lastModified: "2026-09-02" },
  { path: "/learn/defined-risk-vs-undefined-risk", lastModified: "2026-09-02" },
  { path: "/learn/choosing-an-expiration-date", lastModified: "2026-09-02" },
  { path: "/learn/comparing-option-strategies", lastModified: "2026-09-02" },
  { path: "/learn/covered-call-vs-cash-secured-put", lastModified: "2026-09-02" },
  { path: "/learn/glossary", lastModified: "2026-09-02" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    ...(route.lastModified ? { lastModified: route.lastModified } : {}),
  }));
}
