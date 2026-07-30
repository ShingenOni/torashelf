import { IconCircleKey, IconCloudDownload, IconDeviceSdCard } from "@tabler/icons-react";
import type { CartridgeFormat } from "@/lib/enums";

const CONFIG: Record<
  CartridgeFormat,
  { label: string; icon: typeof IconDeviceSdCard; bg: string; fg: string }
> = {
  FULL_CARTRIDGE: {
    label: "Full cartridge",
    icon: IconDeviceSdCard,
    bg: "var(--bg-success)",
    fg: "var(--text-success)",
  },
  GAME_KEY_CARD: {
    label: "Game-key card",
    icon: IconCircleKey,
    bg: "var(--bg-warning)",
    fg: "var(--text-warning)",
  },
  DIGITAL_ONLY: {
    label: "Digital only",
    icon: IconCloudDownload,
    bg: "var(--bg-neutral)",
    fg: "var(--text-neutral)",
  },
};

// Whether the cart actually holds the game is just as central to "did I get
// what I paid for" as region-free/language status, so this gets the same
// high-visibility solid-fill pill as RegionBadge — plus an icon, which
// RegionBadge doesn't use, so the two never blur together at a glance.
export function CartridgeFormatBadge({ cartridgeFormat }: { cartridgeFormat: CartridgeFormat | string }) {
  const config = CONFIG[cartridgeFormat as CartridgeFormat];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium"
      style={{ background: config.bg, color: config.fg }}
    >
      <Icon size={13} stroke={2} />
      {config.label}
    </span>
  );
}
