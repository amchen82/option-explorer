import type { MetadataRoute } from "next";

const BASE_URL = "https://www.option-ideas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/ideas",
    "/tutorial",
    "/how-to",
    "/faq",
    "/about",
    "/learn",
    "/learn/covered-calls",
    "/learn/cash-secured-puts",
    "/learn/protective-collars",
    "/learn/glossary",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
