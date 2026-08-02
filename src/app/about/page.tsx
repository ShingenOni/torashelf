import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

const cardStyle = { background: "var(--surface-2)", borderColor: "var(--border)" };

export default function AboutPage() {
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
        <h1 className="text-xl font-semibold">About ToraShelf</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          ToraShelf tracks three things Nintendo doesn&apos;t make easy to find for a specific Switch cartridge:
          whether it&apos;s actually region-free, what languages it supports <em>per regional print</em> (not just
          &ldquo;the game&rdquo; in general), and whether the cart physically holds the game data at all. It&apos;s
          built for collectors deciding whether to import a print, or figure out what they can already play on a
          cart they own.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Frequently asked
        </h2>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">What does &ldquo;region-free&rdquo; mean?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Whether the cartridge will boot and play on a Switch console from a different region than the cart was
            printed for. Most Switch games are region-free, but not all — a region-locked cart bought from overseas
            may simply refuse to run on your console.
          </p>
        </div>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">What&apos;s the difference between region-free and language support?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            They&apos;re independent. A cart can be region-free (it boots fine anywhere) while still only containing
            data for a handful of languages — sometimes just one. &ldquo;Language locked to region&rdquo; means the
            language content is tied to that specific print and won&apos;t change no matter what language your
            console is set to; otherwise, language follows your console&apos;s system language setting. Buying an
            import for a cheaper price only to find it&apos;s missing your language is the exact trap this app
            exists to flag.
          </p>
        </div>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">Full cartridge vs. Game-Key Card vs. digital-only — what&apos;s the difference?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            This is about whether &ldquo;physical&rdquo; actually means the game is on the cart:
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <li>
              <strong>Full cartridge</strong> — the game data itself is on the cart. It plays standalone, no
              download required.
            </li>
            <li>
              <strong>Game-Key Card</strong> — the cart is just a license key. The console still has to download the
              full game from the internet before it&apos;ll run, and needs Nintendo&apos;s servers to stay up to do
              so.
            </li>
            <li>
              <strong>Digital only</strong> — no physical release exists at all; listed here for completeness where
              relevant.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">What do the &ldquo;Scraped,&rdquo; &ldquo;Community verified,&rdquo; and &ldquo;Unverified submission&rdquo; badges mean?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            These are trust badges — a separate signal from the region/language badges, answering &ldquo;can I
            believe this data&rdquo; rather than &ldquo;what does this data say.&rdquo;
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <li>
              <strong>Scraped</strong> — pulled from an existing public database or tracker, not personally
              verified by a ToraShelf user.
            </li>
            <li>
              <strong>Unverified submission</strong> — added by a community member, not yet confirmed by others.
            </li>
            <li>
              <strong>Community verified</strong> — a submission that enough other users have confirmed as
              accurate.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">How can I contribute?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Sign in with just an email (no password) and use <strong>Submit</strong> to add a new print or correct
            an existing one, or confirm/dispute entries you can personally verify from a cart you own. More eyes on
            the data makes it more trustworthy for everyone.
          </p>
        </div>

        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-sm font-medium">Is this affiliated with Nintendo?</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            No. ToraShelf is an independent, fan-made project and is not affiliated with, endorsed by, or sponsored
            by Nintendo. &ldquo;Nintendo Switch&rdquo; and related names are trademarks of their respective owners,
            used here only to identify the hardware and games this site catalogs.
          </p>
        </div>
      </div>
    </main>
  );
}
