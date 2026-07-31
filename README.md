# ToraShelf

Track which Nintendo Switch cartridges are actually region-free, what languages they carry per print, and whether "physical" really means the game is on the cart — as opposed to a Game-Key Card or a digital-only listing.

## Stack

- Next.js (App Router) + TypeScript
- Prisma ORM, SQLite locally (`better-sqlite3` driver adapter)
- Auth.js (magic-link email, dev mode prints the link to the terminal instead of sending real email)
- Tailwind CSS

## Getting started

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Signing in during local dev doesn't send a real email — the magic link is printed to the terminal running `npm run dev`; copy it into your browser.

### Environment variables

See `.env` for local dev defaults. At minimum:

- `DATABASE_URL` — SQLite file path locally (`file:./dev.db`)
- `AUTH_SECRET` — Auth.js session/token signing secret (generate a new one for any real deployment: `openssl rand -base64 32`)

## Data

`prisma/seed-data.json` is a curated, real-data snapshot (not sample/placeholder data), built by `scripts/fetch-titledb-seed.mjs` from nsw-titledb, physicalreleases.com, Deku Deals, NintendoSoup, and Perfectly Nintendo. Re-run that script to refresh it — see the comments at the top of the script for how the sources fit together and what each is used for. Titles that couldn't be matched are logged in `prisma/unmatched-physical-releases.json` rather than silently dropped.

## Useful scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma studio` — browse the local database
- `node scripts/fetch-titledb-seed.mjs` — regenerate `prisma/seed-data.json` from public sources
