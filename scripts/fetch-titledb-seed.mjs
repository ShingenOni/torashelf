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
// - physicalreleases.com's Switch summary: a numbered, actively-updated list
//   of every game that actually got a physical release. This is the
//   allowlist — nsw-titledb is pure eShop metadata with ~20K+ entries, no
//   field indicating physical-release status, and the overwhelming majority
//   of the eShop catalog is digital-only indie titles. Without this
//   allowlist, a broad titledb import would mislabel thousands of
//   digital-only games as physical cartridges.
// - nsw-titledb (https://github.com/ch0c01dxyz/nsw-titledb): structured
//   per-region eShop metadata, matched by titleId once a title clears the
//   physical-release allowlist above.
// - Deku Deals' Game-Key Card list: cross-referenced so allowlisted titles
//   that are actually Switch 2 Game-Key Card releases get cartridgeFormat
//   set correctly instead of defaulting to FULL_CARTRIDGE.
// - NintendoSoup's first-party language tracker: legacy (2017-era) table,
//   kept as a fallback for a handful of titles with genuine
//   region-locked-language examples; skipped if already covered above.
// - Perfectly Nintendo's "English option in Japan" list: corroborates
//   JP-region language data for titles already selected, not a title source.
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
const UNMATCHED_FILE = path.join(ROOT, "prisma", "unmatched-physical-releases.json");
const WIKIPEDIA_GAPS_FILE = path.join(ROOT, "prisma", "wikipedia-coverage-gaps.json");

const TITLEDB_BASE = "https://raw.githubusercontent.com/ch0c01dxyz/nsw-titledb/master";
const REGION_FILES = {
  US: "US.en.json",
  JP: "JP.ja.json",
  EU: "DE.de.json",
  ASIA: "HK.zh.json",
};
const TITLEDB_CITATION = "https://github.com/ch0c01dxyz/nsw-titledb";

const PHYSICAL_RELEASES_URL =
  "https://www.physicalreleases.com/p/nintendo-switch-physical-release-summary.html";
const DEKU_DEALS_GKC_URL = "https://www.dekudeals.com/guides/about-game-key-card-games";
const NINTENDOSOUP_URL =
  "https://nintendosoup.com/first-party-nintendo-switch-games-listed-language-support-region/";
const PERFECTLY_NINTENDO_URL =
  "https://www.perfectly-nintendo.com/nintendo-switch-list-of-games-with-english-language-option-in-japan/";

// A handful of raw eShop listing names come through stylized (ALL CAPS,
// localized subtitle, etc.) — override with the commonly known English
// title. Doesn't scale to a catalog-wide import, so kept small and specific;
// the ALL-CAPS heuristic in cleanTitle() handles the general case.
const TITLE_OVERRIDES = {
  "dragon quest xi s": "Dragon Quest XI S: Echoes of an Elusive Age – Definitive Edition",
};
const PUBLISHER_OVERRIDES = {
  "octopath traveler": "Square Enix",
};

// JP-region listings are almost always in Japanese script, so name-based
// matching against an English title never finds them — most titles are
// instead recovered via a shared titleId with the US/EU entry. A handful of
// JP releases are handled by a different regional publisher/port and get a
// genuinely different titleId, so those need a manually verified override.
const JP_ID_OVERRIDES = {
  "persona 5 royal": "0100B880154FC000", // アトラス (Atlus) JP listing, JA-only
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
  const stripped = name.replace(/[™®©]/g, "").trim();
  // A handful of raw eShop listings are stylized in ALL CAPS — Title Case
  // them for display rather than maintaining per-title overrides at scale.
  if (stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped)) {
    return stripped.replace(/\w\S*/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
  }
  return stripped;
}

function mapLanguages(codes) {
  const mapped = codes.map((c) => LANG_CODE_MAP[c.toLowerCase()]).filter(Boolean);
  return Array.from(new Set(mapped));
}

// physicalreleases.com catalogues ~160+ titles in library-style "Title, The"
// order (e.g. "Legend of Zelda: Tears of the Kingdom, The") for alphabetical
// sorting. titledb's own name field always uses natural word order ("The
// Legend of Zelda..."), so exact matching misses every one of these unless
// we also try the article moved back to the front.
function withLeadingArticleVariant(title) {
  const m = title.match(/^(.*),\s*(The|A|An)$/i);
  if (!m) return null;
  return `${m[2]} ${m[1]}`;
}

