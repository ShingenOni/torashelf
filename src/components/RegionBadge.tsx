import { CART_REGION_LABELS, type CartRegion, type RegionFree } from "@/lib/enums";

type Props = {
  regionFree: RegionFree | string;
  regionOfCart: CartRegion | string;
  languageLockedToRegion: boolean;
  languageCount: number;
};

// Region-free status is the primary "is this safe to import" signal, so it
// gets the highest-contrast treatment on the card: a solid-fill color pill.
// This must stay visually distinct from the trust badge (outlined + icon)
// and from language tags (mono chips) no matter how the layout changes.
export function RegionBadge({
  regionFree,
  regionOfCart,
  languageLockedToRegion,
  languageCount,
}: Props) {
  if (regionFree === "REGION_LOCKED") {
    return (
      <span
        className="inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium"
        style={{ background: "var(--bg-neutral)", color: "var(--text-neutral)" }}
      >
        Region-locked
      </span>
    );
  }

  if (regionFree === "UNKNOWN") {
    return (
      <span
        className="inline-flex items-center rounded-[var(--radius)] border border-dashed px-2.5 py-1 text-xs font-medium"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Unknown
      </span>
    );
  }

  // REGION_FREE, but flag the "cart works anywhere, content doesn't" trap
  const isLanguageCaveat = languageLockedToRegion && languageCount <= 2;

  if (isLanguageCaveat) {
    const regionLabel = CART_REGION_LABELS[regionOfCart as CartRegion] ?? regionOfCart;
    return (
      <span
        className="inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium"
        style={{ background: "var(--bg-warning)", color: "var(--text-warning)" }}
      >
        Region-free, {regionLabel} cart only
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-[var(--radius)] px-2.5 py-1 text-xs font-medium"
      style={{ background: "var(--bg-success)", color: "var(--text-success)" }}
    >
      Region-free
    </span>
  );
}
