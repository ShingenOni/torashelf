import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = "https://www.torashelf.com";

// Every game page is included — for a database site, the individual print
// pages are the actual content people search for, not just the browse page.
// Well under Google's 50,000-URL-per-sitemap limit, so no need to split.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await prisma.game.findMany({
    select: { id: true, updatedAt: true },
  });

  const gameUrls: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${BASE_URL}/games/${game.id}`,
    lastModified: game.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/recent`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/support`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [...staticUrls, ...gameUrls];
}
