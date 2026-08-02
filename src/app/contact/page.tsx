import Link from "next/link";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";
import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <IconMail size={20} style={{ color: "var(--text-secondary)" }} />
          <h1 className="text-xl font-semibold">Contact</h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Bug reports, questions, or takedown requests — send a message and expect a reply at the email you give
          below.
        </p>
      </div>

      <ContactForm />
    </main>
  );
}
