// Safe, additive counterpart to prisma/seed.ts. seed.ts wipes every game,
// revision, vote, collection entry, and report before rebuilding from
// prisma/seed-data.json — correct for the original pre-launch bootstrap
// against an empty database, but destructive now that the site has real
// users, submissions, votes, and correction history. This script instead
// diffs seed-data.json against the current catalog by title and creates
// only the games that don't already exist — everything else is left
// completely untouched.
//
// Usage: npx tsx scripts/apply-new-seed-games.ts

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/db";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type SeedRevision = {
  regionOfCart: string;
  regionFree: string;
  cartridgeFormat: string;
  languages: string[];
  languageLockedToRegion: boolean;
  dataSource: string;
  sourceCitation: string | null;
  notes: string | null;
};

type SeedGame = {
  title: string;
  publisher: string;
  releaseDate: string | null;
  revisions: SeedRevision[];
};

async function main() {
  const seedRaw = await readFile("prisma/seed-data.json", "utf8");
  const seed: SeedGame[] = JSON.parse(seedRaw);

  const beforeCount = await prisma.game.count();
  const currentGames = await prisma.game.findMany({ select: { title: true } });
  const currentTitles = new Set(currentGames.map((g) => normalize(g.title)));

  const newGames = seed.filter((g) => !currentTitles.has(normalize(g.title)));

  console.log(`Current catalog: ${beforeCount} games`);
  console.log(`seed-data.json: ${seed.length} games`);
  console.log(`New games to insert: ${newGames.length}`);
  if (newGames.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }
  for (const g of newGames) {
    console.log(`  - ${g.title} (${g.revisions.length} revision(s))`);
  }

  for (const g of newGames) {
    await prisma.game.create({
      data: {
        title: g.title,
        publisher: g.publisher,
        releaseDate: g.releaseDate ? new Date(g.releaseDate) : null,
        revisions: {
          create: g.revisions.map((r) => ({
            regionOfCart: r.regionOfCart,
            regionFree: r.regionFree,
            cartridgeFormat: r.cartridgeFormat,
            languages: JSON.stringify(r.languages),
            languageLockedToRegion: r.languageLockedToRegion,
            dataSource: r.dataSource,
            sourceCitation: r.sourceCitation,
            notes: r.notes,
          })),
        },
      },
    });
  }

  const afterCount = await prisma.game.count();
  console.log(`\nInserted ${newGames.length} games.`);
  console.log(`Catalog: ${beforeCount} -> ${afterCount} (expected +${newGames.length})`);
  if (afterCount !== beforeCount + newGames.length) {
    console.error("WARNING: final count doesn't match expected — investigate before trusting this run.");
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
