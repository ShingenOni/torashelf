"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

const MAX_NICKNAME_LENGTH = 30;

const STATUS_VALUES = ["OWNED", "WISHLIST", "CONSIDERING_IMPORT"] as const;

export type CollectionState = { error: string | null };

export async function setCollectionStatus(formData: FormData): Promise<CollectionState> {
  const gameRevisionId = formData.get("gameRevisionId");
  const status = formData.get("status");

  if (typeof gameRevisionId !== "string" || !gameRevisionId) {
    return { error: "Missing revision." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to manage your collection." };
  }

  if (status === "NONE") {
    await prisma.collectionEntry.deleteMany({
      where: { gameRevisionId, userId: user.id },
    });
  } else if (typeof status === "string" && (STATUS_VALUES as readonly string[]).includes(status)) {
    await prisma.collectionEntry.upsert({
      where: { userId_gameRevisionId: { userId: user.id, gameRevisionId } },
      update: { status },
      create: { userId: user.id, gameRevisionId, status },
    });
  } else {
    return { error: "Invalid status." };
  }

  const revision = await prisma.gameRevision.findUniqueOrThrow({
    where: { id: gameRevisionId },
    select: { gameId: true },
  });
  revalidatePath(`/games/${revision.gameId}`);
  revalidatePath("/collection");

  return { error: null };
}

export type ProfileState = { error: string | null };

export async function updateProfile(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const homeRegion = formData.get("homeRegion");
  const languages = formData.getAll("preferredLanguages").map(String);
  const name = sanitizeText(formData.get("name"), MAX_NICKNAME_LENGTH);

  if (typeof homeRegion !== "string" || !homeRegion) {
    return { error: "Choose a home region." };
  }
  if (languages.length === 0) {
    return { error: "Select at least one language you read." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { homeRegion, preferredLanguages: JSON.stringify(languages), name },
  });

  revalidatePath("/collection");
  return { error: null };
}
