import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          const email = String(formData.get("email") ?? "");
          await signIn("email", { email, redirectTo: "/collection" });
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-[var(--radius)] border px-3 py-2 text-sm outline-none"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          className="w-fit rounded-[var(--radius)] px-4 py-2 text-sm font-medium"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          Send sign-in link
        </button>
      </form>

      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        Dev mode: no email is actually sent. The link is printed in the dev server&apos;s terminal —
        copy it from there into your browser.
      </p>
    </main>
  );
}
