"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconLibrary, IconPlus, IconSearch } from "@tabler/icons-react";

const REGION_OPTIONS = [
  { value: "REGION_FREE", label: "Region-free", bg: "var(--bg-success)", fg: "var(--text-success)" },
  { value: "REGION_LOCKED", label: "Region-locked", bg: "var(--bg-neutral)", fg: "var(--text-neutral)" },
  { value: "UNKNOWN", label: "Unknown", bg: "var(--bg-neutral)", fg: "var(--text-muted)" },
];

const LANGUAGE_OPTIONS = ["EN", "JA", "FR", "DE", "ES", "IT", "KO", "ZH"];

function parseListParam(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function BrowseToolbar({
  publishers,
  isSignedIn,
}: {
  publishers: string[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeRegions = parseListParam(searchParams.get("region"));
  const activeLangs = parseListParam(searchParams.get("lang"));
  const activePublisher = searchParams.get("publisher") ?? "";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function toggleListParam(key: "region" | "lang", value: string) {
    const current = key === "region" ? activeRegions : activeLangs;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    updateParams({ [key]: next.length ? next.join(",") : null });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateParams({ q: e.target.value || null });
            }}
            placeholder="Search by game title"
            className="w-full rounded-[var(--radius)] border py-2 pl-9 pr-3 text-sm outline-none"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          />
        </div>

        <select
          value={activePublisher}
          onChange={(e) => updateParams({ publisher: e.target.value || null })}
          className="rounded-[var(--radius)] border py-2 px-3 text-sm"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <option value="">All publishers</option>
          {publishers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <Link
          href={isSignedIn ? "/collection" : "/signin"}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <IconLibrary size={16} />
          My collection
        </Link>

        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          <IconPlus size={16} />
          Submit
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {REGION_OPTIONS.map((opt) => {
          const active = activeRegions.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleListParam("region", opt.value)}
              className="rounded-[var(--radius)] border px-3 py-1 text-[13px] transition"
              style={
                active
                  ? { background: opt.bg, color: opt.fg, borderColor: "transparent" }
                  : { background: "var(--surface-1)", color: "var(--text-secondary)", borderColor: "var(--border)" }
              }
            >
              {opt.label}
            </button>
          );
        })}

        <span className="mx-1 h-4 w-px self-center" style={{ background: "var(--border)" }} />

        {LANGUAGE_OPTIONS.map((lang) => {
          const active = activeLangs.includes(lang);
          return (
            <button
              key={lang}
              type="button"
              onClick={() => toggleListParam("lang", lang)}
              className="rounded-[var(--radius)] border px-3 py-1 font-mono text-[13px] transition"
              style={
                active
                  ? { background: "var(--foreground)", color: "var(--background)", borderColor: "transparent" }
                  : { background: "var(--surface-1)", color: "var(--text-secondary)", borderColor: "var(--border)" }
              }
            >
              {lang}
            </button>
          );
        })}
      </div>
    </div>
  );
}
