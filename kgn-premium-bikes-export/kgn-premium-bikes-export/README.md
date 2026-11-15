# KGN Premium Bikes — Website Code & Developer Handover

This folder is the complete source code of the **KGN Premium Bikes** website,
exported for keeping, opening in an IDE (VS Code etc.), pushing to GitHub, and
hosting online. It has been adapted so it can run **standalone** — it no longer
needs the Muse/Hatch platform it was originally built on. Read
“What was changed for standalone hosting” (§7) before changing the plumbing.

---

## 1. What this project is

**KGN Premium Bikes** — a multi-brand premium motorcycle dealership in
Proddatur, Andhra Pradesh, **since 1997**:

> Opposite Panduranga Temple, Mydukur Road, Proddatur – 516360, Andhra Pradesh
> Call 8106900126 · WhatsApp 9133091389 / 8106900126 · Instagram @kgn_premium_bikes

The site is a full dealership platform, not a static page:

- **Public catalog** of bikes (Royal Enfield, KTM, Honda, Bajaj, Hero, Yamaha,
  TVS…) with search, filters (brand, price, cc, year, condition) and sorting
- **Bike detail pages** — photo gallery (multiple photos, ordered), full
  specifications, Instagram reel section, walkaround video, and sticky
  **Chat / WhatsApp / Call** enquiry buttons
- **Customer accounts** — sign up with username + mobile number *or* Gmail +
  password (usernames are unique, checked live and again on the server),
  wishlist / saved bikes, enquiry & chat history, profile page with
  “My chats”, and change-password (form stays hidden until tapped)
- **In-site live chat** per bike/enquiry, with read/unread state
- **Customer reviews** — public reviews section; only signed-in customers can
  submit a review, and it appears publicly right away
- **Hidden Owner Portal** — no owner option is shown anywhere on the customer
  side. Owners open it by tapping the “KGN PREMIUM BIKES” logo at the top of
  the site **5 times quickly**, then sign in with their owner Gmail +
  password. Inside: metrics dashboard, inventory add/edit/archive
  (status Available / Booked / Sold), multiple photo upload from
  gallery/disk with drag/swap reordering (1, 2, 3, 4…), a prominent
  Instagram reel-link field per bike, lead pipeline (Hot/Warm/Cold,
  follow-ups, quick replies, CSV export), showroom settings, owner
  management (multiple owners, each their own Gmail + password), and
  **Our Family** — every signed-up customer, with a kept history of their
  profile changes (sign-up, password set/change, profile edits; password
  *values* are never recorded)
- **Home page extras** — auto-swiping featured-bikes hero (every 2 seconds),
  “Meet the family that runs your showroom” team section (Founder / CEO /
  Treasurer — **sample photos and descriptions for now**, replace with the
  real people), customer reviews, showroom section with Call/WhatsApp/
  Instagram branded cards and map, and a narrow “About ZENTRO Technologies”
  banner after the team section

Passwords (customers and owners) are stored only as salted SHA-256 hashes.
Owner sessions last 30 days and slide forward on each visit.

---

## 2. Tech stack (confirmed versions)

| Part | Technology |
|---|---|
| Language | TypeScript 5.6.3 (strict, ES2022) |
| Runtime / package manager / build | Bun 1.3.10 (`packageManager` in package.json) |
| Frontend | React 19.2.5 + React DOM 19.2.5, single-page app |
| Styling | Tailwind CSS 4.1.13 + tailwindcss-safe-area 1.3.0, Archivo fonts (Google Fonts) |
| Data fetching | TanStack React Query 5.100.10 via a typed action client |
| Backend | Server actions (`server/src/actions.ts`) — typed RPC: the client POSTs `{ action, args }` to `./actions`; inputs/outputs validated with Zod 4.4.3 |
| Database | SQLite via Drizzle ORM 0.45.2 (`drizzle-orm`), SQL migrations in `drizzle/` |
| Charts | Recharts 2.15.3 (owner dashboard metrics) |
| Photo storage | Local files (standalone) — see §7 |

This is **not** a Java project and not Next.js — it is a React + TypeScript
fullstack app. A web developer who knows React/TypeScript will find the
frontend, styling and database schema standard and easy to follow.

---

## 3. Folder structure

- `client/` — the React frontend. `client/src/App.tsx` is the whole UI (all
  pages & components); `client/src/main.tsx` is the React entry;
  `client/src/api.ts` is the typed action client (types come from the
  server); `client/src/theme.css` holds the Tailwind v4 theme, fonts and
  light/dark tokens; `client/src/globals.d.ts` declares asset modules;
  `client/src/assets/` holds bike photos (`bikes/*.jpg`) and team images
  (`team-*.webp`); `client/index.html` is the page shell;
  `client/build.mjs` is the build entry (calls the local SDK shim).
