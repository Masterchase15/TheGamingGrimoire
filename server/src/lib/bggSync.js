// Keeps board and card game expansions in sync with BoardGameGeek. Only games
// with a bgg_id are checked, and only when BGG_API_TOKEN is set; expansions
// listed by hand in a game's JSON (source 'manual') are never touched here.
import { query } from '../db/pool.js';
import { fetchExpansions, hasBggToken } from './bgg.js';

// New expansions come out a few times a year at most.
const MAX_AGE_HOURS = Number(process.env.BGG_SYNC_INTERVAL_HOURS || 24);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Replaces a game's BGG expansions with the current list. Returns the number stored. */
export async function syncExpansions(game) {
  const { name, expansions } = await fetchExpansions(game.bgg_id);
  // A wrong bgg_id would show another game's expansions; make that visible in the logs.
  if (name && !norm(name).includes(norm(game.title)) && !norm(game.title).includes(norm(name))) {
    console.warn(`[bgg] ${game.title}: bgg_id ${game.bgg_id} is "${name}" on BoardGameGeek. Check it if that's not the same game.`);
  }
  await query(`DELETE FROM game_expansions WHERE game_id = $1 AND source = 'bgg' AND NOT (bgg_id = ANY($2::int[]))`, [
    game.id,
    expansions.map((e) => e.bggId),
  ]);
  for (const [i, e] of expansions.entries()) {
    await query(
      `INSERT INTO game_expansions (game_id, source, bgg_id, name, year, description, image_url, url, popularity, sort_order)
       VALUES ($1, 'bgg', $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (game_id, bgg_id) WHERE source = 'bgg' DO UPDATE SET name = $3, year = $4, description = $5,
         image_url = $6, url = $7, popularity = $8, sort_order = $9`,
      [game.id, e.bggId, e.name, e.year, e.description, e.image, e.url, e.popularity, i]
    );
  }
  await query(`UPDATE games SET bgg_checked_at = now() WHERE id = $1`, [game.id]);
  return expansions.length;
}

export async function syncAllExpansions() {
  const { rows } = await query(
    `SELECT id, title, bgg_id FROM games WHERE category IN ('board', 'card') AND bgg_id IS NOT NULL
       AND (bgg_checked_at IS NULL OR bgg_checked_at < now() - make_interval(hours => $1))
     ORDER BY bgg_checked_at NULLS FIRST, id`,
    [MAX_AGE_HOURS]
  );
  for (const game of rows) {
    try {
      await syncExpansions(game);
    } catch (err) {
      console.warn(`[bgg] Expansions failed for ${game.title}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 5000)); // BGG asks for a few seconds between requests
  }
  if (rows.length) console.log(`[bgg] Expansions checked for ${rows.length} games.`);
}

export function startBggSync() {
  if (!hasBggToken()) {
    console.warn('[bgg] BGG_API_TOKEN is not set — BoardGameGeek expansions are disabled (hand-listed expansions still show).');
    return;
  }
  const run = () => syncAllExpansions().catch((err) => console.warn(`[bgg] Sync failed: ${err.message}`));
  run();
  setInterval(run, 60 * 60000).unref(); // each run only checks games past BGG_SYNC_INTERVAL_HOURS
}
