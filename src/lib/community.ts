"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const CONFIRM_THRESHOLD = 3;

const ALLOWED_EVIDENCE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export type SubmitState = { error: string | null };

export async function submitGameRevision(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to submit a game or correction." };
  }

  const mode = formData.get("mode");
  const regionOfCart = formData.get("regionOfCart");
  const regionFree = formData.get("regionFree");
  const cartridgeFormat = String(formData.get("cartridgeFormat") ?? "FULL_CARTRIDGE");
  const languageLockedToRegion = formData.get("languageLockedToRegion") === "on";
  const languages = formData.getAll("languages").map(String);
  const extraLanguages = String(formData.get("extraLanguages") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const allLanguages = Array.from(new Set([...languages, ...extraLanguages]));
  const sourceCitation = String(formData.get("sourceCitation") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (typeof regionOfCart !== "string" || !regionOfCart) {
    return { error: "Choose the cart's print region." };
  }
  if (typeof regionFree !== "string" || !regionFree) {
    return { error: "Choose the region-free status." };
  }
  if (allLanguages.length === 0) {
    return { error: "Select or enter at least one language." };
  }

  let gameId: string;

  if (mode === "existing") {
    const existingId = formData.get("gameId");
    if (typeof existingId !== "string" || !existingId) {
      return { error: "Choose a game." };
    }
    gameId = existingId;
  } else {
    const title = String(formData.get("title") ?? "").trim();
    const publisher = String(formData.get("publisher") ?? "").trim();
    const releaseDateRaw = String(formData.get("releaseDate") ?? "");
    if (!title || !publisher) {
      return { error: "Title and publisher are required." };
    }
    const game = await prisma.game.create({
      data: {
        title,
        publisher,
        releaseDate: releaseDateRaw ? new Date(releaseDateRaw) : null,
      },
    });
    gameId = game.id;
  }

  const revision = await prisma.gameRevision.create({
    data: {
      gameId,
      regionOfCart,
      regionFree,
      cartridgeFormat,
      languages: JSON.stringify(allLanguages),
      languageLockedToRegion,
      dataSource: "UNVERIFIED_SUBMISSION",
      sourceCitation,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  redirect(`/games/${gameId}#revision-${revision.id}`);
}

export type VoteState = { error: string | null };

export async function castVote(formData: FormData): Promise<VoteState> {
  const gameRevisionId = formData.get("gameRevisionId");
  const vote = formData.get("vote");

  if (typeof gameRevisionId !== "string" || !gameRevisionId) {
    return { error: "Missing revision." };
  }
  if (vote !== "CONFIRM" && vote !== "DISPUTE") {
    return { error: "Invalid vote." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to vote." };
  }

  let evidenceUrl: string | null = null;
  const evidenceFile = formData.get("evidence");
  if (vote === "DISPUTE" && evidenceFile instanceof File && evidenceFile.size > 0) {
    try {
      evidenceUrl = await saveEvidenceFile(evidenceFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to save evidence." };
    }
  }

  await prisma.submissionVote.upsert({
    where: { gameRevisionId_userId: { gameRevisionId, userId: user.id } },
    update: { vote, evidenceUrl },
    create: { gameRevisionId, userId: user.id, vote, evidenceUrl },
  });

  await maybePromoteToVerified(gameRevisionId);

  const revision = await prisma.gameRevision.findUniqueOrThrow({
    where: { id: gameRevisionId },
    select: { gameId: true },
  });
  revalidatePath(`/games/${revision.gameId}`);
  revalidatePath("/");

  return { error: null };
}

async function saveEvidenceFile(file: File): Promise<string> {
  const ext = ALLOWED_EVIDENCE_TYPES[file.type];
  if (!ext) {
    throw new Error("Evidence must be an image (PNG, JPEG, WEBP, or GIF).");
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw new Error("Evidence image must be under 5MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "evidence");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/evidence/${filename}`;
}

async function maybePromoteToVerified(gameRevisionId: string) {
  const revision = await prisma.gameRevision.findUniqueOrThrow({
    where: { id: gameRevisionId },
    include: { votes: true },
  });
  if (revision.dataSource === "COMMUNITY_VERIFIED") return;

  const confirms = revision.votes.filter((v) => v.vote === "CONFIRM").length;
  if (confirms >= CONFIRM_THRESHOLD) {
    await prisma.gameRevision.update({
      where: { id: gameRevisionId },
      data: { dataSource: "COMMUNITY_VERIFIED" },
    });
  }
}
