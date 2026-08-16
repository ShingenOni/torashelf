import { IconDeviceGamepad, IconDeviceGamepad2, IconSparkles } from "@tabler/icons-react";
import { PLATFORM_LABELS, type Platform } from "@/lib/enums";

const CONFIG: Record<Platform, { icon: typeof IconDeviceGamepad }> = {
  SWITCH_1: { icon: IconDeviceGamepad },
  SWITCH_2: { icon: IconDeviceGamepad2 },
  SWITCH_2_EDITION: { icon: IconSparkles },
};

// One flat color across all three values, unlike RegionBadge/
// CartridgeFormatBadge's success/warning/neutral palette — platform has no
// "better/worse" axis, so it shouldn't borrow a palette that implies one.
export function PlatformBadge({ platform }: { platform: Platform | string }) {
  const config = CONFIG[platform as Platform];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium"
      style={{ background: "var(--bg-platform)", color: "var(--text-platform)" }}
    >
      <Icon size={13} stroke={2} />
      {PLATFORM_LABELS[platform as Platform]}
    </span>
  );
}
