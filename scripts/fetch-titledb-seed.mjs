// One-time (re-runnable) fetch/transform script: pulls real Switch title
// data from public sources and writes a curated static snapshot at
// prisma/seed-data.json. `prisma/seed.ts` reads that snapshot — it does NOT
// re-scrape on every `prisma db seed`, since re-downloading ~200MB of
// titledb JSON and re-scraping HTML on every seed run would be slow and
// fragile (network dependency, breaks if page markup changes).
//
// Usage: node scripts/fetch-titledb-seed.mjs
//
// Sources:
// - nsw-titledb (https://github.com/ch0c01dxyz/nsw-titledb): primary source,
//   structured per-region eShop metadata pulled from Nintendo's backend.
// - NintendoSoup's first-party language tracker: legacy (2017-era) table,
//   used to add a handful of launch-window titles with genuine
//   region-locked-language examples that titledb's per-region matching
//   didn't independently confirm as cleanly.
// - Perfectly Nintendo's "English option in Japan" list: used only to
//   corroborate JP-region language data for titles already selected above,
//   not as a source of new titles.
//
// Everything produced here is tagged dataSource: "SCRAPED" — automated,
// lower-trust tier until community-confirmed, same as the rest of the app's
// scraped data.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache", "titledb");
const OUT_FILE = path.join(ROOT, "prisma", "seed-data.json");

const TITLEDB_BASE = "https://raw.githubusercontent.com/ch0c01dxyz/nsw-titledb/master";
const REGION_FILES = {
  US: "US.en.json",
  JP: "JP.ja.json",
  EU: "DE.de.json",
  ASIA: "HK.zh.json",
};
const TITLEDB_CITATION = "https://github.com/ch0c01dxyz/nsw-titledb";

const NINTENDOSOUP_URL =
  "https://nintendosoup.com/first-party-nintendo-switch-games-listed-language-support-region/";
const PERFECTLY_NINTENDO_URL =
  "https://www.perfectly-nintendo.com/nintendo-switch-list-of-games-with-english-language-option-in-japan/";

// Curated, recognizable retail titles — enough real variety (multi-language
// EU/world-edition carts, JP-region-only prints) to exercise the app without
// importing the entire eShop catalog into a small local dev database.
const TITLEDB_TITLES = [
  "The Legend of Zelda: Breath of the Wild",
  "The Legend of Zelda: Tears of the Kingdom",
  "Super Mario Odyssey",
  "Mario Kart 8 Deluxe",
  "Splatoon 3",
  "Metroid Dread",
  "Xenoblade Chronicles 3",
  "Fire Emblem: Three Houses",
  "Pokémon Scarlet",
  "Pokémon Violet",
  "Dragon Quest XI S",
  "Persona 5 Royal",
  "Octopath Traveler",
  "Bayonetta 3",
  "Kirby and the Forgotten Land",
  "Super Smash Bros. Ultimate",
  "Monster Hunter Rise",
  "Animal Crossing: New Horizons",
];

// Known publisher for a few titledb matches whose eShop `publisher` field
// comes back in a non-Latin script (JP entries) — used for cross-region
// consistency only, since Game.title/publisher are shared across revisions.
const PUBLISHER_OVERRIDES = {
  "Octopath Traveler": "Square Enix",
};

// A couple of raw eShop listing names come through stylized (ALL CAPS,
// localized subtitle, etc.) — override with the commonly known English title.
const TITLE_OVERRIDES = {
  "Dragon Quest XI S": "Dragon Quest XI S: Echoes of an Elusive Age – Definitive Edition",
};

const LANG_CODE_MAP = {
  ja: "JA",
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  nl: "NL",
  ru: "RU",
  ko: "KO",
  zh: "ZH",
  pt: "PT",
};

const LANG_NAME_MAP = {
  english: "EN",
  japanese: "JA",
  spanish: "ES",
  french: "FR",
  italian: "IT",
  german: "DE",
  dutch: "NL",
  russian: "RU",
  portuguese: "PT",
  korean: "KO",
  chinese: "ZH",
  "traditional chinese": "ZH",
  "simplified chinese": "ZH",
};

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanTitle(name) {
  return name.replace(/[™®©]/g, "").trim();
}

function mapLanguages(codes) {
  const mapped = codes.map((c) => LANG_CODE_MAP[c.toLowerCase()]).filter(Boolean);
  return Array.from(new Set(mapped));
}

