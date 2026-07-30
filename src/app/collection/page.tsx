import Link from "next/link";
import { redirect } from "next/navigation";
import { IconAlertTriangle, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { RegionBadge } from "@/components/RegionBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { CartridgeFormatBadge } from "@/components/CartridgeFormatBadge";
import { EarlyAdopterBadge } from "@/components/EarlyAdopterBadge";
import { ProfileForm } from "@/components/ProfileForm";
import { assessOwnedRevision } from "@/lib/insights";
import { CART_REGION_LABELS, parseLanguages, type CartRegion } from "@/lib/enums";

const STATUS_SECTIONS = [
  { status: "OWNED", label: "Owned" },
  { status: "WISHLIST", label: "Wishlist" },
  { status: "CONSIDERING_IMPORT", label: "Considering import" },
] as const;

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const entries = await prisma.collectionEntry.findMany({
    where: { userId: user.id },
    include: { gameRevision: { include: { game: true } } },
    orderBy: { createdAt: "desc" },
  });

  const preferredLanguages = parseLanguages(user.preferredLanguages);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">My collection</h1>
            {user.isEarlyAdopter && <EarlyAdopterBadge signupNumber={user.signupNumber} />}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Signed in as {user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm underline" style={{ color: "var(--text-secondary)" }}>
            Sign out
          </button>
        </form>
      </div>

      <ProfileForm homeRegion={user.homeRegion} preferredLanguages={preferredLanguages} />

      {STATUS_SECTIONS.map((section) => {
        const sectionEntries = entries.filter((e) => e.status === section.status);
        return (
          <div key={section.status}>
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {section.label} ({sectionEntries.length})
            </h2>
            {sectionEntries.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing here yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sectionEntries.map((entry) => {
                  const revision = entry.gameRevision;
                  const languages = parseLanguages(revision.languages);
                  const regionLabel =
                    CART_REGION_LABELS[revision.regionOfCart as CartRegion] ?? revision.regionOfCart;
                  const assessment = section.status === "OWNED" ? assessOwnedRevision(revision, user) : null;

                  return (
                    <Link
                      key={entry.id}
                      href={`/games/${revision.gameId}#revision-${revision.id}`}
                      className="block rounded-xl border p-4"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                    >
                      <p className="text-[15px] font-medium">{revision.game.title}</p>
                      <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {regionLabel} cart
                      </p>

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

                      {assessment && (
                        <p
                          className="mt-2.5 flex items-start gap-1.5 text-[13px]"
                          style={{ color: assessment.safe ? "var(--text-success)" : "var(--text-warning)" }}
                        >
                          {assessment.safe ? (
                            <IconCheck size={14} className="mt-0.5 shrink-0" />
                          ) : (
                            <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
                          )}
                          {assessment.reason}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
