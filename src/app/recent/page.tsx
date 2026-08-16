import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { RegionBadge } from "@/components/RegionBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { CartridgeFormatBadge } from "@/components/CartridgeFormatBadge";
import { PlatformBadge } from "@/components/PlatformBadge";
import { prisma } from "@/lib/db";
import { parseLanguages } from "@/lib/enums";

const FEED_LIMIT = 50;

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default async function RecentPage() {
  const revisions = await prisma.gameRevision.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: "desc" },
    take: FEED_LIMIT,
    include: { game: { select: { id: true, title: true, publisher: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Recently added</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          The most recently submitted prints across the catalog, newest first.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {revisions.map((revision) => {
          const languages = parseLanguages(revision.languages);
          return (
            <Link
              key={revision.id}
              href={`/games/${revision.game.id}#revision-${revision.id}`}
              className="block rounded-xl border p-4"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-medium">{revision.game.title}</p>
                  <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {revision.game.publisher}
                  </p>
                </div>
                <span className="shrink-0 text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(revision.createdAt)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <PlatformBadge platform={revision.platform} />
                <CartridgeFormatBadge cartridgeFormat={revision.cartridgeFormat} />
                <RegionBadge
                  regionFree={revision.regionFree}
                  regionOfCart={revision.regionOfCart}
                  languageLockedToRegion={revision.languageLockedToRegion}
                  languageCount={languages.length}
                />
                <TrustBadge dataSource={revision.dataSource} />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
