import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { SubmitForm } from "@/components/SubmitForm";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultGameId = typeof params.gameId === "string" ? params.gameId : undefined;
  const session = await auth();

  const games = await prisma.game.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Submit a game or correction</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Add a new title, or a print/revision of one already in the database. Submissions are marked unverified
          until the community confirms them.
        </p>
      </div>

      {session?.user ? (
        <SubmitForm games={games} defaultGameId={defaultGameId} />
      ) : (
        <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-secondary)" }}>You need to sign in to submit a game or correction.</p>
          <Link
            href={`/signin${defaultGameId ? `?gameId=${defaultGameId}` : ""}`}
            className="mt-2 inline-block rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Sign in
          </Link>
        </div>
      )}
    </main>
  );
}
