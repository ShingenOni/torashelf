# Claude Code Prompt: Switch Region-Free & Language Database App

Copy everything below the line into Claude Code (or paste as your first message) to kick off the build.

---

## Project Overview

Build a web application for tracking Nintendo Switch physical game cartridges — specifically whether each game is **region-free** and which **languages** it supports. Many collectors buy physical games specifically to avoid being locked into digital-only ecosystems, but region-free status and language support vary per game and sometimes per regional print. There's no single well-maintained source for this info today.

## Core Features (build in this order)

### 1. Data Model / Database
Set up a database (SQLite for local dev is fine to start) with a `games` table containing:
- `id`, `title`, `publisher`, `release_date`
- `region_free` (boolean or enum: `region_free`, `region_locked`, `unknown`)
- `region_of_cart` (e.g. US, EU, JP, Asia — the print region this entry describes)
- `languages` (array/JSON: which languages are supported)
- `language_locked_to_region` (boolean — does language depend on cart print vs. console system settings?)
- `data_source` (enum: `scraped`, `community_verified`, `unverified_submission`)
- `source_citation` (text/URL — where this data came from)
- `last_updated`

Also include a `game_revisions` table for cases where a later print/patch changed language support (same game, different cart revision).

### 2. Game Database Browse/Search UI
- Searchable, filterable list of games (filter by region-free status, language, publisher)
- Game detail page showing all known regional prints/revisions of that title side by side
- Visual badge system distinguishing scraped/unverified data from community-verified data

### 3. Community Submission & Verification
- Logged-in users can submit new entries or corrections
- Simple confirm/dispute voting on existing entries
- Optional: require a screenshot/photo upload as evidence for disputed entries
- Submissions default to "unverified" status until some threshold of community confirmation

### 4. Personal Collection Tracker
- User accounts with a personal library: mark games as "owned," "wishlist," or "considering import"
- Dashboard view: "these owned games are language-locked to my region" / "these are safe to import"
- Simple auth (email/password or magic link is fine for MVP)

### 5. Scraping/Seed Script
- Write a script to seed the initial database from publicly available sources (you may need to ask me for specific source URLs, or use placeholder/sample data if sources aren't accessible in this environment)
- Structure it so scraped entries are clearly marked as `data_source: scraped` and lower-trust until community-verified

## Tech Stack Preferences
- Feel free to recommend the stack you think fits best for a solo developer to maintain (e.g. Next.js + SQLite/Postgres + Prisma), but explain your reasoning before scaffolding the project
- Keep the frontend clean and functional over fancy — this is a utility/reference tool first

## Build Approach
1. Start by proposing the tech stack and data model, and confirm with me before scaffolding
2. Build the database schema and seed script with sample data (5-10 example games) so the UI has something to render
3. Build the browse/search UI against the seed data
4. Add the community submission/verification flow
5. Add user accounts and the personal collection tracker last

## Out of Scope for MVP
- Other consoles (PS/Xbox) — Switch only for now
- Native mobile apps — web app only, but should be mobile-responsive since people may check it in-store
- Payments/monetization

Ask me clarifying questions before making major architectural decisions, and check in after each numbered step above before moving to the next.
