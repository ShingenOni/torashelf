import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

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

  return (
    <div className="mt-2 flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
      <span>
        {total.toLocaleString()} game{total === 1 ? "" : "s"} · page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <IconChevronLeft size={14} />
            Prev
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 opacity-40" style={{ borderColor: "var(--border)" }}>
            <IconChevronLeft size={14} />
            Prev
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={hrefForPage(page + 1)}
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            Next
            <IconChevronRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2.5 py-1.5 opacity-40" style={{ borderColor: "var(--border)" }}>
            Next
            <IconChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
