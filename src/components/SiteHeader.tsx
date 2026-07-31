import Link from "next/link";
import { IconLogin, IconUserCircle } from "@tabler/icons-react";
import { auth } from "@/auth";

// Deliberately separate from BrowseToolbar's "My collection" button — that
// one only appears on the browse page and is easy to miss unless you
// already know to look for it. This is site-wide, so "how do I sign in"
// has an obvious answer from any page, not just after stumbling into a
// collection prompt.
export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold">
          ToraShelf
        </Link>

        {session?.user ? (
          <Link
            href="/collection"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <IconUserCircle size={16} />
            {session.user.email}
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
    </header>
  );
}
