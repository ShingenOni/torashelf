import Link from "next/link";
import { IconArrowLeft, IconTerminal2 } from "@tabler/icons-react";

export default function CheckLinkPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div className="rounded-xl border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <IconTerminal2 size={18} style={{ color: "var(--text-secondary)" }} />
          <h1 className="text-lg font-semibold">Check your terminal</h1>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          No email was actually sent — this app is in dev mode. Look at the dev server&apos;s terminal
          output for a line starting with <span className="font-mono">Magic sign-in link for…</span>{" "}
          and open that URL to finish signing in.
        </p>
      </div>
    </main>
  );
}
