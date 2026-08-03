"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeText, tooManyLinks, validateUrl } from "@/lib/sanitize";

const CONFIRM_THRESHOLD = 3;
const REPORT_HIDE_THRESHOLD = 3;
const CORRECTION_DISPUTE_THRESHOLD = 3;

const ALLOWED_EVIDENCE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

// Honeypot: an off-screen field real users never fill in. Bots that
// autofill every input tend to fill it, so a non-empty value is a strong
// signal to silently reject without tipping off that it was a trap.
function isHoneypotTripped(formData: FormData): boolean {
  return String(formData.get("website") ?? "").trim().length > 0;
}

export type SubmitState = { error: string | null };

type ParsedRevisionFields = {
  regionOfCart: string;
  regionFree: string;
  cartridgeFormat: string;
  languages: string;
  languageLockedToRegion: boolean;
  sourceCitation: string | null;
  notes: string | null;
};

// Shared by submitGameRevision (new print) and submitCorrection (proposed
// fix to an existing print) — both collect the exact same descriptive
// fields, just attach them to the game differently.
function parseRevisionFields(formData: FormData): { data: ParsedRevisionFields } | { error: string } {
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

  const sourceCitationRaw = String(formData.get("sourceCitation") ?? "").trim();
  let sourceCitation: string | null = null;
  if (sourceCitationRaw) {
    sourceCitation = validateUrl(sourceCitationRaw);
    if (!sourceCitation) {
      return { error: "Source citation must be a valid http(s) URL." };
    }
  }

  const notesRaw = String(formData.get("notes") ?? "");
  if (tooManyLinks(notesRaw)) {
    return { error: "Notes can include at most 2 links." };
  }
  const notes = sanitizeText(notesRaw);

  if (typeof regionOfCart !== "string" || !regionOfCart) {
    return { error: "Choose the cart's print region." };
  }
  if (typeof regionFree !== "string" || !regionFree) {
    return { error: "Choose the region-free status." };
  }
  if (allLanguages.length === 0) {
    return { error: "Select or enter at least one language." };
  }

  return {
    data: {
      regionOfCart,
      regionFree,
      cartridgeFormat,
      languages: JSON.stringify(allLanguages),
      languageLockedToRegion,
      sourceCitation,
      notes,
    },
  };
}

