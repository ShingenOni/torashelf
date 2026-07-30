const MAX_TEXT_LENGTH = 500;
const MAX_LINKS_IN_TEXT = 2;

// React already escapes everything it renders (no dangerouslySetInnerHTML
// anywhere in this app), so this isn't closing an active XSS hole — it's
// defense in depth plus basic spam hygiene: strip markup, collapse
// whitespace, and cap length so a single submission can't dump a wall of
// text or raw HTML into the database.
export function sanitizeText(input: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof input !== "string") return null;
  const stripped = input.replace(/<[^>]*>/g, "");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return collapsed.slice(0, maxLength);
}

export function countLinks(text: string): number {
  const matches = text.match(/https?:\/\/\S+/gi);
  return matches ? matches.length : 0;
}

export function tooManyLinks(text: string): boolean {
  return countLinks(text) > MAX_LINKS_IN_TEXT;
}

// Server-side URL validation — the <input type="url"> on the form is
// trivially bypassed by anyone not using the browser UI.
export function validateUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
