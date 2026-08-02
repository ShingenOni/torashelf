import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

const sectionStyle = { color: "var(--text-secondary)" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <IconArrowLeft size={16} />
        Back to browse
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Privacy Policy &amp; Terms of Service</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>Last updated August 1, 2026</p>
      </div>

      <section className="flex flex-col gap-4 text-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Privacy Policy</h2>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>What we collect</h3>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            <li><strong>Account:</strong> your email address (required to sign in — used only for magic-link sign-in and, occasionally, to reach you about your account or a submission you made), plus an optional display name you can set yourself.</li>
            <li><strong>Preferences:</strong> your home region and the languages you read, which you provide to power the collection dashboard&apos;s import-safety checks.</li>
            <li><strong>Contributions:</strong> any game or print data you submit, votes you cast confirming or disputing entries, optional evidence images you upload with a dispute, and spam/abuse reports you file.</li>
            <li><strong>Collection data:</strong> which prints you&apos;ve marked as owned, wishlisted, or considering importing.</li>
            <li><strong>Technical:</strong> your IP address, recorded alongside specific actions (submissions, votes, reports, contact messages) solely to detect and limit spam/abuse. It isn&apos;t used to track your browsing or build a profile of you.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>What we don&apos;t do</h3>
          <p className="mt-1">
            No analytics or tracking scripts, no advertising, and no cookies beyond the one strictly necessary
            session cookie that keeps you signed in. We don&apos;t sell or share your data for marketing purposes,
            ever.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>What&apos;s public</h3>
          <p className="mt-1">
            Your email address is never shown publicly — only you can see it, while signed in. If you set a display
            name, it&apos;s shown as attribution on submissions you make; if you don&apos;t, submissions show as
            &ldquo;Anonymous.&rdquo; Vote counts are aggregate numbers only — individual votes aren&apos;t
            attributed to a name or email anywhere on the site.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Who processes your data</h3>
          <p className="mt-1">
            The site runs on a small set of infrastructure providers who process data only as needed to operate
            it: <strong>Vercel</strong> (hosting), <strong>Neon</strong> (database hosting), and{" "}
            <strong>Resend</strong> (delivering sign-in and contact-form emails). None of them are permitted to use
            your data for their own purposes.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Your rights</h3>
          <p className="mt-1">
            You can update your display name, home region, and languages yourself from your collection page at any
            time. To access, correct, or delete any other data — including deleting your account entirely —{" "}
            <Link href="/contact" className="underline">contact us</Link>{" "}
            and we&apos;ll handle it directly, since there&apos;s no automated self-service deletion yet.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Children</h3>
          <p className="mt-1">
            ToraShelf isn&apos;t directed at children under 13, and we don&apos;t knowingly collect data from them.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Changes</h3>
          <p className="mt-1">
            This policy may be updated as the site changes. The date at the top reflects the last revision.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 text-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Terms of Service</h2>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>The service</h3>
          <p className="mt-1">
            ToraShelf is a free, community-maintained database of Nintendo Switch cartridge region, language, and
            format data. It is an independent fan project, not affiliated with or endorsed by Nintendo.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Accuracy</h3>
          <p className="mt-1">
            Data comes from a mix of scraped sources and community submissions/votes. We do our best to keep it
            accurate, but nothing here is guaranteed — always verify specifics yourself before making a purchase or
            import decision based on it.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Acceptable use</h3>
          <p className="mt-1">
            Don&apos;t submit spam, abusive content, or knowingly false data. Content that accumulates enough
            reports gets automatically hidden pending review, and accounts that abuse the platform may be
            suspended.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Your contributions</h3>
          <p className="mt-1">
            By submitting data, votes, or evidence to ToraShelf, you grant us a non-exclusive, royalty-free license
            to display, use, and modify that content as part of the shared community database. You retain the
            right to be credited (or not) per your display-name setting.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>No warranty</h3>
          <p className="mt-1">
            The service is provided &ldquo;as is,&rdquo; with no guarantee of uptime, accuracy, or fitness for any
            particular purpose. We aren&apos;t liable for decisions made based on data found here.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Changes to these terms</h3>
          <p className="mt-1">
            These terms may be updated as the site evolves; continued use after a change means you accept the
            update.
          </p>
        </div>

        <div>
          <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Contact</h3>
          <p className="mt-1">
            Questions, bug reports, or takedown requests: use the <Link href="/contact" className="underline">contact page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
