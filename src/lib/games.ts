import { prisma } from "@/lib/db";

export type BrowseFilters = {
  q?: string;
  regions: string[];
  langs: string[];
  publisher?: string;
};

export const SORT_VALUES = ["alphabetical", "recent", "disputed"] as const;
export type SortOption = (typeof SORT_VALUES)[number];

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
export async function getBrowseGames(
  filters: BrowseFilters,
  page: number,
  sort: SortOption = "alphabetical",
) {
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

  // "Most disputed" has no native column to order by — it's a count of
  // DISPUTE votes across a game's revisions — so this path ranks matching
  // games in memory rather than at the query level, then paginates the
  // resulting id list. Fine at this catalog's scale (~2,000 games); would
  // need a materialized dispute-count column if that ever changes.
  if (sort === "disputed") {
    const matching = await prisma.game.findMany({
      where,
      select: {
        id: true,
        revisions: {
          where: { isHidden: false },
          select: { votes: { where: { vote: "DISPUTE" }, select: { id: true } } },
        },
      },
    });

    const ranked = matching
      .map((g) => ({
        id: g.id,
        disputeCount: g.revisions.reduce((sum, r) => sum + r.votes.length, 0),
      }))
      .sort((a, b) => b.disputeCount - a.disputeCount);

    const total = ranked.length;
    const pageIds = ranked.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE).map((g) => g.id);

    const games = await prisma.game.findMany({
      where: { id: { in: pageIds } },
      include: { revisions: { where: { isHidden: false }, orderBy: { createdAt: "asc" } } },
    });
    const gamesById = new Map(games.map((g) => [g.id, g]));
    const ordered = pageIds.map((id) => gamesById.get(id)).filter((g) => g !== undefined);

    return {
      games: ordered.map((game) => ({ ...game, primary: pickPrimaryRevision(game.revisions) })),
      total,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  const orderBy = sort === "recent" ? { createdAt: "desc" as const } : { title: "asc" as const };

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      include: { revisions: { where: { isHidden: false }, orderBy: { createdAt: "asc" } } },
      orderBy,
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
