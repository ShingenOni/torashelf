// Coverage-audit script — NOT a seed-data importer, unlike its sibling
// fetch-titledb-seed.mjs. Wikipedia's "List of Nintendo Switch games" is
// title-level only: no region, language, or cartridge-format data, so it
// can't feed the seed pipeline directly. What it CAN do is catch titles
// with a confirmed physical release that our current catalog is missing
// entirely.
//
// IMPORTANT finding from building this: Wikipedia's list is split across 7
// alphabetical sub-pages, and only the smallest one ("0–9", 82 titles) has
// the "Options" column that flags digital-only titles. The other 6 pages
// (4,020 of the 4,102 total titles) have NO physical/digital signal in
// their table structure at all — an inconsistency between how different
// editors maintain different sub-pages, not something documented anywhere.
// Treating "no Options column" as "confirmed physical" would silently
// misclassify digital-only titles on 98% of the list. Instead, this script
// cross-references every Wikipedia title against physicalreleases.com's
// allowlist (the same reliable physical-confirmation source
// fetch-titledb-seed.mjs already trusts) and buckets results by confidence:
// - confirmedPhysicalGaps: physical status confirmed by Wikipedia's Options
//   column OR by physicalreleases.com — safe to research and add.
// - unverifiedGaps: on Wikipedia, missing from our catalog, but neither
//   signal confirms it's physical (could be digital-only, could just be
//   unconfirmed) — needs manual verification before adding, not implied to
//   be physical the way the confirmed bucket is.
//
// Written as .ts run via tsx (not plain node, unlike fetch-titledb-seed.mjs)
// because it needs to query the current catalog to diff against, and the
// generated Prisma client (src/generated/prisma) is TypeScript source with
// no compiled JS output — plain `node` can't import it.
//
// Usage: npx tsx scripts/find-wikipedia-coverage-gaps.ts

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_FILE = path.join(ROOT, "prisma", "wikipedia-coverage-gaps.json");

const SUB_PAGES = [
  "List of Nintendo Switch games (0–9)",
  "List of Nintendo Switch games (A–Am)",
  "List of Nintendo Switch games (An–Az)",
  "List of Nintendo Switch games (B)",
  "List of Nintendo Switch games (C–G)",
  "List of Nintendo Switch games (H–P)",
  "List of Nintendo Switch games (Q–Z)",
];

const API_BASE = "https://en.wikipedia.org/w/api.php";
const PHYSICAL_RELEASES_URL =
  "https://www.physicalreleases.com/p/nintendo-switch-physical-release-summary.html";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, code: string) => {
    if (code[0] === "#") {
      const codePoint = code[1] === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[code] ?? match;
  });
}

function stripTags(html: string): string {
  // Wikipedia embeds inline <style> blocks (TemplateStyles, e.g. for the
  // "vanchor" citation-jump highlighting) directly inside table cells —
  // their CSS text isn't real content and must be discarded along with the
  // tag, not just have the tag markers stripped like everything else.
  const withoutStyleBlocks = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
  return decodeEntities(withoutStyleBlocks.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function fetchPageHtml(title: string): Promise<string> {
  const url = `${API_BASE}?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch "${title}": ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Wikipedia API error for "${title}": ${data.error.info}`);
  return data.parse.text["*"];
}

type WikipediaEntry = {
  title: string;
  publisher: string;
  releaseDate: string;
  // true/false only when this page's table actually has the Options
  // column (currently just the "0–9" page); null everywhere else, meaning
  // "unknown", not "physical".
  isDigitalOnly: boolean | null;
};

function parseSoftwareList(html: string): WikipediaEntry[] {
  const tableStart = html.indexOf('id="softwarelist"');
  if (tableStart === -1) return [];
  const tableOpenStart = html.lastIndexOf("<table", tableStart);
  const tableEnd = html.indexOf("</table>", tableStart);
  const table = html.slice(tableOpenStart, tableEnd);

  const headerEnd = table.indexOf("</tr>");
  const header = table.slice(0, headerEnd);
  const headerCols = [...header.matchAll(/<th scope="col"[^>]*>([^<\n]+)/g)].map((m) => m[1].trim());
  const optionsColumnIndex = headerCols.indexOf("Options") - 1; // -1: Title isn't a <td>

  const entries: WikipediaEntry[] = [];
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;
  let skippedMalformed = 0;

  while ((rowMatch = rowRegex.exec(table))) {
    const row = rowMatch[1];
    const titleMatch = row.match(/<th[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/);
    if (!titleMatch) continue; // header row, no scope="row" cell

    const title = stripTags(titleMatch[1]);
    if (!title) continue;

    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(row))) {
      cells.push(cellMatch[1]);
    }
    if (cells.length < 3) {
      skippedMalformed++;
      continue;
    }

    entries.push({
      title,
      publisher: stripTags(cells[1] ?? ""),
      releaseDate: stripTags(cells[2] ?? ""),
      isDigitalOnly:
        optionsColumnIndex >= 0 && cells[optionsColumnIndex] !== undefined
          ? /\bD\b/.test(stripTags(cells[optionsColumnIndex]))
          : null,
    });
  }

  if (skippedMalformed > 0) {
    console.error(`  skipped ${skippedMalformed} row(s) with too few columns`);
  }
  return entries;
}

