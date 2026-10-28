// Keeps Steam artwork, patch notes, prices and DLC fresh. Runs once at startup and
// then on an interval, so new game updates and sales appear on the site without
// anyone redeploying.
import { query } from '../db/pool.js';
import { fetchAssets, fetchPatchNotes, fetchStoreApp, fetchStorePrices, hasSteamKey } from './steam.js';

const ASSET_MAX_AGE_DAYS = 7;
const NEWS_INTERVAL_MIN = Number(process.env.STEAM_NEWS_INTERVAL_MIN || 30);
// Steam sales start and end often, so prices are re-checked every few hours.
const STORE_INTERVAL_HOURS = Number(process.env.STEAM_STORE_INTERVAL_HOURS || 3);
// DLC names, art and release dates rarely change; prices are refreshed on every check.
const DLC_DETAILS_MAX_AGE_DAYS = 7;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function syncAssets({ force = false, gameId = null } = {}) {
  const { rows } = await query(
    `SELECT id, steam_appid FROM games WHERE steam_appid IS NOT NULL AND ($2::int IS NULL OR id = $2)
       AND ($1 OR steam_assets_checked_at IS NULL OR steam_assets_checked_at < now() - interval '${ASSET_MAX_AGE_DAYS} days')`,
    [force, gameId]
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
  if (rows.length && !gameId) console.log(`[steam] Artwork refreshed for ${rows.length} games.`);
  return rows.length;
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

/**
 * Refreshes a video game's price and its DLC (names, art, release dates, prices)
 * from the Steam store. Returns { price, dlc } for reporting, or null when Steam
 * has no store page for the app.
 */
export async function syncGameStore(game, { force = false } = {}) {
  const app = await fetchStoreApp(game.steam_appid);
  if (!app) {
    await query(`UPDATE games SET store_checked_at = now() WHERE id = $1`, [game.id]);
    return null;
  }
  const p = app.price;
  await query(
    `UPDATE games SET price_currency = $2, price_initial = $3, price_final = $4, price_discount = $5,
       is_free = $6, store_checked_at = now() WHERE id = $1`,
    [game.id, p?.currency ?? null, p?.initial ?? null, p?.final ?? null, p?.discount ?? null, app.isFree]
  );

  // DLC Steam no longer lists for the game (delisted, or the appid changed) is dropped.
  await query(`DELETE FROM game_dlc WHERE game_id = $1 AND NOT (appid = ANY($2::int[]))`, [game.id, app.dlc]);
  const { rows: known } = await query(
    `SELECT appid FROM game_dlc WHERE game_id = $1 AND checked_at > now() - interval '${DLC_DETAILS_MAX_AGE_DAYS} days'`,
    [game.id]
  );
  const fresh = new Set(force ? [] : known.map((r) => r.appid));

  // New (or stale) DLC: one request each for the full details.
  for (const appid of app.dlc.filter((id) => !fresh.has(id))) {
    await sleep(300);
    const d = await fetchStoreApp(appid).catch(() => null);
    if (!d) continue;
    await query(
      `INSERT INTO game_dlc (game_id, appid, name, kind, description, header_url, release_date, released_on, coming_soon,
         is_free, price_currency, price_initial, price_final, price_discount, checked_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
       ON CONFLICT (game_id, appid) DO UPDATE SET name = $3, kind = $4, description = $5, header_url = $6,
         release_date = $7, released_on = $8, coming_soon = $9, is_free = $10, price_currency = $11,
         price_initial = $12, price_final = $13, price_discount = $14, checked_at = now()`,
      [game.id, appid, d.name, d.type || 'dlc', d.description, d.header, d.releaseDate, d.releasedOn, d.comingSoon,
        d.isFree, d.price?.currency ?? null, d.price?.initial ?? null, d.price?.final ?? null, d.price?.discount ?? null]
    );
  }

  // Known DLC: just the prices, many per request.
  const priced = [...fresh];
  for (let i = 0; i < priced.length; i += 50) {
    await sleep(300);
    const prices = await fetchStorePrices(priced.slice(i, i + 50));
    for (const [appid, dp] of prices) {
      await query(
        `UPDATE game_dlc SET price_currency = $3, price_initial = $4, price_final = $5, price_discount = $6
         WHERE game_id = $1 AND appid = $2`,
        [game.id, appid, dp?.currency ?? null, dp?.initial ?? null, dp?.final ?? null, dp?.discount ?? null]
      );
    }
  }
  return { price: app.isFree ? 'free' : p, dlc: app.dlc.length };
}

/** Price and DLC check for every video game on Steam whose last check is older than the interval. */
export async function syncAllStore() {
  const { rows } = await query(
    `SELECT id, title, steam_appid FROM games WHERE category = 'video' AND steam_appid IS NOT NULL
       AND (store_checked_at IS NULL OR store_checked_at < now() - make_interval(mins => $1))
     ORDER BY store_checked_at NULLS FIRST, id`,
    [Math.round(STORE_INTERVAL_HOURS * 60) - 5]
  );
  for (const game of rows) {
    try {
      await syncGameStore(game);
    } catch (err) {
      console.warn(`[steam] Store check failed for ${game.title}: ${err.message}`);
    }
    await sleep(1500); // the store API allows roughly 200 requests per 5 minutes
  }
  if (rows.length) console.log(`[steam] Prices and DLC checked for ${rows.length} games.`);
}

// Same idea as patch notes: a page view triggers a background check when the price is stale.
const storeInFlight = new Set();
export function refreshStoreIfStale(game) {
  if (game.category !== 'video' || !game.steam_appid || storeInFlight.has(game.id)) return;
  const checked = game.store_checked_at ? new Date(game.store_checked_at).getTime() : 0;
  if (Date.now() - checked < STORE_INTERVAL_HOURS * 3600000) return;
  storeInFlight.add(game.id);
  syncGameStore(game)
    .catch((err) => console.warn(`[steam] ${game.title}: ${err.message}`))
    .finally(() => storeInFlight.delete(game.id));
}

export function startSteamSync() {
  // Prices and DLC come from the public store API, so they work without a key.
  const runStore = () => syncAllStore().catch((err) => console.warn(`[steam] Store sync failed: ${err.message}`));
  runStore();
  setInterval(runStore, 30 * 60000).unref(); // each run only checks games past STEAM_STORE_INTERVAL_HOURS

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
