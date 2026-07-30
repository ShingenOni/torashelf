import { prisma } from "@/lib/db";
import { parseLanguages } from "@/lib/enums";

export type BrowseFilters = {
  q?: string;
  regions: string[];
  langs: string[];
  publisher?: string;
};

function pickPrimaryRevision<T extends { dataSource: string }>(revisions: T[]): T {
  return (
    revisions.find((r) => r.dataSource === "COMMUNITY_VERIFIED") ??
    revisions[0]
  );
}

export async function getBrowseGames(filters: BrowseFilters) {
  const games = await prisma.game.findMany({
    where: {
      title: filters.q ? { contains: filters.q } : undefined,
      publisher: filters.publisher || undefined,
    },
    include: { revisions: { where: { isHidden: false }, orderBy: { createdAt: "asc" } } },
    orderBy: { title: "asc" },
  });

  return games
    .filter((game) => game.revisions.length > 0)
    .filter((game) => {
      if (!filters.regions.length && !filters.langs.length) return true;
      return game.revisions.some((r) => {
        const regionOk = !filters.regions.length || filters.regions.includes(r.regionFree);
        const langs = parseLanguages(r.languages);
        const langOk = !filters.langs.length || filters.langs.every((l) => langs.includes(l));
        return regionOk && langOk;
      });
    })
    .map((game) => ({ ...game, primary: pickPrimaryRevision(game.revisions) }));
}

export async function getPublishers() {
  const rows = await prisma.game.findMany({
    select: { publisher: true },
    distinct: ["publisher"],
    orderBy: { publisher: "asc" },
  });
  return rows.map((r) => r.publisher);
}

export async function getGameWithRevisions(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      revisions: {
        where: { isHidden: false },
        orderBy: { createdAt: "asc" },
        include: { votes: true, collectionEntries: true },
      },
    },
  });
}
