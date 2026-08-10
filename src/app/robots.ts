import type { MetadataRoute } from "next";

const BASE_URL = "https://www.torashelf.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personalized (/collection), a form rather than content (/submit),
      // and transient action pages tied to a specific in-progress
      // correction — none of these are meaningful for search.
      disallow: ["/collection", "/submit", "/games/*/correct/*"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
