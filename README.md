# TheGamingGrimoire

A wiki and community site for **video games, board games and card games**.

- **Wiki:** browse by category, open a game, and read its wiki pages (how to play, formats, deckbuilding, strategy) and searchable glossaries. Magic: The Gathering includes every keyword ability, keyword action and ability word.
- **Search:** a global search (games, wiki pages and keyword definitions) in the navbar and on the home page, plus a scoped search on each category page.
- **Library tracking (AniList-style):** add games with a status, rating, hours and notes.
  - Finite games: *Want to Play, Playing, Completed, On Hold, Dropped*
  - Ongoing games (live-service, competitive multiplayer, TCGs, board games): *Want to Play, Actively Playing, Taking a Break, Not Playing*
- **HowLongToBeat:** finite video games show main / main+extras / completionist times, cached in the database.
- **Fandom wikis:** each game's Wiki section pulls from its Fandom community via the MediaWiki API: an overview, featured pages, wiki search, and full articles rendered in-site (links stay inside the grimoire). Content is cached and attributed under CC BY-SA 3.0. Mappings live in `server/src/seed/data/fandom.js`.
- **Steam integration:** library capsule art and hero banners for every game available on Steam, plus news posts, patch notes and the current version for video games. The server re-checks Steam every 30 minutes (and when a stale game page is opened), so new updates show up automatically.
- **Prices and DLC:** every video game on Steam shows its current price (with sale discounts) and a DLC section, from Steam's public store API (no key needed). Prices are re-checked every 3 hours, so sales appear on their own.
- **Expansions:** board and card games show an Expansions section, synced from BoardGameGeek for games with a `bgg_id` (needs `BGG_API_TOKEN` on the server), plus any expansions listed by hand in the game's JSON.
- **Community:** user search, friend requests, a personal home feed (currently playing, recently visited, friend activity) and forums per game.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, React Router, Vite, Phosphor icons (Archivo, Geist, JetBrains Mono) |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (`pg`) |
| Auth | [Better Auth](https://www.better-auth.com) (email/password + username plugin) |
| Hosting | Railway |

```
client/            React app (Vite)
server/src/
  index.js         Express app: Better Auth, API routes, serves client/dist in production
  auth.js          Better Auth config
  db/              Pool, schema.sql, migrations, bundled local Postgres
  routes/          games, search, library, users, friends, feed, forums, admin
  lib/hltb.js      HowLongToBeat client
  lib/admin.js     Admin access (API key or admin role)
  lib/gameStore.js Game upserts shared by the seed sync and the admin API
  seed/data/       Wiki content (games, sections, glossary terms)
scripts/dev.mjs    Local runner used by start.bat
scripts/add-?game.mjs  add-vgame / add-bgame / add-cgame: look up a game and send it to the admin API
scripts/lib/add-game.mjs  Shared core of those three scripts
scripts/make-admin.mjs Give an account the admin role
game-drafts/       Game JSON drafts written by the add scripts
start.bat          One-click local start on Windows
```

## Run locally (Windows)

Requirements: **Node.js 20+**. Nothing else — a portable PostgreSQL is bundled for local testing.

Double-click **`start.bat`**. On first run it installs dependencies, creates a `.env` with a random auth secret, starts the local database, the API (port 3001) and the website (port 5173), and opens http://localhost:5173.

Press **Ctrl+C** in the window to stop everything. Local data lives in `.localdb/` (git-ignored); delete that folder to start fresh.

On other platforms, or from a terminal: `npm install`, then `npm run dev`.

Verification and password reset links are printed in that window instead of being emailed, unless `RESEND_API_KEY` and `EMAIL_FROM` are set in `.env`.

To use your own Postgres instead of the bundled one, set `DATABASE_URL` in `.env`.

## Editing wiki content

Wiki content lives in `server/src/seed/data/`. Each game has metadata plus `sections` (Markdown `content`, optional glossary `terms`). On startup the server syncs any changes into the database automatically. Set `is_continuous: true` for games that are played continuously, and `hltb_query` when the HowLongToBeat title differs.

Games added or edited through the admin API (below) are owned by the database from then on, and the seed sync leaves them alone. To hand one back to the seed files, run `npm run add-vgame -- --release <slug>` (any of the three add scripts works).

## Adding games (admin API)

New games can be added without editing code or redeploying. A local script looks the game up, saves a JSON draft, and sends it to a protected endpoint that validates it and upserts it into the database.

```
npm run add-vgame -- "Hades II"                         # video game
npm run add-bgame -- "Spirit Island"                    # board game
npm run add-cgame -- "Star Wars: Unlimited"             # card game
npm run add-vgame -- --file game-drafts/hades-ii.json   # send a draft you edited
npm run add-vgame -- --pull elden-ring                  # download a game on the site as a draft
npm run add-vgame -- --refresh hades-ii                 # re-fetch Steam / HLTB / Fandom data now
npm run pull-games                                      # save every game on the site as a draft (see below)
npm run remove-vgame -- hades-ii                        # take a game off the site (remove-bgame / remove-cgame too)
```

All three scripts take the same commands and options and work the same way. Each one only calls the services for its category:

| Script | Looks up | The site then fetches |
|---|---|---|
| `add-vgame` | Steam (app id, developer, publisher, year, genres), Fandom | Steam artwork, news, patch notes, price and DLC, HowLongToBeat times, Fandom overview |
| `add-bgame` | BoardGameGeek (`bgg_id`, players, play time, age, designers; needs `BGG_API_TOKEN`), Fandom | BoardGameGeek expansions, Fandom overview; Steam artwork only if you set `steam_appid` |
| `add-cgame` | BoardGameGeek (same details as board games; needs `BGG_API_TOKEN`), Fandom | BoardGameGeek expansions, Fandom overview; Steam artwork only if you set `steam_appid` |

A draft remembers its category, so sending a board game draft with `add-vgame` (or the other way round) stops with a message naming the right script.

1. **Lookup.** The script runs its category's lookups (table above) and writes `game-drafts/<slug>.json`. Edits you make to a draft are kept on later runs.
2. **Preview.** It shows the game, what to check, and the server's validation result (`?dryRun=1`), then asks before sending. Use `--dry-run` to stop here, `--yes` to skip the question.
3. **Save.** `POST /api/admin/games` validates the JSON and upserts it by slug. Omitted fields keep their stored values; `sections`, when sent, replaces the wiki sections.
4. **Enrichment.** Right after saving, the server fetches Steam artwork, patch notes, price and DLC, BoardGameGeek expansions, HowLongToBeat times and the Fandom overview, and the script prints what it found.

**Expansions not on BoardGameGeek** can be listed by hand in a board or card game's draft. Only `name` is required; sending `expansions` replaces the hand-listed ones (BoardGameGeek's stay):