function yyyymmddToIso(n) {
  if (!n) return null;
  const s = String(n);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

async function downloadIfMissing(url, destPath) {
  try {
    await readFile(destPath);
    console.error(`cached: ${path.basename(destPath)}`);
    return;
  } catch {
    // not cached, fall through to download
  }
  console.error(`downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function loadTitledbRegions() {
  await mkdir(CACHE_DIR, { recursive: true });
  const regionData = {};
  for (const [region, file] of Object.entries(REGION_FILES)) {
    const dest = path.join(CACHE_DIR, file);
    await downloadIfMissing(`${TITLEDB_BASE}/${file}`, dest);
    const raw = await readFile(dest, "utf8");
    regionData[region] = Object.values(JSON.parse(raw));
  }
  return regionData;
}

function findBestMatch(entries, title) {
  const target = normalize(title);
  let prefixMatch = null;
  for (const e of entries) {
    if (!e || e.isDemo || !e.name || !e.publisher) continue;
    const name = normalize(e.name);
    if (name === target) return e;
    if (!prefixMatch && name.startsWith(target)) prefixMatch = e;
  }
  return prefixMatch;
}

function inferLanguageLocked(regionMatches) {
  const langSets = regionMatches.map((m) => mapLanguages(m.languages || []));
  if (langSets.length > 1) {
    const key = (langs) => [...langs].sort().join(",");
    const first = key(langSets[0]);
    const allSame = langSets.every((l) => key(l) === first);
    return !allSame;
  }
  // Single region only: a broad set that already bundles Japanese with
  // several Western languages is a strong signal of one world-edition
  // release rather than a region-specific print.
  const langs = langSets[0] ?? [];
  if (langs.includes("JA") && langs.length >= 4) return false;
  return true;
}

async function buildFromTitledb() {
  const regionData = await loadTitledbRegions();
  const games = [];

  for (const title of TITLEDB_TITLES) {
    const matches = [];
    for (const region of Object.keys(REGION_FILES)) {
      const m = findBestMatch(regionData[region], title);
      if (m) matches.push({ region, entry: m });
    }
    if (matches.length === 0) {
      console.error(`titledb: NO MATCH for "${title}"`);
      continue;
    }

    const languageLocked = inferLanguageLocked(matches.map((m) => m.entry));
    const canonical = matches.find((m) => m.region === "US") ?? matches.find((m) => m.region === "EU") ?? matches[0];

    games.push({
      title: TITLE_OVERRIDES[title] ?? cleanTitle(canonical.entry.name),
      publisher: PUBLISHER_OVERRIDES[title] ?? cleanTitle(canonical.entry.publisher),
      releaseDate: yyyymmddToIso(canonical.entry.releaseDate),
      revisions: matches.map(({ region, entry }) => ({
        regionOfCart: region,
        regionFree: "REGION_FREE",
        languages: mapLanguages(entry.languages || []),
        languageLockedToRegion: languageLocked,
        dataSource: "SCRAPED",
        sourceCitation: TITLEDB_CITATION,
        notes: null,
      })),
    });
  }

  return games;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function buildFromNintendoSoup() {
  const html = await fetchText(NINTENDOSOUP_URL);
  const tableStart = html.indexOf("<table");
  const tableEnd = html.indexOf("</table>") + 8;
  const table = html.slice(tableStart, tableEnd);

  const rowRegex = /<tr class="row-\d+">\s*<td class="column-1">([^<]+)<\/td><td class="column-2">([^<]+)<\/td><td class="column-3">([^<]+)<\/td>/g;

  const games = [];
  let m;
  while ((m = rowRegex.exec(table))) {
    const [, title, usEur, jp] = m;
    const usLangs = mapLanguages(
      usEur.split(",").map((s) => LANG_NAME_MAP[s.trim().toLowerCase()]).filter(Boolean).map((c) => c.toLowerCase()),
    );
    const jpLangs = mapLanguages(
      jp.split(",").map((s) => LANG_NAME_MAP[s.trim().toLowerCase()]).filter(Boolean).map((c) => c.toLowerCase()),
    );
    if (usLangs.length === 0 || jpLangs.length === 0) continue;

    const key = (langs) => [...langs].sort().join(",");
    const languageLocked = key(usLangs) !== key(jpLangs);

    games.push({
      title: title.trim(),
      publisher: "Nintendo",
      releaseDate: null, // not listed on the source page; left unset rather than guessed
      revisions: [
        {
          regionOfCart: "US",
          regionFree: "REGION_FREE",
          languages: usLangs,
          languageLockedToRegion: languageLocked,
          dataSource: "SCRAPED",
          sourceCitation: NINTENDOSOUP_URL,
          notes: "From a 2017-era language tracker — may not reflect later patches.",
        },
        {
          regionOfCart: "JP",
          regionFree: "REGION_FREE",
          languages: jpLangs,
          languageLockedToRegion: languageLocked,
          dataSource: "SCRAPED",
          sourceCitation: NINTENDOSOUP_URL,
          notes: "From a 2017-era language tracker — may not reflect later patches.",
        },
      ],
    });
  }
  return games;
}

async function fetchPerfectlyNintendoIndex() {
  const html = await fetchText(PERFECTLY_NINTENDO_URL);
  const liRegex =
    /<li>([^<]*?)\s*\(([^)]+)\):[^[]*\[<a[^>]*>web eShop<\/a>\]\s*\[([^\]]+)\]<\/li>/g;
  const index = new Map();
  let m;
  while ((m = liRegex.exec(html))) {
    const title = m[1].trim();
    index.set(normalize(title), true);
  }
  return index;
}

async function crossCheckWithPerfectlyNintendo(games) {
  let index;
  try {
    index = await fetchPerfectlyNintendoIndex();
  } catch (err) {
    console.error(`Perfectly Nintendo fetch failed, skipping cross-check: ${err.message}`);
    return games;
  }

  for (const game of games) {
    if (!index.has(normalize(game.title))) continue;
    for (const rev of game.revisions) {
      if (rev.regionOfCart === "JP") {
        const corroboration = "JP English option corroborated by Perfectly Nintendo's tracker.";
        rev.notes = rev.notes ? `${rev.notes} ${corroboration}` : corroboration;
      }
    }
  }
  return games;
}

async function main() {
  const titledbGames = await buildFromTitledb();
  const nintendoSoupGames = await buildFromNintendoSoup();

  const seen = new Set(titledbGames.map((g) => normalize(g.title)));
  const merged = [...titledbGames, ...nintendoSoupGames.filter((g) => !seen.has(normalize(g.title)))];

  const withCrossCheck = await crossCheckWithPerfectlyNintendo(merged);

  await writeFile(OUT_FILE, JSON.stringify(withCrossCheck, null, 2));
  console.error(`\nWrote ${withCrossCheck.length} games to ${path.relative(ROOT, OUT_FILE)}`);
  console.error(`Total revisions: ${withCrossCheck.reduce((n, g) => n + g.revisions.length, 0)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
