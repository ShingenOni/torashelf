"use client";

import { useActionState, useState } from "react";
import { submitGameRevision, type SubmitState } from "@/lib/community";

const CART_REGIONS = ["US", "EU", "JP", "ASIA", "OTHER"];
const REGION_FREE_OPTIONS = [
  { value: "REGION_FREE", label: "Region-free" },
  { value: "REGION_LOCKED", label: "Region-locked" },
  { value: "UNKNOWN", label: "Unknown / not sure" },
];
const CARTRIDGE_FORMAT_OPTIONS = [
  { value: "FULL_CARTRIDGE", label: "Full cartridge — game data is on the cart" },
  { value: "GAME_KEY_CARD", label: "Game-key card — cart is a license key, needs a full download" },
  { value: "DIGITAL_ONLY", label: "Digital only — no physical release" },
];
const LANGUAGE_OPTIONS = ["EN", "JA", "FR", "DE", "ES", "IT", "KO", "ZH"];

const initialState: SubmitState = { error: null };
const inputClass = "w-full rounded-[var(--radius)] border px-3 py-2 text-sm outline-none";
const inputStyle = { background: "var(--surface-1)", borderColor: "var(--border)" };

export function SubmitForm({
  games,
  defaultGameId,
}: {
  games: { id: string; title: string }[];
  defaultGameId?: string;
}) {
  const [state, formAction, isPending] = useActionState(submitGameRevision, initialState);
  const [mode, setMode] = useState<"existing" | "new">(defaultGameId ? "existing" : "new");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Honeypot — real users never see or fill this in */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <fieldset className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-1.5">
          <input type="radio" name="mode" value="new" checked={mode === "new"} onChange={() => setMode("new")} />
          New title
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            name="mode"
            value="existing"
            checked={mode === "existing"}
            onChange={() => setMode("existing")}
          />
          Add a print to an existing title
        </label>
      </fieldset>

      {mode === "existing" ? (
        <label className="flex flex-col gap-1 text-sm">
          Game
          <select name="gameId" defaultValue={defaultGameId ?? ""} required className={inputClass} style={inputStyle}>
            <option value="" disabled>
              Choose a game
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Title
            <input type="text" name="title" required className={inputClass} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Publisher
            <input type="text" name="publisher" required className={inputClass} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Release date (optional)
            <input type="date" name="releaseDate" className={inputClass} style={inputStyle} />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Cartridge format
        <select name="cartridgeFormat" required defaultValue="FULL_CARTRIDGE" className={inputClass} style={inputStyle}>
          {CARTRIDGE_FORMAT_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          For Switch 2 titles, check{" "}
          <a
            href="https://www.dekudeals.com/guides/about-game-key-card-games"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Deku Deals&apos; Game-Key Card list
          </a>{" "}
          if you&apos;re not sure.
        </span>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Cart print region
          <select name="regionOfCart" required defaultValue="" className={inputClass} style={inputStyle}>
            <option value="" disabled>
              Choose a region
            </option>
            {CART_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Region-free status
          <select name="regionFree" required defaultValue="" className={inputClass} style={inputStyle}>
            <option value="" disabled>
              Choose a status
            </option>
            {REGION_FREE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="inline-flex items-start gap-2 text-sm">
        <input type="checkbox" name="languageLockedToRegion" className="mt-0.5" />
        Language support is tied to this cart&apos;s print, not the console&apos;s system language
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span>Languages supported</span>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label key={lang} className="inline-flex items-center gap-1.5 font-mono text-[13px]">
              <input type="checkbox" name="languages" value={lang} />
              {lang}
            </label>
          ))}
        </div>
        <input
          type="text"
          name="extraLanguages"
          placeholder="Other language codes, comma separated (e.g. PT, RU)"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Source / citation (optional)
        <input type="url" name="sourceCitation" placeholder="https://..." className={inputClass} style={inputStyle} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea name="notes" rows={3} className={inputClass} style={inputStyle} />
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--text-danger)" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[var(--radius)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        {isPending ? "Submitting…" : "Submit"}
      </button>

      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        Submissions start as unverified and become community-verified once other collectors confirm them.
      </p>
    </form>
  );
}
