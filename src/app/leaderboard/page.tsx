import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { getTopSubmitters, getTopVoters, type LeaderboardEntry } from "@/lib/leaderboard";

function LeaderboardList({ entries, emptyLabel }: { entries: LeaderboardEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((entry, i) => (
        <li
          key={entry.userId}
          className="flex items-center justify-between rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <span className="flex items-center gap-2">
            <span className="w-5 text-right font-mono text-[13px]" style={{ color: "var(--text-muted)" }}>
              {i + 1}
            </span>
            {entry.name}
          </span>
          <span className="font-mono text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {entry.count}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function LeaderboardPage() {
  const [topSubmitters, topVoters] = await Promise.all([getTopSubmitters(), getTopVoters()]);

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
        <h1 className="text-xl font-semibold">Top contributors</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          The community members who&apos;ve done the most to keep the catalog accurate.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Top submitters — verified submissions
        </h2>
        <LeaderboardList
          entries={topSubmitters}
          emptyLabel="No verified submissions yet — be the first to add one."
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Top voters — confirm/dispute votes cast
        </h2>
        <LeaderboardList
          entries={topVoters}
          emptyLabel="No votes cast yet — be the first to confirm or dispute an entry."
        />
      </div>
    </main>
  );
}
