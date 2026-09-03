import type { MetadataRoute } from "next";

// Explicit per-crawler groups instead of relying solely on the wildcard, so
// each AI/search crawler's access is a deliberate, visible statement rather
// than an implicit side effect of "User-agent: *". All currently allow the
// same thing the wildcard already did; this is about clarity, not narrowing
// access -- add a genuine restriction here (not just to the wildcard) if one
// of these should ever be treated differently.
const NAMED_CRAWLERS = [
  "Googlebot",
  "Google-Extended",
  "OAI-SearchBot",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...NAMED_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://www.option-ideas.com/sitemap.xml",
  };
}
