import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CART_REGION_LABELS, parseLanguages, type CartRegion } from "@/lib/enums";

const REGION_FREE_LABELS: Record<string, string> = {
  REGION_FREE: "Region-free",
  REGION_LOCKED: "Region-locked",
  UNKNOWN: "Unknown",
};

const CARTRIDGE_FORMAT_LABELS: Record<string, string> = {
  FULL_CARTRIDGE: "Full cartridge",
  GAME_KEY_CARD: "Game-Key Card",
  DIGITAL_ONLY: "Digital only",
};

const STATUS_LABELS: Record<string, string> = {
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  CONSIDERING_IMPORT: "Considering import",
};

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csvRow(values: string[]): string {
  return values.map(csvField).join(",") + "\r\n";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const entries = await prisma.collectionEntry.findMany({
    where: { userId: session.user.id },
    include: { gameRevision: { include: { game: true } } },
    orderBy: { createdAt: "asc" },
  });

  const header = csvRow([
    "Title",
    "Publisher",
    "Status",
    "Cart Region",
    "Region-Free Status",
    "Cartridge Format",
    "Languages",
    "Notes",
  ]);

  const rows = entries
    .map((entry) => {
      const r = entry.gameRevision;
      return csvRow([
        r.game.title,
        r.game.publisher,
        STATUS_LABELS[entry.status] ?? entry.status,
        CART_REGION_LABELS[r.regionOfCart as CartRegion] ?? r.regionOfCart,
        REGION_FREE_LABELS[r.regionFree] ?? r.regionFree,
        CARTRIDGE_FORMAT_LABELS[r.cartridgeFormat] ?? r.cartridgeFormat,
        parseLanguages(r.languages).join("; "),
        r.notes ?? "",
      ]);
    })
    .join("");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="torashelf-collection.csv"',
    },
  });
}
