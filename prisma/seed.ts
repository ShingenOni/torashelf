import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/db";

type RevisionSeed = {
  regionOfCart: string;
  regionFree: string;
  languages: string[];
  languageLockedToRegion: boolean;
  dataSource: string;
  sourceCitation?: string;
  notes?: string;
};

type GameSeed = {
  title: string;
  publisher: string;
  releaseDate: string | null;
  revisions: RevisionSeed[];
};

// prisma/seed-data.json is a curated real-data snapshot produced by
// scripts/fetch-titledb-seed.mjs (nsw-titledb + NintendoSoup + Perfectly
// Nintendo). Re-run that script to refresh it — this file just loads it.
const games: GameSeed[] = JSON.parse(
  readFileSync(path.join(__dirname, "seed-data.json"), "utf8"),
);

async function main() {
  console.log("Seeding database...");

  await prisma.collectionEntry.deleteMany();
  await prisma.submissionVote.deleteMany();
  await prisma.gameRevision.deleteMany();
  await prisma.game.deleteMany();

  for (const g of games) {
    await prisma.game.create({
      data: {
        title: g.title,
        publisher: g.publisher,
        releaseDate: g.releaseDate ? new Date(g.releaseDate) : null,
        revisions: {
          create: g.revisions.map((r) => ({
            regionOfCart: r.regionOfCart,
            regionFree: r.regionFree,
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

  console.log(`Seeded ${games.length} games.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
