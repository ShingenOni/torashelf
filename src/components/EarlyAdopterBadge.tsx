import { IconSeeding } from "@tabler/icons-react";

export function EarlyAdopterBadge({ signupNumber }: { signupNumber?: number | null }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        background: "var(--bg-trust-verified)",
        color: "var(--text-trust-verified)",
        borderColor: "var(--border-trust-verified)",
      }}
      title={signupNumber ? `Signed up #${signupNumber}` : undefined}
    >
      <IconSeeding size={13} stroke={2} />
      Early adopter
    </span>
  );
}