- `server/src/actions.ts` — ALL backend actions (catalog, accounts, chat,
  reviews, owner portal, settings…) plus the seed catalog and seeded
  showroom settings. `server/src/schema.ts` is the Drizzle SQLite schema
  (all tables).
- `drizzle/` — SQL migrations 0001–0009 + `meta/_journal.json`.
- `local/space-sdk/` — local replacement for the platform SDK, published
  under the name `@hatch/space-sdk`: `index.ts` (defineAction, z, Ctx
  types), `client.ts` (createActionClient, spaceQueryClient, fileToBase64),
  `build.ts` (buildClient() — Bun.build + Tailwind plugin), `runtime.ts`
  (local Ctx: SQLite file DB + local uploads blobs + migration runner).
- `standalone/` — `server.ts` (production server: /actions dispatch,
  /uploads, static client, SPA fallback) and `create-owner.ts` (one-time
  first-owner creation script).
- Root files: `package.json` / `bun.lock` (Bun dependencies & scripts),
  `bunfig.toml` (Bun install settings), `tsconfig.base.json` (shared strict
  TypeScript config), `space.json` (original platform metadata, reference
  only), `icon.webp` (site icon from the original build).
- `data/` — created at runtime (git-ignored): `app.db` + `uploads/`.

The `local/` and `standalone/` folders were added/adapted for standalone
hosting; everything else is the app's original source, unchanged except
the notes in §7.

---

## 4. Local setup (developer machine)

Prerequisites: **Bun** (from bun.sh). No other runtime is required;
SQLite is built into Bun.

Run: `bun install`, then `bun run build`, then `bun run start`.
The server listens on localhost port 3000 by default.

On first start the server creates `data/app.db`, applies all migrations
from `drizzle/` (tracked in a `__export_migrations` table), and seeds
itself from code on first use — the starter bike catalog and the showroom
contact settings live in `server/src/actions.ts` (the `CATALOG` list and
the settings seed inside `getSettings`), so a fresh database shows the
same 13 bikes / 7 brands and the real KGN contact details. There is
**no separate seed command** and no live customer data in this export
(see §9).

Create the **first owner account** (do this once):

`OWNER_PASSWORD='choose-a-strong-password' bun run setup:owner kijassi123@gmail.com`

- `kijassi123@gmail.com` is the owner's login email from the live site.
- **The password is set by the owner at setup** — no password from the live
  site is included in this export, ever. Pick the password when you run the
  command (or omit `OWNER_PASSWORD` and you will be prompted).
- The command calls the app's own `setupOwnerAccount` action, so the
  password is stored as the same salted hash the app uses. It refuses to
  overwrite an existing owner.
- More owners can be added later from inside the Owner Portal (Owners tab).

Useful scripts:

| Command | What it does |
|---|---|
| `bun run dev` | Build the client, then start the server (quick local run) |
| `bun run build` | Production client build → `client/dist/` |
| `bun run start` | Start the standalone server (PORT env, default 3000) |
| `bun run typecheck` | TypeScript check for client + server |
| `bun run setup:owner <email>` | Create the first owner (see above) |

To open the Owner Portal on the running site: tap the **“KGN PREMIUM BIKES”
logo 5 times quickly** → Owner sign-in → owner Gmail + password.

---

## 5. Hosting online

You need a host that can run a long-lived Bun process — a **VPS or a
Bun/Node app plan** (e.g. a Hostinger VPS / Node-capable plan).
**GitHub Pages cannot run this site** — it only serves static files, and
this app needs its server + database. GitHub is for storing the code (§6).

Recommended setup (VPS):

1. Install Bun on the server; clone/copy this folder to the server.
2. Run `bun install` and then `bun run build`.
3. Create the owner: `OWNER_PASSWORD='…' bun run setup:owner <owner-email>`
4. Run it as a service, e.g. with systemd or pm2:
   `bun run standalone/server.ts` with `PORT=3000` (or your chosen port).
   Set the process manager to restart it on reboot/crash.
