import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconEdit, IconExternalLink, IconPlus } from "@tabler/icons-react";
import { RegionBadge } from "@/components/RegionBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { CartridgeFormatBadge } from "@/components/CartridgeFormatBadge";
import { LanguageTags } from "@/components/LanguageTags";
import { VotePanel } from "@/components/VotePanel";
import { CollectionControl } from "@/components/CollectionControl";
import { ReportButton } from "@/components/ReportButton";
import { getGameWithRevisions } from "@/lib/games";
import { getCurrentUserId } from "@/lib/auth";
import {
  CART_REGION_LABELS,
  CARTRIDGE_FORMAT_LABELS,
  REGION_FREE_LABELS,
  parseLanguages,
  type CartRegion,
  type CartridgeFormat,
  type RegionFree,
} from "@/lib/enums";

type RevisionLike = {
  regionOfCart: string;
  regionFree: string;
  cartridgeFormat: string;
  languages: string;
  languageLockedToRegion: boolean;
  notes: string | null;
  sourceCitation: string | null;
};

// Shows only the fields a correction actually changes, so a one-line
// language tweak doesn't get buried under a wall of unchanged values.
function describeCorrectionChanges(original: RevisionLike, correction: RevisionLike) {
  const changes: { label: string; from: string; to: string }[] = [];

  if (original.regionOfCart !== correction.regionOfCart) {
    changes.push({
      label: "Cart region",
      from: CART_REGION_LABELS[original.regionOfCart as CartRegion] ?? original.regionOfCart,
      to: CART_REGION_LABELS[correction.regionOfCart as CartRegion] ?? correction.regionOfCart,
    });
  }
  if (original.regionFree !== correction.regionFree) {
    changes.push({
      label: "Region-free status",
      from: REGION_FREE_LABELS[original.regionFree as RegionFree] ?? original.regionFree,
      to: REGION_FREE_LABELS[correction.regionFree as RegionFree] ?? correction.regionFree,
    });
  }
  if (original.cartridgeFormat !== correction.cartridgeFormat) {
    changes.push({
      label: "Cartridge format",
      from: CARTRIDGE_FORMAT_LABELS[original.cartridgeFormat as CartridgeFormat] ?? original.cartridgeFormat,
      to: CARTRIDGE_FORMAT_LABELS[correction.cartridgeFormat as CartridgeFormat] ?? correction.cartridgeFormat,
    });
  }
  const originalLangs = parseLanguages(original.languages).join(", ");
  const correctionLangs = parseLanguages(correction.languages).join(", ");
  if (originalLangs !== correctionLangs) {
    changes.push({ label: "Languages", from: originalLangs || "(none)", to: correctionLangs || "(none)" });
  }
  if (original.languageLockedToRegion !== correction.languageLockedToRegion) {
    changes.push({
      label: "Language locked to region",
      from: original.languageLockedToRegion ? "Yes" : "No",
      to: correction.languageLockedToRegion ? "Yes" : "No",
    });
  }
  if ((original.notes ?? "") !== (correction.notes ?? "")) {
    changes.push({ label: "Notes", from: original.notes || "(none)", to: correction.notes || "(none)" });
  }
  if ((original.sourceCitation ?? "") !== (correction.sourceCitation ?? "")) {
    changes.push({
      label: "Source",
      from: original.sourceCitation || "(none)",
      to: correction.sourceCitation || "(none)",
    });
  }

  return changes;
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, currentUserId] = await Promise.all([getGameWithRevisions(id), getCurrentUserId()]);
  if (!game) notFound();
  const isSignedIn = currentUserId !== null;

  const year = game.releaseDate ? new Date(game.releaseDate).getUTCFullYear() : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{game.title}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {game.publisher}
          {year ? ` · ${year}` : ""}
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {game.revisions.length} known print{game.revisions.length > 1 ? "s" : ""}
          </h2>
          <Link
            href={`/submit?gameId=${game.id}`}
            className="inline-flex items-center gap-1 text-[13px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            <IconPlus size={14} />
            Add a print
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {game.revisions.map((revision) => {
            const languages = parseLanguages(revision.languages);
            const regionLabel =
              CART_REGION_LABELS[revision.regionOfCart as CartRegion] ?? revision.regionOfCart;
            const confirms = revision.votes.filter((v) => v.vote === "CONFIRM").length;
            const disputes = revision.votes.filter((v) => v.vote === "DISPUTE").length;
            const currentVote = (currentUserId
              ? revision.votes.find((v) => v.userId === currentUserId)?.vote
              : null) as "CONFIRM" | "DISPUTE" | null | undefined;
            const disputeEvidence = revision.votes
              .filter((v) => v.vote === "DISPUTE" && v.evidenceUrl)
              .map((v) => v.evidenceUrl as string);
            const collectionStatus = (currentUserId
              ? revision.collectionEntries.find((c) => c.userId === currentUserId)?.status
              : null) as "OWNED" | "WISHLIST" | "CONSIDERING_IMPORT" | null | undefined;

            const pendingCorrection = revision.corrections[0];
            const correctionChanges = pendingCorrection
              ? describeCorrectionChanges(revision, pendingCorrection)
              : [];
            const correctionConfirms = pendingCorrection
              ? pendingCorrection.votes.filter((v) => v.vote === "CONFIRM").length
              : 0;
            const correctionDisputes = pendingCorrection
              ? pendingCorrection.votes.filter((v) => v.vote === "DISPUTE").length
              : 0;
            const correctionCurrentVote = (pendingCorrection && currentUserId
              ? pendingCorrection.votes.find((v) => v.userId === currentUserId)?.vote
              : null) as "CONFIRM" | "DISPUTE" | null | undefined;

            return (
              <div
                key={revision.id}
                id={`revision-${revision.id}`}
                className="rounded-xl border p-4"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{regionLabel} cart</p>
                  {!pendingCorrection && (
                    <Link
                      href={`/games/${game.id}/correct/${revision.id}`}
                      className="inline-flex items-center gap-1 text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <IconEdit size={12} />
                      Suggest a correction
                    </Link>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <CartridgeFormatBadge cartridgeFormat={revision.cartridgeFormat} />
                  <RegionBadge
                    regionFree={revision.regionFree}
                    regionOfCart={revision.regionOfCart}
                    languageLockedToRegion={revision.languageLockedToRegion}
                    languageCount={languages.length}
                  />
                  <TrustBadge dataSource={revision.dataSource} />
                </div>

                <p className="mt-3 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {revision.languageLockedToRegion
                    ? "Language content is locked to this cart's print — it does not follow the console's system language."
                    : "Language content follows the console's system language setting, not the cart's print region."}
                </p>

                <div className="mt-3">
                  <LanguageTags languages={languages} />
                </div>

                {revision.notes && (
                  <p className="mt-3 rounded-[var(--radius)] px-2.5 py-2 text-[13px]" style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}>
                    {revision.notes}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[12px]" style={{ color: "var(--text-muted)" }}>
                  <span>
                    Updated {revision.updatedAt.toLocaleDateString()}
                    {revision.submittedByUserId &&
                      ` · Submitted by ${revision.submittedByUser?.name || "Anonymous"}`}
                  </span>
                  {revision.sourceCitation && (
                    <a
                      href={revision.sourceCitation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1"
                    >
                      Source
                      <IconExternalLink size={12} />
                    </a>
                  )}
                </div>

                <CollectionControl
                  gameRevisionId={revision.id}
                  status={collectionStatus ?? null}
                  isSignedIn={isSignedIn}
                />

                <VotePanel
                  gameRevisionId={revision.id}
                  confirms={confirms}
                  disputes={disputes}
                  currentVote={currentVote ?? null}
                  disputeEvidence={disputeEvidence}
                  isSignedIn={isSignedIn}
                />

                <ReportButton gameRevisionId={revision.id} isSignedIn={isSignedIn} />

                {pendingCorrection && (
                  <div
                    className="mt-3 rounded-[var(--radius)] border border-dashed p-3"
                    style={{ borderColor: "var(--border-trust-unverified)", background: "var(--bg-trust-unverified)" }}
                  >
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-trust-unverified)" }}>
                      Pending correction{" "}
                      {pendingCorrection.submittedByUserId &&
                        `· suggested by ${pendingCorrection.submittedByUser?.name || "Anonymous"}`}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {correctionChanges.map((change) => (
                        <li key={change.label}>
                          <strong>{change.label}:</strong> {change.from} → {change.to}
                        </li>
                      ))}
                    </ul>
                    <VotePanel
                      gameRevisionId={pendingCorrection.id}
                      confirms={correctionConfirms}
                      disputes={correctionDisputes}
                      currentVote={correctionCurrentVote ?? null}
                      disputeEvidence={[]}
                      isSignedIn={isSignedIn}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
