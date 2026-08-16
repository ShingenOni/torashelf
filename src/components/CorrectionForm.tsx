"use client";

import { useActionState } from "react";
import { submitCorrection, type SubmitState } from "@/lib/community";

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
const PLATFORM_OPTIONS = [
  { value: "SWITCH_1", label: "Switch — original console" },
  { value: "SWITCH_2", label: "Switch 2 — native, no separate Switch 1 version" },
  { value: "SWITCH_2_EDITION", label: "Switch 2 Edition — upgraded re-release of a Switch title" },
];
const LANGUAGE_OPTIONS = ["EN", "JA", "FR", "DE", "ES", "IT", "KO", "ZH"];

const initialState: SubmitState = { error: null };
const inputClass = "w-full rounded-[var(--radius)] border px-3 py-2 text-sm outline-none";
const inputStyle = { background: "var(--surface-1)", borderColor: "var(--border)" };

export function CorrectionForm({
  targetRevisionId,
  defaults,
}: {
  targetRevisionId: string;
  defaults: {
    regionOfCart: string;
    regionFree: string;
    cartridgeFormat: string;
    platform: string;
    languages: string[];
    languageLockedToRegion: boolean;
    sourceCitation: string | null;
    notes: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(submitCorrection, initialState);
  const checkedLanguages = new Set(defaults.languages.filter((l) => LANGUAGE_OPTIONS.includes(l)));
  const extraLanguages = defaults.languages.filter((l) => !LANGUAGE_OPTIONS.includes(l)).join(", ");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="targetRevisionId" value={targetRevisionId} />

      {/* Honeypot — real users never see or fill this in */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <label className="flex flex-col gap-1 text-sm">
        Platform
        <select
          name="platform"
          required
          defaultValue={defaults.platform}
          className={inputClass}
          style={inputStyle}
        >
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Cartridge format
        <select
          name="cartridgeFormat"
          required
          defaultValue={defaults.cartridgeFormat}
          className={inputClass}
          style={inputStyle}
        >
          {CARTRIDGE_FORMAT_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Cart print region
          <select
            name="regionOfCart"
            required
            defaultValue={defaults.regionOfCart}
            className={inputClass}
            style={inputStyle}
          >
            {CART_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Region-free status
          <select
            name="regionFree"
            required
            defaultValue={defaults.regionFree}
            className={inputClass}
            style={inputStyle}
          >
            {REGION_FREE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="inline-flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="languageLockedToRegion"
          defaultChecked={defaults.languageLockedToRegion}
          className="mt-0.5"
        />
        Language support is tied to this cart&apos;s print, not the console&apos;s system language
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span>Languages supported</span>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label key={lang} className="inline-flex items-center gap-1.5 font-mono text-[13px]">
              <input type="checkbox" name="languages" value={lang} defaultChecked={checkedLanguages.has(lang)} />
              {lang}
            </label>
          ))}
        </div>
        <input
          type="text"
          name="extraLanguages"
          defaultValue={extraLanguages}
          placeholder="Other language codes, comma separated (e.g. PT, RU)"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Source / citation (optional)
        <input
          type="url"
          name="sourceCitation"
          defaultValue={defaults.sourceCitation ?? ""}
          placeholder="https://..."
          className={inputClass}
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea name="notes" defaultValue={defaults.notes ?? ""} rows={3} className={inputClass} style={inputStyle} />
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
        {isPending ? "Submitting…" : "Suggest correction"}
      </button>

      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        Goes through the same confirm/dispute voting as new submissions. If confirmed, it replaces this print&apos;s
        current details. If disputed, it&apos;s discarded and this print stays as-is.
      </p>
    </form>
  );
}
