import { prisma } from "@/lib/db";

export type BrowseFilters = {
  q?: string;
  regions: string[];
  langs: string[];
  publisher?: string;
};

export const PAGE_SIZE = 30;

function pickPrimaryRevision<T extends { dataSource: string }>(revisions: T[]): T {
  return (
    revisions.find((r) => r.dataSource === "COMMUNITY_VERIFIED") ??
    revisions[0]
  );
}

// Region/language filters are applied as part of the WHERE clause (not
// post-fetch in JS) specifically so pagination stays correct — with ~2,000
// games in the catalog, loading everything and filtering/paginating in
// memory isn't viable (SQLite's bound-parameter limit was hit doing exactly
// that). languages is stored as a JSON-encoded string column rather than a
// native array, so language filtering uses a `contains` substring match on
// that JSON text — a pragmatic tradeoff for SQLite rather than a schema
// migration to a proper array/relation table.
export async function getBrowseGames(filters: BrowseFilters, page: number) {
  const revisionFilter = {
    isHidden: false,
    ...(filters.regions.length ? { regionFree: { in: filters.regions } } : {}),
    ...(filters.langs.length
      ? { AND: filters.langs.map((lang) => ({ languages: { contains: `"${lang}"` } })) }
      : {}),
  };

  const where = {
    title: filters.q ? { contains: filters.q } : undefined,
    publisher: filters.publisher || undefined,
    revisions: { some: revisionFilter },
  };

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      include: { revisions: { where: { isHidden: false }, orderBy: { createdAt: "asc" } } },
      orderBy: { title: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    games: games.map((game) => ({ ...game, primary: pickPrimaryRevision(game.revisions) })),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
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
        include: {
          votes: true,
          collectionEntries: true,
          submittedByUser: { select: { name: true } },
        },
      },
    },
  });
}
