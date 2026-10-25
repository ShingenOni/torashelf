"use client";

import Link from "next/link";
import { IconLogin, IconUserCircle } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSessionUser } from "@/components/useSessionUser";

// Deliberately separate from BrowseToolbar's "My collection" button — that
// one only appears on the browse page and is easy to miss unless you
// already know to look for it. This is site-wide, so "how do I sign in"
// has an obvious answer from any page, not just after stumbling into a
// collection prompt.
//
// A client component on purpose: checking the session on the server made
// every page render per-request (and hit the database) — see useSessionUser.
export function SiteHeader() {
  const { ready, user } = useSessionUser();

  return (
    <header className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold">
          ToraShelf
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/recent" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Recently added
          </Link>

          <Link href="/leaderboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Leaderboard
          </Link>

          <ThemeToggle />

          {!ready ? null : user ? (
            <Link
              href="/collection"
              className="inline-flex items-center gap-1.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <IconUserCircle size={16} />
              {user.name || user.email}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              <IconLogin size={15} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
