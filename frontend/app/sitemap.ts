import type { MetadataRoute } from "next";

const BASE_URL = "https://www.option-ideas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/ideas", "/tutorial", "/how-to", "/faq", "/about"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