function yyyymmddToIso(n) {
  if (!n) return null;
  const s = String(n);
  // A handful of titledb entries only have a bare year (e.g. "2024" for an
  // announced-but-undated release) rather than a full YYYYMMDD value —
  // slicing that blindly produces a malformed date like "2024--". Require
  // all three parts to be genuinely present.
  if (s.length < 8) return null;
  const year = s.slice(0, 4);
  const month = s.slice(4, 6);
  const day = s.slice(6, 8);
  if (month === "00" || day === "00") return null;
  const iso = `${year}-${month}-${day}`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
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
    regionData[region] = Object.values(JSON.parse(raw)).filter((e) => e && !e.isDemo);
  }
  return regionData;
}

// Builds O(1) lookup indices once per region instead of re-scanning tens of
// thousands of entries per title — the catalog-scale import needs this.
function buildRegionIndex(entries) {
  const byId = new Map();
  const byName = new Map();
  for (const e of entries) {
    if (!e.name || !e.publisher) continue;
    // A surprising number of titledb entries have a null/missing id. If we
    // indexed that, every such entry would collide on the same Map key and
    // an unrelated title's data would silently "match" through byId lookups
    // for anything else that also lacks an id — found this via a real
    // Princess Peach: Showtime! entry with id: null contaminating dozens of
    // unrelated titles until this guard was added.
    if (e.id && !byId.has(e.id)) byId.set(e.id, e);
    const key = normalize(e.name);
    if (!byName.has(key)) byName.set(key, e);
  }
  return { byId, byName };
}

// Given an anchor entry (matched by English name, usually US), tries in
// order: (1) exact titleId match — reliable across regions since most
// titles share one application ID worldwide; (2) English-name match —
// catches the minority of JP/Asia listings that use a Latin title; (3) a
// manually verified override id for titles whose regional release
// genuinely has a different titleId.
function findRegionMatch(index, normTitle, anchor) {
  if (anchor && anchor.id) {
    const byId = index.byId.get(anchor.id);
    if (byId) return byId;
  }
  const byName = index.byName.get(normTitle);
  if (byName) return byName;

  const overrideId = JP_ID_OVERRIDES[normTitle];
  if (overrideId) {
    const byOverride = index.byId.get(overrideId);
    if (byOverride) return byOverride;
  }
  return null;
}

function inferLanguageLocked(regionEntries) {
  const langSets = regionEntries.map((e) => mapLanguages(e.languages || []));
  if (langSets.length > 1) {
    const key = (langs) => [...langs].sort().join(",");
    const first = key(langSets[0]);
    const allSame = langSets.every((l) => key(l) === first);
    return !allSame;
  }
  const langs = langSets[0] ?? [];
  if (langs.includes("JA") && langs.length >= 4) return false;
  return true;
}

// physicalreleases.com lists a numbered dropdown of every confirmed
// physical Switch release, most-recent first — the only signal in this
// whole pipeline that actually distinguishes "had a real cartridge" from
// "eShop-only." NSCollection.net looked like a natural alternative but its
// released.html is dead (Last-Modified: March 2018, ~117 games covering
// only the Switch's first year) — not usable as a current allowlist.
async function fetchPhysicalReleaseTitles() {
  const html = await fetchText(PHYSICAL_RELEASES_URL);
  const optRegex = /<option value="">\s*\d+\s*-\s*([^<\t]+?)\s*<\/option>/g;
  const titles = new Set();
  let m;
  while ((m = optRegex.exec(html))) {
    titles.add(m[1].trim());
  }
  return Array.from(titles);
}

// Second allowlist source, produced by scripts/find-wikipedia-coverage-gaps.ts
// — titles Wikipedia's "List of Nintendo Switch games" and/or
// physicalreleases.com already confirm have a real physical release, that
// weren't in our catalog when that audit ran. Missing the file (never run,
// or deleted) just means this source contributes nothing — not a hard
// dependency of this script.
async function loadWikipediaConfirmedTitles() {
  try {
    const raw = await readFile(WIKIPEDIA_GAPS_FILE, "utf8");
    const data = JSON.parse(raw);
    return (data.confirmedPhysicalGaps ?? []).map((g) => g.title);
  } catch {
    return [];
  }
}

