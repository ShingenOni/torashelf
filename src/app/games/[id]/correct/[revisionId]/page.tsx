import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { CorrectionForm } from "@/components/CorrectionForm";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseLanguages } from "@/lib/enums";

export default async function CorrectPage({
  params,
}: {
  params: Promise<{ id: string; revisionId: string }>;
}) {
  const { id, revisionId } = await params;
  const session = await auth();

  const revision = await prisma.gameRevision.findUnique({
    where: { id: revisionId },
    include: {
      game: { select: { id: true, title: true } },
      corrections: { where: { isHidden: false }, select: { id: true } },
    },
  });

  if (!revision || revision.gameId !== id || revision.isHidden || revision.correctsRevisionId) {
    notFound();
  }

  const hasPendingCorrection = revision.corrections.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href={`/games/${id}#revision-${revisionId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to {revision.game.title}
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Suggest a correction</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Proposing a fix to the {revision.game.title}{" "}
          print you were viewing. This doesn&apos;t create a new print — it suggests changes to this one.
        </p>
      </div>

      {hasPendingCorrection ? (
        <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          This print already has a pending correction awaiting votes.{" "}
          <Link href={`/games/${id}#revision-${revisionId}`} className="underline">
            Go vote on it
          </Link>{" "}
          instead of submitting another.
        </div>
      ) : !session?.user ? (
        <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-secondary)" }}>You need to sign in to suggest a correction.</p>
          <Link
            href="/signin"
            className="mt-2 inline-block rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Sign in
          </Link>
        </div>
      ) : (
        <CorrectionForm
          targetRevisionId={revision.id}
          defaults={{
            regionOfCart: revision.regionOfCart,
            regionFree: revision.regionFree,
            cartridgeFormat: revision.cartridgeFormat,
            languages: parseLanguages(revision.languages),
            languageLockedToRegion: revision.languageLockedToRegion,
            sourceCitation: revision.sourceCitation,
            notes: revision.notes,
          }}
        />
      )}
    </main>
  );
}
