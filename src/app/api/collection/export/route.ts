import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  CART_REGION_LABELS,
  CARTRIDGE_FORMAT_LABELS,
  PLATFORM_LABELS,
  REGION_FREE_LABELS,
  parseLanguages,
  type CartRegion,
  type CartridgeFormat,
  type Platform,
  type RegionFree,
} from "@/lib/enums";

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
    "Platform",
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
        PLATFORM_LABELS[r.platform as Platform] ?? r.platform,
        CART_REGION_LABELS[r.regionOfCart as CartRegion] ?? r.regionOfCart,
        REGION_FREE_LABELS[r.regionFree as RegionFree] ?? r.regionFree,
        CARTRIDGE_FORMAT_LABELS[r.cartridgeFormat as CartridgeFormat] ?? r.cartridgeFormat,
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
