import { IconCircleCheckFilled, IconClockExclamation, IconRobot } from "@tabler/icons-react";
import type { DataSource } from "@/lib/enums";

const CONFIG: Record<
  DataSource,
  { label: string; icon: typeof IconCircleCheckFilled; bg: string; fg: string; border: string; dashed?: boolean }
> = {
  COMMUNITY_VERIFIED: {
    label: "Community verified",
    icon: IconCircleCheckFilled,
    bg: "var(--bg-trust-verified)",
    fg: "var(--text-trust-verified)",
    border: "var(--border-trust-verified)",
  },
  SCRAPED: {
    label: "Scraped",
    icon: IconRobot,
    bg: "var(--bg-trust-scraped)",
    fg: "var(--text-trust-scraped)",
    border: "var(--border-trust-scraped)",
  },
  UNVERIFIED_SUBMISSION: {
    label: "Unverified submission",
    icon: IconClockExclamation,
    bg: "var(--bg-trust-unverified)",
    fg: "var(--text-trust-unverified)",
    border: "var(--border-trust-unverified)",
    dashed: true,
  },
};

// Trust badges answer "can I believe this data" — a completely different
// question from the region/language badges. To keep that distinction obvious
// at a glance (the whole point of this app), trust always gets an icon +
// outlined pill, never a solid fill and never the language tags' mono chip.
export function TrustBadge({ dataSource }: { dataSource: DataSource | string }) {
  const config = CONFIG[dataSource as DataSource];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.dashed ? "border-dashed" : ""}`}
      style={{ background: config.bg, color: config.fg, borderColor: config.border }}
    >
      <Icon size={13} stroke={2} />
      {config.label}
    </span>
  );
}