```json
"expansions": [
  { "name": "Seafarers", "year": 1997, "description": "Sail to new islands.", "image": "https://...", "url": "https://..." }
]
```

Required per category: video games need `steam_appid` (or `null` if not on Steam); board games need `players`, `play_time` and `age`; card games need `players`. Missing tagline, description, Fandom wiki or sections produce warnings, not errors. Write taglines, descriptions and wiki sections in your own words.

**Access.** Every `/api/admin` route needs either `Authorization: Bearer <ADMIN_API_KEY>` (scripts) or a signed-in account with the admin role (`npm run make-admin -- <username>`; `--revoke` to remove). The key must be at least 32 characters; `start.bat` generates one in `.env`. After 10 failed attempts an IP is locked out for 15 minutes. Every change is recorded in the `admin_audit_log` table.

Every draft has a few optional fields for what the lookups can't find. Put files in the `game-assets` folder (git-ignored) and use their file name, or use a web link:

| Field | Categories | What it does |
|---|---|---|
| `thumbnail` | all | Image (png, jpg, webp, avif) used as the game's art, in place of Steam's |
| `banner` | all | Image shown across the top of the game page, in place of Steam's banner or the blurred thumbnail. Empty it and send again to remove it |
| `wiki_url` | all | A wiki to use when there's no Fandom wiki. Its license decides whether its articles show on the site or are linked to |
| `rulebook` | board, card | PDF rulebook, or a list of them for games with several. The one named "Base Game" (or else the first) opens from the Rulebook button at the top of the game page, and the Rulebooks section lists them all |
| `rulebook_tldr` | board, card | Written by Claude from the main rulebook when `ANTHROPIC_API_KEY` is set, and filled in by hand otherwise. Claude also fills empty Details fields. Use `--regenerate` to read the rulebook again |
| `faq` | board, card | Link to a site with the game's FAQs. Adds an FAQ section to the game page that links there |
| `unique_faq` | board, card | Your own questions for anything the linked FAQ doesn't cover, shown under it in the FAQ section |