async function fetchGameKeyCardTitles() {
  const html = await fetchText(DEKU_DEALS_GKC_URL);
  const regex = /<a class='main-link[^']*' href='\/items\/([^']+)'>\s*<h6[^>]*>([^<]+)<\/h6>/g;
  const titles = new Set();
  let m;
  while ((m = regex.exec(html))) {
    titles.add(normalize(m[2]));
  }
  return titles;
}

async function buildFromTitledb() {
  const [physicalReleaseTitles, wikipediaTitles, gameKeyCardTitles, regionData] = await Promise.all([
    fetchPhysicalReleaseTitles(),
    loadWikipediaConfirmedTitles(),
    fetchGameKeyCardTitles(),
    loadTitledbRegions(),
  ]);

  // Merge both allowlist sources, deduped by normalized title, tracking
  // provenance so a title that still doesn't match gets logged with which
  // source(s) flagged it — physicalreleases.com and Wikipedia largely
  // overlap (Wikipedia's own "confirmed" bucket was partly built by
  // checking physicalreleases.com in the first place), so most entries
  // carry both sources.
  const allowlist = new Map(); // normalized title -> { rawTitle, sources: Set<string> }
  for (const t of physicalReleaseTitles) {
    const key = normalize(t);
    if (!allowlist.has(key)) allowlist.set(key, { rawTitle: t, sources: new Set() });
    allowlist.get(key).sources.add(PHYSICAL_RELEASES_URL);
  }
  for (const t of wikipediaTitles) {
    const key = normalize(t);
    if (!allowlist.has(key)) allowlist.set(key, { rawTitle: t, sources: new Set() });
    allowlist.get(key).sources.add("wikipedia-coverage-gaps.json");
  }
  const physicalTitles = Array.from(allowlist.values());

  const indices = {};
  for (const region of Object.keys(REGION_FILES)) {
    indices[region] = buildRegionIndex(regionData[region]);
  }

  const games = [];
  const pushedKeys = new Set();
  const pushedAnchorIds = new Set();
  const unmatchedTitles = [];

  for (const { rawTitle, sources } of physicalTitles) {
    let normTitle = normalize(rawTitle);
    // The merged allowlist is already deduped by normalized title (unlike
    // the original single-source loop, which only had to worry about
    // physicalreleases.com's own occasional near-duplicate entries), but
    // this guard is still needed for the withLeadingArticleVariant() case
    // below, where two different raw strings can resolve to the same
    // matched title.
    if (pushedKeys.has(normTitle)) continue;

    let anchor = indices.US.byName.get(normTitle) ?? indices.EU.byName.get(normTitle);
    if (!anchor) {
      const articleVariant = withLeadingArticleVariant(rawTitle);
      if (articleVariant) {
        const altNormTitle = normalize(articleVariant);
        const altAnchor = indices.US.byName.get(altNormTitle) ?? indices.EU.byName.get(altNormTitle);
        if (altAnchor) {
          anchor = altAnchor;
          normTitle = altNormTitle;
        }
      }
    }
    if (!anchor) {
      unmatchedTitles.push({ title: rawTitle, sources: Array.from(sources) });
      continue;
    }
    // Some titles are catalogued twice under genuinely different names —
    // e.g. "Active Life: Outdoor Challenge" (US) and "Family Trainer" (its
    // EU/JP branding) resolve to the same titleId. Skip once that
    // underlying title has already produced a game, so it doesn't appear
    // twice under the same canonical name.
    if (anchor.id && pushedAnchorIds.has(anchor.id)) {
      pushedKeys.add(normTitle);
      continue;
    }

    const matches = [];
    for (const region of Object.keys(REGION_FILES)) {
      const entry = findRegionMatch(indices[region], normTitle, anchor);
      // A number of bundle/special-edition eShop listings (e.g. "Complete
      // Edition", "Trilogy" packs) have a genuinely empty languages field
      // in titledb itself — skip rather than store a revision with no
      // language data at all.
      if (entry && mapLanguages(entry.languages || []).length > 0) matches.push({ region, entry });
    }
    if (matches.length === 0) {
      pushedKeys.add(normTitle);
      continue;
    }

    const languageLocked = inferLanguageLocked(matches.map((m) => m.entry));
    const canonical = matches.find((m) => m.region === "US") ?? matches.find((m) => m.region === "EU") ?? matches[0];
    const cartridgeFormat = gameKeyCardTitles.has(normTitle) ? "GAME_KEY_CARD" : "FULL_CARTRIDGE";

    pushedKeys.add(normTitle);
    if (anchor.id) pushedAnchorIds.add(anchor.id);
    games.push({
      title: TITLE_OVERRIDES[normTitle] ?? cleanTitle(canonical.entry.name),
      publisher: PUBLISHER_OVERRIDES[normTitle] ?? cleanTitle(canonical.entry.publisher),
      releaseDate: yyyymmddToIso(canonical.entry.releaseDate),
      revisions: matches.map(({ region, entry }) => ({
        regionOfCart: region,
        regionFree: "REGION_FREE",
        cartridgeFormat,
        languages: mapLanguages(entry.languages || []),
        languageLockedToRegion: languageLocked,
        dataSource: "SCRAPED",
        sourceCitation: TITLEDB_CITATION,
        notes: null,
      })),
    });
  }

  console.error(`physicalreleases.com titles: ${physicalReleaseTitles.length}`);
  console.error(`Wikipedia confirmed-physical titles: ${wikipediaTitles.length}`);
  console.error(`merged allowlist (deduped): ${physicalTitles.length}`);
  console.error(`matched in titledb: ${games.length}`);
  console.error(`unmatched (not found in titledb US/EU catalog): ${unmatchedTitles.length}`);
  console.error(`flagged as Game-Key Card: ${games.filter((g) => g.revisions[0]?.cartridgeFormat === "GAME_KEY_CARD").length}`);

  return { games, unmatchedTitles };
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
          cartridgeFormat: "FULL_CARTRIDGE",
          languages: usLangs,
          languageLockedToRegion: languageLocked,
          dataSource: "SCRAPED",
          sourceCitation: NINTENDOSOUP_URL,
          notes: "From a 2017-era language tracker — may not reflect later patches.",
        },
        {
          regionOfCart: "JP",
          regionFree: "REGION_FREE",
          cartridgeFormat: "FULL_CARTRIDGE",
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

  let corroborated = 0;
  for (const game of games) {
    if (!index.has(normalize(game.title))) continue;
    for (const rev of game.revisions) {
      if (rev.regionOfCart === "JP") {
        const corroboration = "JP English option corroborated by Perfectly Nintendo's tracker.";
        rev.notes = rev.notes ? `${rev.notes} ${corroboration}` : corroboration;
        corroborated++;
      }
    }
  }
  console.error(`JP entries corroborated by Perfectly Nintendo: ${corroborated}`);
  return games;
}

async function main() {
  const { games: titledbGames, unmatchedTitles } = await buildFromTitledb();
  const nintendoSoupGames = await buildFromNintendoSoup();

  const seen = new Set(titledbGames.map((g) => normalize(g.title)));
  const merged = [...titledbGames, ...nintendoSoupGames.filter((g) => !seen.has(normalize(g.title)))];

  const withCrossCheck = await crossCheckWithPerfectlyNintendo(merged);

  await writeFile(OUT_FILE, JSON.stringify(withCrossCheck, null, 2));
  console.error(`\nWrote ${withCrossCheck.length} games to ${path.relative(ROOT, OUT_FILE)}`);
  console.error(`Total revisions: ${withCrossCheck.reduce((n, g) => n + g.revisions.length, 0)}`);

  // Physical-release titles that didn't resolve against titledb — likely
  // too recent for this titledb snapshot, or a naming convention this
  // script doesn't handle yet. Tracked so the gap isn't lost between
  // sessions; re-check periodically as titledb and this matching logic
  // both improve. `sources` records which allowlist(s) flagged each title,
  // now that there are two (physicalreleases.com and the Wikipedia audit).
  await writeFile(
    UNMATCHED_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: [PHYSICAL_RELEASES_URL, "wikipedia-coverage-gaps.json"],
        count: unmatchedTitles.length,
        titles: unmatchedTitles.sort((a, b) => a.title.localeCompare(b.title)),
      },
      null,
      2,
    ),
  );
  console.error(`Wrote ${unmatchedTitles.length} unmatched titles to ${path.relative(ROOT, UNMATCHED_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
