// Language tags are deliberately the "quietest" element on the card: small,
// monospace, square-cornered chips with no icon and no color fill. That
// typographic/shape signature is what keeps them from ever being mistaken
// for a trust badge (icon + outlined pill) or a region badge (solid pill),
// independent of whatever color theme or layout this evolves into.
export function LanguageTags({
  languages,
  max,
}: {
  languages: string[];
  max?: number;
}) {
  const shown = max ? languages.slice(0, max) : languages;
  const overflow = max && languages.length > max ? languages.length - max : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((lang) => (
        <span
          key={lang}
          className="rounded-sm border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {lang}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-sm px-1.5 py-0.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
          +{overflow} more
        </span>
      )}
    </div>
  );
}
