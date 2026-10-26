# TheGamingGrimoire

A wiki and community site for **video games, board games and card games**.

- **Wiki:** browse by category, open a game, and read its wiki pages (how to play, formats, deckbuilding, strategy) and searchable glossaries. Magic: The Gathering includes every keyword ability, keyword action and ability word.
- **Search:** a global search (games, wiki pages and keyword definitions) in the navbar and on the home page, plus a scoped search on each category page.
- **Library tracking (AniList-style):** add games with a status, rating, hours and notes.
  - Finite games: *Want to Play, Playing, Completed, On Hold, Dropped*
  - Ongoing games (live-service, competitive multiplayer, TCGs, board games): *Want to Play, Actively Playing, Taking a Break, Not Playing*
- **HowLongToBeat:** finite video games show main / main+extras / completionist times, cached in the database.
- **Fandom wikis:** each game's Wiki section pulls from its Fandom community via the MediaWiki API: an overview, featured pages, wiki search, and full articles rendered in-site (links stay inside the grimoire). Content is cached and attributed under CC BY-SA 3.0. Mappings live in `server/src/seed/data/fandom.js`.
- **Steam integration:** library capsule art and hero banners for every game available on Steam, plus patch notes and the current version for video games. The server re-checks Steam every 30 minutes (and when a stale game page is opened), so new updates show up automatically.
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
  routes/          games, search, library, users, friends, feed, forums
  lib/hltb.js      HowLongToBeat client
  seed/data/       Wiki content (games, sections, glossary terms)
scripts/dev.mjs    Local runner used by start.bat
start.bat          One-click local start on Windows
```

## Run locally (Windows)

Requirements: **Node.js 20+**. Nothing else — a portable PostgreSQL is bundled for local testing.

Double-click **`start.bat`**. On first run it installs dependencies, creates a `.env` with a random auth secret, starts the local database, the API (port 3001) and the website (port 5173), and opens http://localhost:5173.

Press **Ctrl+C** in the window to stop everything. Local data lives in `.localdb/` (git-ignored); delete that folder to start fresh.

On other platforms, or from a terminal: `npm install`, then `npm run dev`.

To use your own Postgres instead of the bundled one, set `DATABASE_URL` in `.env`.

## Editing wiki content

Wiki content lives in `server/src/seed/data/`. Each game has metadata plus `sections` (Markdown `content`, optional glossary `terms`). On startup the server syncs any changes into the database automatically. Set `is_continuous: true` for games that are played continuously, and `hltb_query` when the HowLongToBeat title differs.

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
5. Under **Settings → Networking**, generate a domain (use it for the URLs above).

`railway.json` builds the client (`npm run build`) and starts the server (`npm start`), which runs migrations and syncs wiki content on boot. Health check: `/api/health`.

## Notes

- **Steam API key:** keep it in `.env` (git-ignored) locally and in Railway variables in production. It is only used by the server and never sent to the browser.

- HowLongToBeat has no official public API; `server/src/lib/hltb.js` uses the same search endpoint as the HowLongToBeat website. If they change it, lookups fail gracefully and cached values are kept.
- Game art is loaded from Steam's CDN at runtime (nothing is bundled). Games not on Steam get a generated poster.
