"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconBookmark } from "@tabler/icons-react";
import { setCollectionStatus } from "@/lib/collection";

type Status = "OWNED" | "WISHLIST" | "CONSIDERING_IMPORT" | null;

const OPTIONS: { value: Exclude<Status, null>; label: string }[] = [
  { value: "OWNED", label: "Owned" },
  { value: "WISHLIST", label: "Wishlist" },
  { value: "CONSIDERING_IMPORT", label: "Considering import" },
];

export function CollectionControl({
  gameRevisionId,
  status,
  isSignedIn,
}: {
  gameRevisionId: string;
  status: Status;
  isSignedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(next: Exclude<Status, null>) {
    const formData = new FormData();
    formData.set("gameRevisionId", gameRevisionId);
    formData.set("status", status === next ? "NONE" : next);
    startTransition(async () => {
      const result = await setCollectionStatus(formData);
      setError(result.error);
    });
  }

  if (!isSignedIn) {
    return (
      <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        <IconBookmark size={13} />
        <Link href="/signin" className="font-medium" style={{ color: "var(--text-secondary)" }}>
          Sign in to track this in your collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => update(opt.value)}
              className="rounded-[var(--radius)] border px-2 py-1 text-[12px] disabled:opacity-60"
              style={
                active
                  ? { background: "var(--foreground)", color: "var(--background)", borderColor: "transparent" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-[12px]" style={{ color: "var(--text-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