Fill the fields in, then send with `--file`. A list of rulebooks is `[{ "name": "Base Game", "file": "..." }]`, a draft's `rulebook_tldr` is `[{ "heading": "...", "points": ["..."] }]` and its `unique_faq` is `[{ "q": "...", "a": "..." }]`.

### Editing any game, including the original ones

`npm run pull-games` saves every game on the site that has no draft yet to `game-drafts/<slug>.json`, including the games the site started with (the seed files). Pass slugs to pull only those, `--category board` for one category, or `--overwrite` to replace drafts you already have. Edit a draft and send it with its category's script (`npm run add-bgame -- --file game-drafts/catan.json`). Once sent, the game is managed through its draft and later edits to the seed files are ignored for it.

### Grimoire quick guides

A draft's `sections` are the game's Grimoire quick guides, listed under the Wiki on its page in the order given. Add, edit, reorder or delete entries, then send the draft; the game's guides are replaced with the list in the draft (an empty list removes them all).

```json
"sections": [
  {
    "title": "How to Play",
    "icon": "BookOpen",
    "summary": "Setup, turns and how to win.",
    "content": [
      "## Setup",
      "Each player takes **two** settlements.",
      "",
      "## Your turn",
      "1. Roll the dice."
    ],
    "terms": [{ "term": "Robber", "definition": "Blocks a hex from producing." }]
  }
]
```

`content` is Markdown, as one text or a list of lines. `slug` (the guide's URL, `/game/<game>/<slug>`) is made from the title when left out; keep it the same to keep old links working. `summary`, `icon` and `terms` (a glossary shown under the guide) are optional. Icons: BookOpen, Cards, Compass, Cpu, Crosshair, Crown, Drop, Hammer, Lightbulb, Lightning, ListMagnifyingGlass, MagicWand, MapTrifold, Moon, Parachute, PersonSimpleRun, Planet, Plant, Ranking, Sparkle, Sword, TextItalic, Translate, Trophy, UsersThree.

### Removing games

`npm run remove-vgame -- <slug or title>` (or `remove-bgame` / `remove-cgame`) shows what the game takes with it and asks before removing it: its page, quick guides, library entries, reviews, patch notes, DLC and uploaded files. Forum threads about it stay, no longer tied to a game. Seed-file games are remembered as removed, so a restart doesn't add them back; sending the game's draft again adds it back. `--dry-run` only shows what would be removed.

To add games to the live site, set `ADMIN_API_KEY` on Railway, then run the script with `--api https://your-app.up.railway.app` and the same key in your local environment.

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** and pick the repo.
3. Add a database: **New → Database → PostgreSQL**.
4. On the web service, set **Variables**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `BETTER_AUTH_SECRET` = a long random string
   - `BETTER_AUTH_URL` and `CLIENT_URL` = your public URL, e.g. `https://thegaminggrimoire.up.railway.app`
   - `NODE_ENV` = `production`
   - `STEAM_API_KEY` = your Steam Web API key
   - `RESEND_API_KEY` = your [Resend](https://resend.com) API key, for verification and password reset emails
   - `EMAIL_FROM` = the sender, e.g. `TheGamingGrimoire <noreply@yourdomain.com>`, on a domain verified in Resend. Without these two, email verification is off and password resets can't be sent
   - `ADMIN_API_KEY` = a long random string, if you want to add games with the add scripts (optional)
   - `BGG_API_TOKEN` = your BoardGameGeek API token, to sync board and card game expansions (optional)
5. Under **Settings → Networking**, generate a domain (use it for the URLs above).

Uploaded thumbnails, banners and rulebooks need permanent storage: add a **Volume** to the service mounted at `/data`, and set `UPLOADS_DIR=/data/uploads`.

`railway.json` builds the client (`npm run build`) and starts the server (`npm start`), which runs migrations and syncs wiki content on boot. Health check: `/api/health`.

## Notes

- **Steam API key:** keep it in `.env` (git-ignored) locally and in Railway variables in production. It is only used by the server and never sent to the browser.

- HowLongToBeat has no official public API; `server/src/lib/hltb.js` uses the same search endpoint as the HowLongToBeat website. If they change it, lookups fail gracefully and cached values are kept.
- Game art is loaded from Steam's CDN at runtime (nothing is bundled). Games not on Steam get a generated poster.
