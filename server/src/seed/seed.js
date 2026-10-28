import crypto from 'node:crypto';
import { pool, withTransaction } from '../db/pool.js';
import { replaceSections, upsertGame } from '../lib/gameStore.js';
import videoGames from './data/video-games.js';
import boardGames from './data/board-games.js';
import cardGames from './data/card-games.js';
import mtg from './data/mtg.js';
import fandom from './data/fandom.js';

export const ALL_GAMES = [...videoGames, ...boardGames, mtg, ...cardGames];

// Wiki content lives in code (server/src/seed/data) and is synced into the
// database on startup. A hash of the content lets unchanged boots skip the work.
// Games added or edited through the admin API (managed_by = 'api') are owned by
// the database from then on, so the seed leaves them alone.
export async function seed({ force = false } = {}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS seed_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const hash = crypto.createHash('sha256').update(JSON.stringify([ALL_GAMES, fandom])).digest('hex');
  const { rows } = await pool.query(`SELECT value FROM seed_meta WHERE key = 'content_hash'`);
  if (!force && rows[0]?.value === hash) return;

  const { rows: apiOwned } = await pool.query(`SELECT slug FROM games WHERE managed_by = 'api'`);
  const skip = new Set(apiOwned.map((r) => r.slug));
  const games = ALL_GAMES.filter((g) => !skip.has(g.slug));

  await withTransaction(async (db) => {
    for (const g of games) {
      const f = fandom[g.slug];
      const { id } = await upsertGame(
        db,
        { ...g, fandom_wiki: f?.wiki, fandom_page: f?.page, fandom_topics: f?.topics },
        { managedBy: 'seed' }
      );
      await replaceSections(db, id, g.sections ?? []);
    }
    await db.query(
      `INSERT INTO seed_meta (key, value) VALUES ('content_hash', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [hash]
    );
  });
  const skipped = ALL_GAMES.length - games.length;
  console.log(`[seed] Synced ${games.length} games into the wiki${skipped ? ` (${skipped} managed by the admin API, left as-is)` : ''}.`);
}
