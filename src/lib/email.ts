import { Resend } from "resend";

// Shared between auth.ts (magic links) and contact.ts (contact form) — null
// when RESEND_API_KEY is unset, so both fall back to a console-log stub in
// local dev without needing a Resend account.
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
