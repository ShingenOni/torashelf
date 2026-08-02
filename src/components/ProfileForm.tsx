"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/lib/collection";

const REGIONS = ["US", "EU", "JP", "ASIA", "OTHER"];
const LANGUAGES = ["EN", "JA", "FR", "DE", "ES", "IT", "KO", "ZH"];

const initialState: ProfileState = { error: null };
const inputStyle = { background: "var(--surface-1)", borderColor: "var(--border)" };

export function ProfileForm({
  name,
  homeRegion,
  preferredLanguages,
}: {
  name: string | null;
  homeRegion: string;
  preferredLanguages: string[];
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-4 rounded-xl border p-4"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Display name
        <input
          type="text"
          name="name"
          maxLength={30}
          defaultValue={name ?? ""}
          placeholder="Anonymous"
          className="rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={inputStyle}
        />
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Shown on your submissions instead of your email. Leave blank to stay anonymous.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Home region
        <select
          name="homeRegion"
          defaultValue={homeRegion}
          className="rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={inputStyle}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span>Languages you read</span>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((lang) => (
            <label key={lang} className="inline-flex items-center gap-1.5 font-mono text-[13px]">
              <input
                type="checkbox"
                name="preferredLanguages"
                value={lang}
                defaultChecked={preferredLanguages.includes(lang)}
              />
              {lang}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium disabled:opacity-60"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        {isPending ? "Saving…" : "Save"}
      </button>

      {state.error && (
        <p className="w-full text-sm" style={{ color: "var(--text-danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
