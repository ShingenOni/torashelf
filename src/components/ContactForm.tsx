"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactState } from "@/lib/contact";

const initialState: ContactState = { error: null };
const inputStyle = { background: "var(--surface-1)", borderColor: "var(--border)" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <div className="rounded-xl border p-4 text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        Message sent — thanks for reaching out. Expect a reply at the email you gave.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />

      <label className="flex flex-col gap-1 text-sm">
        Name (optional)
        <input
          type="text"
          name="name"
          maxLength={60}
          className="rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Your email
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          name="message"
          required
          rows={6}
          maxLength={2000}
          placeholder="Bug report, question, takedown request — whatever brought you here."
          className="rounded-[var(--radius)] border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[var(--radius)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        {isPending ? "Sending…" : "Send message"}
      </button>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--text-danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
