"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";

// Renders a placeholder until mounted — resolvedTheme is unknown on the
// server (it depends on localStorage/OS preference), so rendering the real
// icon before hydration would mismatch.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Standard next-themes pattern: resolvedTheme is unknowable until the
    // client mounts (it depends on localStorage/matchMedia), so this can't
    // be derived any other way without risking a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="inline-block h-[30px] w-[30px]" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center rounded-[var(--radius)] border p-1.5"
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}
