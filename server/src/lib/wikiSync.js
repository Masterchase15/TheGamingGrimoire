// Keeps two things about game wikis fresh:
//   - wiki_info for games with their own wiki (wiki_url): its API and license,
//     re-checked every few weeks in case the license changes.
//   - the wiki_titles search index: every article title of every game's wiki
//     (Fandom or embeddable wiki_url), so site-wide search finds wiki pages.
// Runs once at startup and then hourly; each run only touches what's stale.
import { query, withTransaction } from '../db/pool.js';
import { api, contentNamespaces, sourceFor } from './fandom.js';
import { inspectWiki } from './wikiLicense.js';

const INFO_MAX_AGE_DAYS = 30;
const INFO_RETRY_HOURS = 6; // after a failed check (site down, blocked)
const INDEX_MAX_AGE_DAYS = Number(process.env.WIKI_INDEX_INTERVAL_DAYS || 7);
const MAX_TITLES = 200_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lowercase without accents: how wiki titles and search queries are compared. */
export const normTitle = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

const isStale = (info, url) => {
  if (!info || info.url !== url) return true;
  const age = Date.now() - new Date(info.checkedAt).getTime();
  return age > (info.error ? INFO_RETRY_HOURS * 3600e3 : INFO_MAX_AGE_DAYS * 86400e3);
};

/**
 * Checks a game's wiki_url (API, license) when it hasn't been checked yet or is
 * stale, and stores the result. Returns the game with wiki_info filled in.
 */
export async function ensureWikiInfo(game, { force = false } = {}) {
  if (!game.wiki_url || (!force && !isStale(game.wiki_info, game.wiki_url))) return game;
  let info;
  try {
    info = await inspectWiki(game.wiki_url);
  } catch (err) {
    info = { url: game.wiki_url, embeddable: false, license: null, error: err.message, checkedAt: new Date().toISOString() };
  }
  await query(`UPDATE games SET wiki_info = $2 WHERE id = $1 AND wiki_url = $3`, [game.id, JSON.stringify(info), game.wiki_url]);
  if (info.error) console.warn(`[wiki] ${game.slug}: could not check ${game.wiki_url} (${info.error})`);
  return { ...game, wiki_info: info };
}

/** Fetches every article title of one wiki and replaces its rows in the index. Returns the count. */
export async function indexWiki(source) {
  const titles = [];
  try {
    // allpages lists one namespace at a time.
    for (const ns of await contentNamespaces(source)) {
      let cont = {};
      do {
        const json = await api(source, {
          action: 'query',
          list: 'allpages',
          apnamespace: String(ns),
          apfilterredir: 'nonredirects',
          aplimit: 'max',
          ...cont,
        });
        for (const p of json.query?.allpages ?? []) titles.push(p.title);
        cont = json.continue ?? null;
        if (cont) await sleep(150);
      } while (cont && titles.length < MAX_TITLES);
      if (titles.length >= MAX_TITLES) break;
    }
  } catch (err) {
    await query(
      `INSERT INTO wiki_index_state (wiki, error, indexed_at) VALUES ($1, $2, now())
       ON CONFLICT (wiki) DO UPDATE SET error = $2, indexed_at = now()`,
      [source.id, err.message]
    );
    throw err;
  }
  await withTransaction(async (db) => {
    await db.query(`DELETE FROM wiki_titles WHERE wiki = $1`, [source.id]);
    for (let i = 0; i < titles.length; i += 5000) {
      const batch = titles.slice(i, i + 5000);
      await db.query(
        `INSERT INTO wiki_titles (wiki, title, norm) SELECT $1, t.title, t.norm FROM unnest($2::text[], $3::text[]) AS t(title, norm)
         ON CONFLICT DO NOTHING`,
        [source.id, batch, batch.map(normTitle)]
      );
    }
    await db.query(
      `INSERT INTO wiki_index_state (wiki, titles, error, indexed_at) VALUES ($1, $2, NULL, now())
       ON CONFLICT (wiki) DO UPDATE SET titles = $2, error = NULL, indexed_at = now()`,
      [source.id, titles.length]
    );
  });
  return titles.length;
}

/** Indexes one game's wiki now (after it's added or its wiki changes), unless it was indexed recently. */
export async function indexGameWiki(game, { force = false } = {}) {
  const source = sourceFor(game);
  if (!source) return null;
  if (!force) {
    const { rows } = await query(
      `SELECT 1 FROM wiki_index_state WHERE wiki = $1 AND error IS NULL AND indexed_at > now() - make_interval(days => $2)`,
      [source.id, INDEX_MAX_AGE_DAYS]
    );
    if (rows.length) return null;
  }
  return indexWiki(source);
}

export async function syncWikis() {
  const { rows: games } = await query(
    `SELECT id, slug, title, fandom_wiki, wiki_url, wiki_info FROM games WHERE fandom_wiki IS NOT NULL OR wiki_url IS NOT NULL ORDER BY featured DESC, id`
  );
  const sources = new Map();
  for (let game of games) {
    if (game.wiki_url) game = await ensureWikiInfo(game);
    const s = sourceFor(game);
    if (s && !sources.has(s.id)) sources.set(s.id, s);
  }

  // Wikis indexed before titles were normalized get indexed again.
  await query(`DELETE FROM wiki_index_state WHERE wiki IN (SELECT DISTINCT wiki FROM wiki_titles WHERE norm IS NULL)`);

  // Titles of wikis no game uses any more.
  await query(`DELETE FROM wiki_titles WHERE NOT (wiki = ANY($1))`, [[...sources.keys()]]);
  await query(`DELETE FROM wiki_index_state WHERE NOT (wiki = ANY($1))`, [[...sources.keys()]]);

  const { rows: fresh } = await query(
    `SELECT wiki FROM wiki_index_state
     WHERE indexed_at > now() - CASE WHEN error IS NULL THEN make_interval(days => $1) ELSE interval '6 hours' END`,
    [INDEX_MAX_AGE_DAYS]
  );
  const skip = new Set(fresh.map((r) => r.wiki));
  const todo = [...sources.values()].filter((s) => !skip.has(s.id));
  if (!todo.length) return;
  console.log(`[wiki] Indexing ${todo.length} wikis for site search...`);
  let done = 0;
  for (const source of todo) {
    try {
      const n = await indexWiki(source);
      done += 1;
      console.log(`[wiki]   ${source.id}: ${n.toLocaleString()} articles`);
    } catch (err) {
      console.warn(`[wiki]   ${source.id}: failed (${err.message})`);
    }
  }
  console.log(`[wiki] Search index updated for ${done} of ${todo.length} wikis.`);
}

let running = null;
export function startWikiSync() {
  const run = () => {
    running ??= syncWikis()
      .catch((err) => console.warn(`[wiki] Sync failed: ${err.message}`))
      .finally(() => (running = null));
    return running;
  };
  run();
  setInterval(run, 60 * 60000).unref(); // each run only re-indexes wikis past WIKI_INDEX_INTERVAL_DAYS
}