export async function submitGameRevision(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  if (isHoneypotTripped(formData)) {
    return { error: "Something went wrong. Please try again." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to submit a game or correction." };
  }

  const ip = await getClientIp();
  const rateLimit = await enforceRateLimit("SUBMIT_GAME", user.id, ip);
  if (!rateLimit.ok) {
    return { error: rateLimit.error };
  }

  const parsed = parseRevisionFields(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const mode = formData.get("mode");
  let gameId: string;

  if (mode === "existing") {
    const existingId = formData.get("gameId");
    if (typeof existingId !== "string" || !existingId) {
      return { error: "Choose a game." };
    }
    gameId = existingId;
  } else {
    const title = sanitizeText(formData.get("title"), 200);
    const publisher = sanitizeText(formData.get("publisher"), 200);
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
      ...parsed.data,
      dataSource: "UNVERIFIED_SUBMISSION",
      submittedByUserId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  redirect(`/games/${gameId}#revision-${revision.id}`);
}

// Proposes a fix to an existing print rather than adding a new one. Creates
// a GameRevision row like any submission, but tagged via correctsRevisionId
// so it shows as a pending correction on the original print instead of a
// second standalone print — see maybePromoteToVerified for how it resolves.
export async function submitCorrection(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  if (isHoneypotTripped(formData)) {
    return { error: "Something went wrong. Please try again." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to suggest a correction." };
  }

  const targetRevisionId = String(formData.get("targetRevisionId") ?? "");
  if (!targetRevisionId) {
    return { error: "Missing revision." };
  }

  const target = await prisma.gameRevision.findUnique({
    where: { id: targetRevisionId },
    select: { id: true, gameId: true, isHidden: true, correctsRevisionId: true },
  });
  if (!target || target.isHidden || target.correctsRevisionId) {
    return { error: "That print can't be corrected right now." };
  }

  const existingPending = await prisma.gameRevision.findFirst({
    where: { correctsRevisionId: targetRevisionId, isHidden: false },
    select: { id: true },
  });
  if (existingPending) {
    return { error: "This print already has a pending correction — vote on it instead of submitting another." };
  }

  const ip = await getClientIp();
  const rateLimit = await enforceRateLimit("SUBMIT_GAME", user.id, ip);
  if (!rateLimit.ok) {
    return { error: rateLimit.error };
  }

  const parsed = parseRevisionFields(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  await prisma.gameRevision.create({
    data: {
      gameId: target.gameId,
      ...parsed.data,
      dataSource: "UNVERIFIED_SUBMISSION",
      submittedByUserId: user.id,
      correctsRevisionId: targetRevisionId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/games/${target.gameId}`);
  redirect(`/games/${target.gameId}#revision-${targetRevisionId}`);
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

  const ip = await getClientIp();
  const rateLimit = await enforceRateLimit("VOTE", user.id, ip);
  if (!rateLimit.ok) {
    return { error: rateLimit.error };
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

  // Unique on [gameRevisionId, userId] — a second vote from the same account
  // always updates this same row rather than creating a duplicate, so one
  // vote per user per entry holds regardless of how many times they click.
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

export type ReportState = { error: string | null; success?: boolean };

export async function reportRevision(
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  if (isHoneypotTripped(formData)) {
    return { error: "Something went wrong. Please try again." };
  }

  const gameRevisionId = formData.get("gameRevisionId");
  const reason = formData.get("reason");

  if (typeof gameRevisionId !== "string" || !gameRevisionId) {
    return { error: "Missing revision." };
  }
  if (reason !== "SPAM" && reason !== "ABUSE" && reason !== "OTHER") {
    return { error: "Choose a reason." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to report content." };
  }

  const ip = await getClientIp();
  const rateLimit = await enforceRateLimit("REPORT", user.id, ip);
  if (!rateLimit.ok) {
    return { error: rateLimit.error };
  }

  const detailsRaw = String(formData.get("details") ?? "");
  if (tooManyLinks(detailsRaw)) {
    return { error: "Details can include at most 2 links." };
  }
  const details = sanitizeText(detailsRaw, 300);

  await prisma.report.upsert({
    where: { gameRevisionId_userId: { gameRevisionId, userId: user.id } },
    update: { reason, details, status: "OPEN" },
    create: { gameRevisionId, userId: user.id, reason, details },
  });

  await maybeHideForReports(gameRevisionId);

  const revision = await prisma.gameRevision.findUniqueOrThrow({
    where: { id: gameRevisionId },
    select: { gameId: true },
  });
  revalidatePath(`/games/${revision.gameId}`);
  revalidatePath("/");

  return { error: null, success: true };
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

  // Correction proposals resolve differently from ordinary submissions:
  // enough confirms applies their fields onto the target print and hides
  // the proposal; enough disputes just discards the proposal and leaves the
  // target untouched (a rejected correction isn't a moderation event, so it
  // doesn't go through the report/hide path).
  if (revision.correctsRevisionId) {
    if (revision.isHidden) return;

    const confirms = revision.votes.filter((v) => v.vote === "CONFIRM").length;
    const disputes = revision.votes.filter((v) => v.vote === "DISPUTE").length;

    if (confirms >= CONFIRM_THRESHOLD) {
      await prisma.$transaction([
        prisma.gameRevision.update({
          where: { id: revision.correctsRevisionId },
          data: {
            regionOfCart: revision.regionOfCart,
            regionFree: revision.regionFree,
            cartridgeFormat: revision.cartridgeFormat,
            languages: revision.languages,
            languageLockedToRegion: revision.languageLockedToRegion,
            sourceCitation: revision.sourceCitation,
            notes: revision.notes,
            dataSource: "COMMUNITY_VERIFIED",
          },
        }),
        prisma.gameRevision.update({
          where: { id: revision.id },
          data: { isHidden: true, dataSource: "COMMUNITY_VERIFIED" },
        }),
      ]);
    } else if (disputes >= CORRECTION_DISPUTE_THRESHOLD) {
      await prisma.gameRevision.update({
        where: { id: revision.id },
        data: { isHidden: true },
      });
    }
    return;
  }

  if (revision.dataSource === "COMMUNITY_VERIFIED") return;

  const confirms = revision.votes.filter((v) => v.vote === "CONFIRM").length;
  if (confirms >= CONFIRM_THRESHOLD) {
    await prisma.gameRevision.update({
      where: { id: gameRevisionId },
      data: { dataSource: "COMMUNITY_VERIFIED" },
    });
  }
}

// No moderation dashboard exists yet, so this is the only thing that makes
// reports actually do something rather than just log data nobody reads.
// Hiding (not deleting) keeps the entry recoverable once real moderation
// tooling exists.
async function maybeHideForReports(gameRevisionId: string) {
  const revision = await prisma.gameRevision.findUniqueOrThrow({
    where: { id: gameRevisionId },
    include: { reports: true },
  });
  if (revision.isHidden) return;

  const openReports = revision.reports.filter((r) => r.status === "OPEN").length;
  if (openReports >= REPORT_HIDE_THRESHOLD) {
    await prisma.gameRevision.update({
      where: { id: gameRevisionId },
      data: { isHidden: true },
    });
  }
}
