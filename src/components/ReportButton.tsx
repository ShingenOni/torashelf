"use client";

import { useActionState, useState } from "react";
import { IconFlag } from "@tabler/icons-react";
import { reportRevision, type ReportState } from "@/lib/community";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abusive content" },
  { value: "OTHER", label: "Other" },
];

const initialState: ReportState = { error: null };

// Deliberately separate from VotePanel's confirm/dispute — those are for
// genuine disagreement about data accuracy, this is for bad-faith content
// (spam, abuse) that shouldn't be up for a vote at all.
export function ReportButton({ gameRevisionId, isSignedIn }: { gameRevisionId: string; isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(reportRevision, initialState);

  if (!isSignedIn) return null;

  if (state.success) {
    return (
      <p className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Reported — thanks for flagging this.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-[11px]"
        style={{ color: "var(--text-muted)" }}
      >
        <IconFlag size={12} />
        Report spam/abuse
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-1.5 rounded-[var(--radius)] border p-2" style={{ borderColor: "var(--border)" }}>
      <input type="hidden" name="gameRevisionId" value={gameRevisionId} />
      {/* Honeypot — real users never see or fill this in */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          name="reason"
          required
          defaultValue=""
          className="rounded-[var(--radius)] border px-2 py-1 text-[12px]"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <option value="" disabled>
            Reason
          </option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="details"
          placeholder="Details (optional)"
          className="min-w-0 flex-1 rounded-[var(--radius)] border px-2 py-1 text-[12px]"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[var(--radius)] px-2 py-1 text-[11px] font-medium disabled:opacity-60"
          style={{ background: "var(--bg-danger)", color: "var(--text-danger)" }}
        >
          Submit report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Cancel
        </button>
      </div>

      {state.error && (
        <p className="text-[11px]" style={{ color: "var(--text-danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
