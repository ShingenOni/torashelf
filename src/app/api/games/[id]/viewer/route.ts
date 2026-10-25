import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

// The signed-in user's own votes and collection statuses for one game.
// Split out of the game page so that page can be cached and shared by
// everyone. With no session cookie this returns without a database query.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const headers = { "Cache-Control": "private, no-store" };

  if (!userId) {
    return Response.json({ signedIn: false, votes: {}, collection: {} }, { headers });
  }

  const [votes, entries] = await Promise.all([
    prisma.submissionVote.findMany({
      where: { userId, gameRevision: { gameId: id } },
      select: { gameRevisionId: true, vote: true },
    }),
    prisma.collectionEntry.findMany({
      where: { userId, gameRevision: { gameId: id } },
      select: { gameRevisionId: true, status: true },
    }),
  ]);

  return Response.json(
    {
      signedIn: true,
      votes: Object.fromEntries(votes.map((v) => [v.gameRevisionId, v.vote])),
      collection: Object.fromEntries(entries.map((e) => [e.gameRevisionId, e.status])),
    },
    { headers },
  );
}
