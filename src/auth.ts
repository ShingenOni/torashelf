import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { EARLY_ADOPTER_THRESHOLD } from "@/lib/constants";

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
