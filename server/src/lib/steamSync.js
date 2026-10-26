// Keeps Steam artwork and patch notes fresh. Runs once at startup and then on an
// interval, so new game updates appear on the site without anyone redeploying.
import { query } from '../db/pool.js';
import { fetchAssets, fetchPatchNotes, hasSteamKey } from './steam.js';

const ASSET_MAX_AGE_DAYS = 7;
const NEWS_INTERVAL_MIN = Number(process.env.STEAM_NEWS_INTERVAL_MIN || 30);

export async function syncAssets({ force = false } = {}) {
  const { rows } = await query(
    `SELECT id, steam_appid FROM games WHERE steam_appid IS NOT NULL
       AND ($1 OR steam_assets_checked_at IS NULL OR steam_assets_checked_at < now() - interval '${ASSET_MAX_AGE_DAYS} days')`,
    [force]
  );
  for (let i = 0; i < rows.length; i += 40) {
    const batch = rows.slice(i, i + 40);
    const assets = await fetchAssets(batch.map((r) => r.steam_appid));
    for (const r of batch) {
      const a = assets.get(r.steam_appid);
      await query(
        `UPDATE games SET capsule_url = COALESCE($2, capsule_url), hero_url = COALESCE($3, hero_url),
           header_url = COALESCE($4, header_url), steam_assets_checked_at = now() WHERE id = $1`,
        [r.id, a?.capsule ?? null, a?.hero ?? null, a?.header ?? null]
      );
    }
  }
  if (rows.length) console.log(`[steam] Artwork refreshed for ${rows.length} games.`);
}

/** Fetches patch notes for one video game and records any new ones. Returns the number of new updates. */
export async function syncGameNews(game) {
  // Drop stale rows so excluded or re-titled posts don't linger.
  await query(`DELETE FROM game_updates WHERE game_id = $1 AND $2::text IS NOT NULL AND title ~* $2`, [game.id, game.patch_exclude ?? null]);
  const notes = await fetchPatchNotes(game.steam_appid, { exclude: game.patch_exclude });
  // Forget stored posts in the fetched window that no longer qualify (e.g. after the filter changes).
  if (notes.length) {
    await query(
      `DELETE FROM game_updates WHERE game_id = $1 AND NOT (gid = ANY($2)) AND published_at >= $3`,
      [game.id, notes.map((n) => n.gid), notes.at(-1).published_at]
    );
  }
  let added = 0;
  for (const n of notes) {
    const { rowCount } = await query(
      `INSERT INTO game_updates (game_id, gid, title, url, author, version, content, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (gid) DO UPDATE SET title = $3, version = $6, content = $7`,
      [game.id, n.gid, n.title, n.url, n.author, n.version, n.content, n.published_at]
    );
    if (rowCount) added += 1;
  }
  const latest = notes[0];
  const versioned = notes.find((n) => n.version);
  await query(
    `UPDATE games SET news_checked_at = now(),
       last_update_at = COALESCE($2, last_update_at),
       current_version = $3
     WHERE id = $1`,
    [game.id, latest?.published_at ?? null, versioned?.version ?? null]
  );
  return added;
}

export async function syncAllNews() {
  const { rows } = await query(
    `SELECT id, title, steam_appid, patch_exclude FROM games WHERE category = 'video' AND steam_appid IS NOT NULL ORDER BY id`
  );
  for (const game of rows) {
    try {
      await syncGameNews(game);
    } catch (err) {
      console.warn(`[steam] Patch notes failed for ${game.title}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // be polite to the API
  }
}

// Refresh a single game's notes when someone views it and the cache is stale.
const inFlight = new Set();
export function refreshGameNewsIfStale(game) {
  if (!hasSteamKey() || game.category !== 'video' || !game.steam_appid || inFlight.has(game.id)) return;
  const checked = game.news_checked_at ? new Date(game.news_checked_at).getTime() : 0;
  if (Date.now() - checked < NEWS_INTERVAL_MIN * 60000) return;
  inFlight.add(game.id);
  syncGameNews(game)
    .catch((err) => console.warn(`[steam] ${game.title}: ${err.message}`))
    .finally(() => inFlight.delete(game.id));
}

export function startSteamSync() {
  if (!hasSteamKey()) {
    console.warn('[steam] STEAM_API_KEY is not set — Steam artwork and patch notes are disabled.');
    return;
  }
  const run = async () => {
    try {
      await syncAssets();
      await syncAllNews();
    } catch (err) {
      console.warn(`[steam] Sync failed: ${err.message}`);
    }
  };
  run();
  setInterval(run, NEWS_INTERVAL_MIN * 60000).unref();
}
