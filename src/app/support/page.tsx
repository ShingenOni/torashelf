import Link from "next/link";
import { IconArrowLeft, IconHeartHandshake } from "@tabler/icons-react";

const DONATION_URL = "https://ko-fi.com/shingenoni";

export default function SupportPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <IconHeartHandshake size={20} style={{ color: "var(--text-secondary)" }} />
          <h1 className="text-lg font-semibold">Support this project</h1>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          This app is free to use and ad-free for now. Keeping it running — hosting, database, and the time to keep
          the data accurate — costs a little, and donations are one way that gets covered. There&apos;s no
          obligation at all; browsing and contributing data helps just as much.
        </p>

        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius)] px-4 py-2 text-sm font-medium"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          Donate on Ko-fi
        </a>
      </div>
    </main>
  );
}
