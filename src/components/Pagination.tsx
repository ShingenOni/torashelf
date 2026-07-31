import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// First, last, and a small window around the current page — e.g.
// "1 … 35 36 37 … 69" — rather than every page number, which would be
// unusable once the catalog has dozens of pages.
function buildPageList(current: number, total: number, delta = 1): (number | "ellipsis")[] {
  if (total <= 1) return [1];

  const window: number[] = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    window.push(i);
  }

  const pages: (number | "ellipsis")[] = [1];
  if (window[0] > 2) pages.push("ellipsis");
  pages.push(...window);
  if (window[window.length - 1] < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);
  return pages;
}

export function Pagination({
  page,
  pageCount,
  total,
  searchParams,
}: {
  page: number;
  pageCount: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (v) params.set(key, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  const pageList = buildPageList(page, pageCount);
  const navButtonStyle = { borderColor: "var(--border)" };
  const disabledClass = "opacity-40";

  return (
    <div className="mt-2 flex flex-col items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
      <span>
        {total.toLocaleString()} game{total === 1 ? "" : "s"} · page {page} of {pageCount}
      </span>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            aria-label="Previous page"
            className="inline-flex items-center justify-center rounded-[var(--radius)] border px-2 py-1.5"
            style={navButtonStyle}
          >
            <IconChevronLeft size={14} />
          </Link>
        ) : (
          <span className={`inline-flex items-center justify-center rounded-[var(--radius)] border px-2 py-1.5 ${disabledClass}`} style={navButtonStyle}>
            <IconChevronLeft size={14} />
          </span>
        )}

        {pageList.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1" style={{ color: "var(--text-muted)" }}>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefForPage(p)}
              aria-current={p === page ? "page" : undefined}
              className="inline-flex min-w-[2rem] items-center justify-center rounded-[var(--radius)] border px-2 py-1.5"
              style={
                p === page
                  ? { background: "var(--foreground)", color: "var(--background)", borderColor: "transparent" }
                  : navButtonStyle
              }
            >
              {p}
            </Link>
          ),
        )}

        {page < pageCount ? (
          <Link
            href={hrefForPage(page + 1)}
            aria-label="Next page"
            className="inline-flex items-center justify-center rounded-[var(--radius)] border px-2 py-1.5"
            style={navButtonStyle}
          >
            <IconChevronRight size={14} />
          </Link>
        ) : (
          <span className={`inline-flex items-center justify-center rounded-[var(--radius)] border px-2 py-1.5 ${disabledClass}`} style={navButtonStyle}>
            <IconChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