5. **Domain + SSL:** point your domain's DNS (A record) at the server, and
   put a reverse proxy in front — **Caddy** (automatic HTTPS) is the
   easiest: a two-line Caddyfile with your domain and
   `reverse_proxy localhost:3000`. Nginx + Certbot (Let's Encrypt) works
   the same way. The app itself serves plain HTTP on its port; the proxy
   terminates HTTPS.
6. **Persistence — important:** the live data is in `data/`:
   `data/app.db` (plus its `-wal`/`-shm` files) is the SQLite database and
   `data/uploads/` holds owner-uploaded bike photos. Keep `data/` on a
   persistent disk, **out of git**, and back it up regularly (copy the
   folder, or back up the SQLite file while running). If you redeploy
   code, do not overwrite `data/`.
7. Configuration is via environment variables only:
   `PORT`, `DATABASE_PATH`, `UPLOADS_DIR` (defaults are fine for most hosts).

Updates after launch: change code → `bun install` (if deps changed) →
`bun run build` → restart the service. New SQL migrations added to
`drizzle/` are applied automatically on the next start.

---

## 6. Pushing to GitHub

Run: `git init`, `git add .`, `git commit -m "KGN Premium Bikes — standalone export"`,
`git branch -M main`, `git remote add origin <your-github-repo-url>`,
`git push -u origin main`.

The included `.gitignore` already excludes `node_modules/`, build output,
`.bun-cache/`, and — critically — `data/` and `*.db`, so the live database
and uploaded photos are never committed. Double-check with `git status`
before the first push.

---

## 7. What was changed for standalone hosting

The original app ran on the Muse/Hatch platform and imported
`@hatch/space-sdk` for four things. This export replaces **only that SDK
surface**; the app's own feature code is untouched.

| Platform piece | Standalone replacement |
|---|---|
| `@hatch/space-sdk` (server): `defineAction`, `z`, `Ctx` types | `local/space-sdk/index.ts` — same names/shapes; `z` is re-exported from the real `zod` package |
| `ctx.db<T>()` — platform-managed SQLite via Drizzle | `local/space-sdk/runtime.ts` — Drizzle ORM over a local SQLite file (`data/app.db`) using Bun's built-in `bun:sqlite` |
| `ctx.blobs.put/getUrl/…` — platform blob storage | Same file — plain files under `data/uploads/`; `getUrl()` returns `/uploads/<key>`, served by the standalone server |
| `ctx.invalidateQueries()` — platform live-refresh hint | No-op locally. The client already invalidates its React Query caches after mutations, so behaviour is unchanged |
| `@hatch/space-sdk/client`: `createActionClient`, `spaceQueryClient`, `fileToBase64` | `local/space-sdk/client.ts` — a typed Proxy that POSTs `{ action, args }` to `./actions` and unwraps `{ data }` / throws on `{ error }`, exactly like the platform client; a standard React Query `QueryClient`; the same chunked base64 encoder |
| `@hatch/space-sdk/build`: `buildClient()` | `local/space-sdk/build.ts` — `Bun.build` on `client/index.html` with `bun-plugin-tailwind`, production mode, hashed asset names → `client/dist/` |
| Platform request routing & action dispatch | `standalone/server.ts` — `Bun.serve`: validates args with each action's Zod request schema, runs the handler with the local Ctx, validates the response schema, returns `{ data }` / `{ error }`; also serves `/uploads/*` and the built client with SPA fallback |
| Platform migrations runner | `runtime.ts` applies `drizzle/*.sql` in order on start, tracked in `__export_migrations` |
| `package.json` dependency `"@hatch/space-sdk": "file:/opt/hatch/…"` | `"file:./local/space-sdk"`, plus `bun-plugin-tailwind` as a devDependency, a proper project name, and `start` / `dev` / `setup:owner` scripts |

App-code changes: **none were needed.** `client/src/*`, `server/src/*` and
`drizzle/*` are byte-identical to the live app's source. `space.json` is
kept for reference only — nothing standalone reads it.

### Verified in this export (2026-11-15)

Run in this folder before packing (test data was created in a throwaway
database and deleted afterwards — nothing test-related ships):

- `bun install` — 59 packages installed cleanly
- `bun run typecheck` — client + server, **no errors**
- `bun run build` — client built to `client/dist/` (JS bundle ≈ 360 KB)
- `bun run start` — all 9 migrations applied; home page → HTTP 200
- `listBikes` action → HTTP 200, 13 bikes / 7 brands (seeded from code)
- `getSettings` action → the seeded KGN contact details
- `setup:owner` + `ownerLogin` → owner created, login returned a session token
- `uploadBikePhoto` (as owner) → photo stored, its `/uploads/…` URL served
  back with HTTP 200 and the right image content type
- `registerAccount` → account created; a second sign-up with the same
  username in different letter case was **refused** (duplicate-username rule)
- Unknown action name → HTTP 404

### Remaining conversion steps

None outstanding for the verified flows above. Two honest notes:

- The platform also pushed live query invalidations between open clients;
  standalone relies on each client's own React Query refetch after its own
  actions (standard behaviour, no code change needed).
- Chat is request/response (the client polls via React Query), as it was on
  the platform build — there is no WebSocket layer to convert.

---

## 8. Common changes guide

**Most day-to-day changes need no code at all** — they are done in the
**Owner Portal** on the live site (logo ×5 → owner sign-in):

| Change | Where |
|---|---|
| Add / edit / archive a bike, price, specs | Owner Portal → Inventory |
| Add photos to a bike (gallery/disk), reorder 1-2-3-4, set cover | Inventory → add/edit bike → photo panel (drag, or Earlier/Later / Swap-with-#) |
| Add an Instagram reel to a bike | Inventory → add/edit bike → **Instagram Reel Link** panel at the top (paste the reel URL) |
| Change phone / WhatsApp numbers, address, hours, Instagram | Owner Portal → Settings (used by Call/WhatsApp buttons and the showroom section) |
| Reply to chats, move leads (Hot/Warm/Cold), follow-ups, export CSV | Owner Portal → Enquiries / lead pipeline |
| See all customers + profile-change history | Owner Portal → **Our Family** |
| Add/remove another owner | Owner Portal → Owners |

**In code:**

| Change | Where |
|---|---|
| Any page layout / text / styling | `client/src/App.tsx` (single large component file) + `client/src/theme.css` for theme tokens/fonts |
| Team section (Founder/CEO/Treasurer) | In `App.tsx`, search for “Meet the family that runs your showroom”. Photos are `client/src/assets/team-founder.webp`, `team-ceo.webp`, `team-treasurer.webp` — **these are sample placeholders**: replace the image files (same names) and edit the names/descriptions in `App.tsx` when the real details are ready |
| ZENTRO banner / footer credit | In `App.tsx`, search for “ZENTRO Technologies” (banner after the team section + small footer line). No ZENTRO email/phone is included because none has been confirmed — add it in both places when available |
| Hero behaviour (auto-swipe 2 s) | In `App.tsx`, search for the featured-bikes carousel / the 2000 ms timer |
| Seed catalog (starter bikes) / seeded settings defaults | `server/src/actions.ts` — the `CATALOG` array, `REEL_SEEDS`, and the seed block inside `getSettings`. Note: seeds only fill an **empty** database (or missing keys); live edits are stored in the DB and win |
| Database tables | `server/src/schema.ts`; add a new SQL file in `drizzle/` for any schema change (applied automatically on start) |
| A new backend action | Add a `defineAction({ request, response, handler })` entry to the `Actions` object in `server/src/actions.ts` — the client picks it up typed via `client/src/api.ts` with no other wiring |
| Reviews moderation | Reviews are written only by signed-in customers (`createReview` in `actions.ts`) and shown publicly via `listReviews`. There is no admin delete UI yet — to remove a review today, delete its row from the `reviews` table in `data/app.db` (SQLite) and it disappears from the site |

---

## 9. What is NOT in this export (deliberately)

- **The live database and all live user data** — no customer accounts, no
  owner password hashes, no sessions, chats, enquiries, reviews or
  profile-change rows were exported. The standalone site starts from the
  code-seeded catalog/settings and creates fresh data (see §4).
- **Owner-uploaded photos stored as blobs on the platform** — the seeded
  catalog photos are in `client/src/assets/`, but photos the owner uploaded
  to the live site live in the platform's blob store, not in the source
  tree. On the standalone site, owners simply re-upload photos per bike
  (Inventory → photo panel); uploads then persist in `data/uploads/`.
- `node_modules/`, platform build outputs (`.space-build*`), audit/probe
  files, and the platform's internal planning doc (`DATA-PLAN.md`).

**Security:** there are no passwords or secrets anywhere in this folder.
Keep it that way — never commit `data/` or any real password into git.

---

## 10. Quick troubleshooting

- **“Client not built yet” (HTTP 503)** → run `bun run build` first.
- **Actions return errors after a code change** → run `bun run typecheck`;
  the server validates every request/response against the Zod schemas in
  `server/src/actions.ts`, so a shape mismatch fails loudly in the server log.
- **Photos 404** → check the file exists under `data/uploads/` and that the
  `bike_photos` row's `blob_key` matches its path.
- **Port already in use** → start with another port: `PORT=8080 bun run start`.

---

*Developed by **ZENTRO Technologies** — “Building the foundation of tomorrow.”
This website was designed and developed by ZENTRO Technologies for
KGN Premium Bikes. Need a website like this for your business? Contact
ZENTRO Technologies.*
