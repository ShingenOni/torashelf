"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SessionUser = { name?: string | null; email?: string | null };

// Sign-in status is read in the browser rather than on the server so public
// pages can be served from cache. Auth.js answers /api/auth/session without
// touching the database when there's no session cookie, so anonymous
// visitors and crawlers never wake it. Re-checked on navigation so the
// header updates after signing out (a server-action redirect).
export function useSessionUser() {
  const pathname = usePathname();
  const [state, setState] = useState<{ ready: boolean; user: SessionUser | null }>({
    ready: false,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (!cancelled) setState({ ready: true, user: session?.user ?? null });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}
