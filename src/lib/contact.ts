"use server";

import { resend } from "@/lib/email";
import { enforceRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const CONTACT_RECEIVER = "Shingenoni@gmail.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Honeypot — real users never see or fill this in. Bots that autofill every
// field tend to, so this rejects the same way the signin/submit forms do.
function isHoneypotTripped(formData: FormData): boolean {
  return String(formData.get("website") ?? "").trim().length > 0;
}

export type ContactState = { error: string | null; success?: boolean };

export async function submitContactForm(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  if (isHoneypotTripped(formData)) {
    return { error: "Something went wrong. Please try again." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const name = sanitizeText(formData.get("name"), 60);
  const message = sanitizeText(formData.get("message"), 2000);

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email so a reply can reach you." };
  }
  if (!message) {
    return { error: "Enter a message." };
  }

  const ip = await getClientIp();
  const rateLimit = await enforceRateLimit("CONTACT", null, ip);
  if (!rateLimit.ok) {
    return { error: rateLimit.error };
  }

  if (!resend) {
    console.log("\n" + "=".repeat(70));
    console.log(`Contact form message from ${name ?? "Anonymous"} <${email}>:`);
    console.log(message);
    console.log("=".repeat(70) + "\n");
    return { error: null, success: true };
  }

  await resend.emails.send({
    from: "ToraShelf <noreply@torashelf.com>",
    to: CONTACT_RECEIVER,
    replyTo: email,
    subject: `ToraShelf contact form — ${name ?? "Anonymous"}`,
    text: message,
  });

  return { error: null, success: true };
}
