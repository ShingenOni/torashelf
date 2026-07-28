import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// Dev-mode magic-link "sender": instead of wiring a real SMTP/Resend
// account, the sign-in link is printed to the server terminal. Swapping in
// real email later is just replacing sendVerificationRequest — nothing else
// in the app depends on how the link gets delivered.
const devConsoleEmailProvider: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: "onboarding@dev.local",
  maxAge: 24 * 60 * 60,
  server: "dev-stub",
  async sendVerificationRequest({ identifier, url }) {
    console.log("\n" + "=".repeat(70));
    console.log(`Magic sign-in link for ${identifier}:`);
    console.log(url);
    console.log("=".repeat(70) + "\n");
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [devConsoleEmailProvider],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-link",
  },
});
