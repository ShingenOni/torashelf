"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { IconPaperclip, IconThumbDown, IconThumbUp } from "@tabler/icons-react";
import { castVote } from "@/lib/community";

type Props = {
  gameRevisionId: string;
  confirms: number;
  disputes: number;
  currentVote: "CONFIRM" | "DISPUTE" | null;
  disputeEvidence: string[];
  isSignedIn: boolean;
};

export function VotePanel({
  gameRevisionId,
  confirms,
  disputes,
  currentVote,
  disputeEvidence,
  isSignedIn,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function submitVote(vote: "CONFIRM" | "DISPUTE") {
    const formData = new FormData();
    formData.set("gameRevisionId", gameRevisionId);
    formData.set("vote", vote);
    if (vote === "DISPUTE" && fileRef.current?.files?.[0]) {
      formData.set("evidence", fileRef.current.files[0]);
    }
    startTransition(async () => {
      const result = await castVote(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setShowDisputeForm(false);
      setFileName(null);
    });
  }

  if (!isSignedIn) {
    return (
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <span>
            {confirms} confirm{confirms === 1 ? "" : "s"} · {disputes} dispute{disputes === 1 ? "" : "s"}
          </span>
          <Link href="/signin" className="font-medium" style={{ color: "var(--text-secondary)" }}>
            Sign in to vote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submitVote("CONFIRM")}
          className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2 py-1 text-[12px] disabled:opacity-60"
          style={
            currentVote === "CONFIRM"
              ? { background: "var(--bg-success)", color: "var(--text-success)", borderColor: "transparent" }
              : { borderColor: "var(--border)", color: "var(--text-secondary)" }
          }
        >
          <IconThumbUp size={13} />
          Confirm ({confirms})
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowDisputeForm((v) => !v)}
          className="inline-flex items-center gap-1 rounded-[var(--radius)] border px-2 py-1 text-[12px] disabled:opacity-60"
          style={
            currentVote === "DISPUTE"
              ? { background: "var(--bg-danger)", color: "var(--text-danger)", borderColor: "transparent" }
              : { borderColor: "var(--border)", color: "var(--text-secondary)" }
          }
        >
          <IconThumbDown size={13} />
          Dispute ({disputes})
        </button>
      </div>

      {showDisputeForm && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            className="inline-flex cursor-pointer items-center gap-1 text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            <IconPaperclip size={13} />
            {fileName ?? "Attach evidence (optional)"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() => submitVote("DISPUTE")}
            className="rounded-[var(--radius)] px-2 py-1 text-[12px] font-medium disabled:opacity-60"
            style={{ background: "var(--bg-danger)", color: "var(--text-danger)" }}
          >
            Submit dispute
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[12px]" style={{ color: "var(--text-danger)" }}>
          {error}
        </p>
      )}

      {disputeEvidence.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Evidence from disputes
          </p>
          <div className="flex flex-wrap gap-2">
            {disputeEvidence.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- locally uploaded, no remote optimization needed */}
                <img
                  src={url}
                  alt="Dispute evidence"
                  className="h-16 w-16 rounded-[var(--radius)] border object-cover"
                  style={{ borderColor: "var(--border)" }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