async function fetchAllWikipediaTitles(): Promise<WikipediaEntry[]> {
  const all: WikipediaEntry[] = [];
  for (const page of SUB_PAGES) {
    console.error(`fetching: ${page}`);
    const html = await fetchPageHtml(page);
    const entries = parseSoftwareList(html);
    const digitalKnown = entries.filter((e) => e.isDigitalOnly !== null).length;
    console.error(
      `  ${entries.length} titles (digital/physical known for ${digitalKnown}, ` +
        `${entries.filter((e) => e.isDigitalOnly === true).length} flagged digital-only)`,
    );
    all.push(...entries);
  }
  return all;
}

// Same allowlist source and regex fetch-titledb-seed.mjs already relies on
// as the one signal in that whole pipeline that reliably distinguishes "had
// a real cartridge" from "eShop-only" — reused here rather than trusting
// Wikipedia's inconsistent per-page marking.
async function fetchPhysicalReleaseTitles(): Promise<Set<string>> {
  const html = await fetchText(PHYSICAL_RELEASES_URL);
  const optRegex = /<option value="">\s*\d+\s*-\s*([^<\t]+?)\s*<\/option>/g;
  const titles = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = optRegex.exec(html))) {
    titles.add(normalize(m[1].trim()));
  }
  return titles;
}

async function main() {
  const [wikipediaEntries, physicalReleaseTitles, currentGames] = await Promise.all([
    fetchAllWikipediaTitles(),
    fetchPhysicalReleaseTitles(),
    prisma.game.findMany({ select: { title: true } }),
  ]);
  console.error(`\nTotal Wikipedia titles: ${wikipediaEntries.length}`);
  console.error(`physicalreleases.com allowlist: ${physicalReleaseTitles.size} titles`);
  console.error(`Current catalog: ${currentGames.length} games`);

  const currentTitles = new Set(currentGames.map((g) => normalize(g.title)));

  const seen = new Set<string>();
  const confirmedPhysicalGaps: WikipediaEntry[] = [];
  const unverifiedGaps: WikipediaEntry[] = [];

  for (const entry of wikipediaEntries) {
    const key = normalize(entry.title);
    if (seen.has(key) || currentTitles.has(key) || entry.isDigitalOnly === true) continue;
    seen.add(key);

    const confirmedPhysical = entry.isDigitalOnly === false || physicalReleaseTitles.has(key);
    (confirmedPhysical ? confirmedPhysicalGaps : unverifiedGaps).push(entry);
  }

  confirmedPhysicalGaps.sort((a, b) => a.title.localeCompare(b.title));
  unverifiedGaps.sort((a, b) => a.title.localeCompare(b.title));

  console.error(`\nConfirmed-physical gaps (safe to research/add): ${confirmedPhysicalGaps.length}`);
  console.error(`Unverified gaps (physical status unknown, needs manual check): ${unverifiedGaps.length}`);

  await writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: [
          "https://en.wikipedia.org/wiki/List_of_Nintendo_Switch_games",
          PHYSICAL_RELEASES_URL,
        ],
        note:
          "Title-level candidates only — no region/language/cartridge-format data. " +
          "confirmedPhysicalGaps have physical release confirmed by Wikipedia's Options " +
          "column or physicalreleases.com's allowlist. unverifiedGaps appear on Wikipedia " +
          "and are missing from our catalog, but neither source confirms physical release " +
          "— could be digital-only, verify before adding. Every entry still needs full " +
          "print-level data (region, language, cartridge format) through the normal " +
          "submission/matching pipeline before being added to the catalog.",
        wikipediaTitleCount: wikipediaEntries.length,
        currentCatalogCount: currentGames.length,
        confirmedPhysicalGapCount: confirmedPhysicalGaps.length,
        unverifiedGapCount: unverifiedGaps.length,
        confirmedPhysicalGaps,
        unverifiedGaps,
      },
      null,
      2,
    ),
  );
  console.error(`\nWrote results to ${path.relative(ROOT, OUT_FILE)}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
