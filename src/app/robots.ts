import type { MetadataRoute } from "next";

const BASE_URL = "https://www.torashelf.com";

// AI training/scraping crawlers: they send no visitors and were a large share
// of the requests keeping the database awake. Search engines (Googlebot,
// Bingbot, etc.) are unaffected — Google-Extended and Applebot-Extended are
// opt-out tokens for AI training only, not the search crawlers.
const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "PerplexityBot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Personalized (/collection), a form rather than content (/submit),
        // and transient action pages tied to a specific in-progress
        // correction — none of these are meaningful for search. The query
        // patterns are browse sort/search/filter combinations: near-endless
        // duplicate listings of the same games, each needing a fresh
        // database query. Plain ?page=N stays crawlable.
        disallow: [
          "/collection",
          "/submit",
          "/games/*/correct/*",
          "/api/",
          "/*?*sort=",
          "/*?*q=",
          "/*?*region=",
          "/*?*lang=",
          "/*?*publisher=",
        ],
      },
      { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
