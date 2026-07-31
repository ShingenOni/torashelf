import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { Resend } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { EARLY_ADOPTER_THRESHOLD, EMAIL_DELIVERY_ENABLED } from "@/lib/constants";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sends the magic sign-in link via Resend when RESEND_API_KEY is set
// (production); otherwise prints it to the server console so local dev
// doesn't need a Resend account to sign in.
const emailProvider: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: "ToraShelf <noreply@torashelf.com>",
  maxAge: 24 * 60 * 60,
  server: EMAIL_DELIVERY_ENABLED ? "resend" : "dev-stub",
  async sendVerificationRequest({ identifier, url }) {
    if (!resend) {
      console.log("\n" + "=".repeat(70));
      console.log(`Magic sign-in link for ${identifier}:`);
      console.log(url);
      console.log("=".repeat(70) + "\n");
      return;
    }
    await resend.emails.send({
      from: "ToraShelf <noreply@torashelf.com>",
      to: identifier,
      subject: "Sign in to ToraShelf",
      html: `<p>Click the link below to sign in to ToraShelf:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
      text: `Sign in to ToraShelf: ${url}\n\nThis link expires in 24 hours.`,
    });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [emailProvider],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-link",
  },
  events: {
    // Fires once, right after the adapter creates a brand-new user row.
    // signupNumber/isEarlyAdopter are set here rather than recomputed on
    // every login, so the badge stays permanent even once the site has
    // grown well past the threshold.
    async createUser({ user }) {
      const signupNumber = await prisma.user.count();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          signupNumber,
          isEarlyAdopter: signupNumber <= EARLY_ADOPTER_THRESHOLD,
        },
      });
    },
  },
});
