import { prisma } from "@/lib/db";

const LEADERBOARD_SIZE = 20;

export type LeaderboardEntry = {
  userId: string;
  name: string;
  count: number;
};

async function namesForUserIds(userIds: string[]): Promise<Map<string, string | null>> {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

// Ranks by verified submissions specifically (COMMUNITY_VERIFIED), not raw
// submission count — otherwise this would reward spamming low-quality
// entries over actually getting things right.
export async function getTopSubmitters(): Promise<LeaderboardEntry[]> {
  const grouped = await prisma.gameRevision.groupBy({
    by: ["submittedByUserId"],
    where: { submittedByUserId: { not: null }, dataSource: "COMMUNITY_VERIFIED" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: LEADERBOARD_SIZE,
  });

  const userIds = grouped.map((g) => g.submittedByUserId as string);
  const names = await namesForUserIds(userIds);

  return grouped.map((g) => ({
    userId: g.submittedByUserId as string,
    name: names.get(g.submittedByUserId as string) || "Anonymous",
    count: g._count.id,
  }));
}

// Counts every vote cast (confirm + dispute) — disputing bad data is just
// as much a contribution to accuracy as confirming good data.
export async function getTopVoters(): Promise<LeaderboardEntry[]> {
  const grouped = await prisma.submissionVote.groupBy({
    by: ["userId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: LEADERBOARD_SIZE,
  });

  const userIds = grouped.map((g) => g.userId);
  const names = await namesForUserIds(userIds);

  return grouped.map((g) => ({
    userId: g.userId,
    name: names.get(g.userId) || "Anonymous",
    count: g._count.id,
  }));
}
