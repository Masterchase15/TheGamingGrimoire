import { query } from '../db/pool.js';

// fandom_cache keeps every wiki article anyone has opened. Without cleanup a crawler
// walking the wikis fills the database volume, so it is trimmed on boot and every hour.

const MB = 1024 * 1024;
// Above this size the table is emptied outright: TRUNCATE hands the disk space straight back,
// where DELETE only marks it reusable. It is only a cache, so articles are refetched on demand.
const EMERGENCY_BYTES = Number(process.env.FANDOM_CACHE_EMERGENCY_MB || 1024) * MB;
const MAX_PAGES = Number(process.env.FANDOM_CACHE_MAX_PAGES || 2000);
const PAGE_MAX_AGE_DAYS = Number(process.env.FANDOM_CACHE_PAGE_DAYS || 3);
const SEARCH_MAX_AGE_HOURS = 24;
const OTHER_MAX_AGE_DAYS = 14; // overviews and namespace lists: few rows, refreshed daily anyway

const fmt = (bytes) => `${(bytes / MB).toFixed(1)} MB`;

async function tableBytes() {
  const { rows } = await query(`SELECT pg_total_relation_size('fandom_cache')::bigint AS bytes`);
  return Number(rows[0].bytes);
}

export async function pruneFandomCache() {
  const before = await tableBytes();

  if (before > EMERGENCY_BYTES) {
    await query(`TRUNCATE fandom_cache`);
    console.log(`[cache] fandom_cache was ${fmt(before)}; emptied it to free disk space.`);
    return;
  }

  const expired = await query(
    `DELETE FROM fandom_cache
     WHERE (key LIKE 'page:%'   AND fetched_at < now() - make_interval(days => $1))
        OR (key LIKE 'search:%' AND fetched_at < now() - make_interval(hours => $2))
        OR fetched_at < now() - make_interval(days => $3)`,
    [PAGE_MAX_AGE_DAYS, SEARCH_MAX_AGE_HOURS, OTHER_MAX_AGE_DAYS]
  );

  // Keep only the most recently fetched articles.
  const overflow = await query(
    `DELETE FROM fandom_cache
     WHERE key IN (
       SELECT key FROM fandom_cache WHERE key LIKE 'page:%'
       ORDER BY fetched_at DESC OFFSET $1
     )`,
    [MAX_PAGES]
  );

  const removed = expired.rowCount + overflow.rowCount;
  if (removed) console.log(`[cache] Removed ${removed} old wiki cache entries (table was ${fmt(before)}).`);
}

// Logs the biggest tables so disk growth is easy to spot in the deploy logs.
export async function logLargestTables() {
  const { rows } = await query(
    `SELECT relname AS name, pg_total_relation_size(relid)::bigint AS bytes
     FROM pg_catalog.pg_statio_user_tables ORDER BY bytes DESC LIMIT 5`
  );
  const { rows: db } = await query(`SELECT pg_database_size(current_database())::bigint AS bytes`);
  console.log(
    `[db] Size ${fmt(Number(db[0].bytes))}. Largest tables: ` +
      rows.map((r) => `${r.name} ${fmt(Number(r.bytes))}`).join(', ')
  );
}

export function startCacheCleanup() {
  const run = () => pruneFandomCache().catch((err) => console.warn(`[cache] Cleanup failed: ${err.message}`));
  setInterval(run, 60 * 60000).unref();
  return run();
}
