import { Router } from 'express';
import { query } from '../db/pool.js';
import { ensureHltb, hltbUrl } from '../lib/hltb.js';
import { HttpError, requireUser } from '../lib/session.js';
import { statusesFor } from '../lib/statuses.js';
import { bggUrl } from '../lib/bgg.js';
import { plainExcerpt, steamStoreUrl } from '../lib/steam.js';
import { refreshGameNewsIfStale, refreshStoreIfStale } from '../lib/steamSync.js';
import { getArticle, getOverview, searchWiki } from '../lib/fandom.js';

const router = Router();

const LIST_COLUMNS = `g.id, g.slug, g.title, g.category, g.tagline, g.genres, g.platforms, g.release_year,
  g.players, g.play_time, g.is_continuous, g.featured, g.hue, g.hltb_main,
  g.capsule_url, g.header_url, g.current_version, g.last_update_at, g.price_discount,
  (SELECT count(*)::int FROM wiki_sections s WHERE s.game_id = g.id) AS section_count,
  (SELECT count(*)::int FROM user_games ug WHERE ug.game_id = g.id) AS member_count`;

const CATEGORIES = new Set(['video', 'board', 'card']);
const SORTS = {
  popular: 'member_count DESC, g.featured DESC, g.title ASC',
  title: 'g.title ASC',
  newest: 'g.release_year DESC NULLS LAST, g.title ASC',
};

router.get('/', async (req, res) => {
  const { category, q, genre, featured } = req.query;
  const where = [];
  const params = [];
  if (category) {
    if (!CATEGORIES.has(category)) throw new HttpError(400, 'Unknown category.');
    params.push(category);
    where.push(`g.category = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    where.push(`(g.title ILIKE ${p} OR array_to_string(g.aliases, ' ') ILIKE ${p} OR array_to_string(g.genres, ' ') ILIKE ${p})`);
  }
  if (genre) {
    params.push(genre);
    where.push(`$${params.length} = ANY(g.genres)`);
  }
  if (featured) where.push('g.featured');
  const order = SORTS[req.query.sort] || SORTS.popular;

  const { rows } = await query(
    `SELECT ${LIST_COLUMNS} FROM games g ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`,
    params
  );

  // Genre facets for the category page filter chips.
  const genres = [...new Set(rows.flatMap((r) => r.genres))].sort();
  res.json({ games: rows, genres });
});

router.get('/stats', async (_req, res) => {
  const { rows } = await query(
    `SELECT category, count(*)::int AS count FROM games GROUP BY category`
  );
  const counts = Object.fromEntries(rows.map((r) => [r.category, r.count]));
  const { rows: [pages] } = await query(`SELECT count(*)::int AS count FROM wiki_sections`);
  const { rows: [terms] } = await query(`SELECT count(*)::int AS count FROM glossary_terms`);
  res.json({ counts, pages: pages.count, terms: terms.count });
});

function hltbPayload(game) {
  if (game.category !== 'video' || game.is_continuous) return null;
  if (!game.hltb_id) return { found: false };
  return {
    found: true,
    id: game.hltb_id,
    name: game.hltb_name,
    main: game.hltb_main,
    extra: game.hltb_extra,
    complete: game.hltb_complete,
    url: hltbUrl(game.hltb_id),
  };
}

const priceOf = (r) => ({
  currency: r.price_currency,
  initial: r.price_initial,
  final: r.price_final,
  discount: r.price_discount ?? 0,
});

const dlcPayload = ({ price_currency, price_initial, price_final, price_discount, ...d }) => ({
  ...d,
  price: price_final != null ? priceOf({ price_currency, price_initial, price_final, price_discount }) : null,
  url: steamStoreUrl(d.appid),
});

// A hand-listed expansion that is also on BoardGameGeek replaces the synced copy.
function uniqueExpansions(rows) {
  const listed = new Set(rows.filter((r) => r.source === 'manual' && r.bgg_id).map((r) => r.bgg_id));
  return rows.filter((r) => r.source === 'manual' || !listed.has(r.bgg_id));
}

router.get('/:slug', async (req, res) => {
  const { rows } = await query(`SELECT * FROM games WHERE slug = $1`, [req.params.slug]);
  if (!rows[0]) throw new HttpError(404, 'Game not found.');
  const game = await ensureHltb(rows[0]);

  refreshGameNewsIfStale(game);
  refreshStoreIfStale(game);

  const [sections, statusCounts, entry, threads, updates, reviews, addons] = await Promise.all([
    query(
      `SELECT s.slug, s.title, s.icon, s.summary,
        (SELECT count(*)::int FROM glossary_terms t WHERE t.section_id = s.id) AS term_count
       FROM wiki_sections s WHERE s.game_id = $1 ORDER BY s.sort_order, s.id`,
      [game.id]
    ),
    query(`SELECT status, count(*)::int AS count FROM user_games WHERE game_id = $1 GROUP BY status`, [game.id]),
    req.user
      ? query(`SELECT status, rating, hours, notes, favorite, updated_at FROM user_games WHERE user_id = $1 AND game_id = $2`, [req.user.id, game.id])
      : { rows: [] },
    query(`SELECT count(*)::int AS count FROM forum_threads WHERE game_id = $1`, [game.id]),
    game.category === 'video'
      ? query(
          `SELECT id, title, url, version, published_at, left(content, 1500) AS excerpt
           FROM game_updates WHERE game_id = $1 ORDER BY published_at DESC LIMIT 10`,
          [game.id]
        )
      : { rows: [] },
    query(`SELECT count(*)::int AS count, round(avg(score)::numeric, 1)::float AS average FROM reviews WHERE game_id = $1`, [game.id]),
    game.category === 'video'
      ? query(
          `SELECT appid, name, kind, description, header_url, release_date, released_on, coming_soon, is_free,
             price_currency, price_initial, price_final, price_discount
           FROM game_dlc WHERE game_id = $1
           ORDER BY coming_soon DESC, released_on DESC NULLS LAST, name`,
          [game.id]
        )
      : query(
          // Hand-listed expansions first, in their listed order, then BoardGameGeek's most popular.
          `SELECT source, bgg_id, name, year, description, image_url, url FROM game_expansions
           WHERE game_id = $1 ORDER BY source = 'bgg', sort_order`,
          [game.id]
        ),
  ]);

  if (req.user) {
    query(
      `INSERT INTO game_views (user_id, game_id) VALUES ($1, $2)
       ON CONFLICT (user_id, game_id) DO UPDATE SET viewed_at = now()`,
      [req.user.id, game.id]
    ).catch(() => {});
  }

  const {
    hltb_query, hltb_id, hltb_name, hltb_main, hltb_extra, hltb_complete, hltb_checked_at,
    steam_assets_checked_at, news_checked_at, fandom_topics, fandom_page, patch_exclude, store_checked_at, bgg_checked_at,
    price_currency, price_initial, price_final, price_discount, is_free, ...publicGame
  } = game;
  // The Fandom article "Read the wiki" opens; defaults to the game's own title on its wiki.
  const fandomPage = game.fandom_wiki ? fandom_page || game.title : null;

  res.json({
    game: { ...publicGame, fandom_page: fandomPage, statuses: statusesFor(game) },
    sections: sections.rows,
    hltb: hltbPayload(game),
    stats: Object.fromEntries(statusCounts.rows.map((r) => [r.status, r.count])),
    threadCount: threads.rows[0].count,
    reviews: reviews.rows[0],
    steam: game.steam_appid
      ? {
          appid: game.steam_appid,
          storeUrl: steamStoreUrl(game.steam_appid),
          currentVersion: game.current_version,
          lastUpdateAt: game.last_update_at,
          checkedAt: game.news_checked_at,
        }
      : null,
    updates: updates.rows.map((u) => ({ ...u, excerpt: plainExcerpt(u.excerpt) })),
    store:
      game.category === 'video' && game.steam_appid && game.store_checked_at
        ? {
            isFree: Boolean(is_free),
            price: price_final != null ? priceOf(game) : null,
            checkedAt: store_checked_at,
          }
        : null,
    dlc: game.category === 'video' ? addons.rows.map(dlcPayload) : null,
    expansions: game.category !== 'video' ? uniqueExpansions(addons.rows) : null,
    bgg: game.bgg_id ? { id: game.bgg_id, url: bggUrl(game.bgg_id) } : null,
    entry: entry.rows[0] ?? null,
  });
});

async function fandomGame(slug) {
  const { rows } = await query(
    `SELECT slug, fandom_wiki, fandom_page, fandom_topics FROM games WHERE slug = $1`,
    [slug]
  );
  if (!rows[0]) throw new HttpError(404, 'Game not found.');
  if (!rows[0].fandom_wiki) throw new HttpError(404, 'This game has no Fandom wiki.');
  return rows[0];
}

const fandomFailure = (err) =>
  err instanceof HttpError ? err : new HttpError(502, 'The Fandom wiki could not be reached. Try again in a moment.');

// Fandom overview: main article summary + featured topics. Returns { fandom: null } when the game has no wiki.
router.get('/:slug/fandom', async (req, res) => {
  const { rows } = await query(`SELECT fandom_wiki, fandom_page, fandom_topics FROM games WHERE slug = $1`, [req.params.slug]);
  if (!rows[0]) throw new HttpError(404, 'Game not found.');
  if (!rows[0].fandom_wiki) return res.json({ fandom: null });
  try {
    const fandom = await getOverview({ wiki: rows[0].fandom_wiki, page: rows[0].fandom_page, topics: rows[0].fandom_topics });
    res.json({ fandom });
  } catch (err) {
    console.warn(`[fandom] overview ${req.params.slug}: ${err.message}`);
    throw fandomFailure(err);
  }
});

router.get('/:slug/fandom/page', async (req, res) => {
  const title = String(req.query.title || '').trim();
  if (!title) throw new HttpError(400, 'Missing page title.');
  const game = await fandomGame(req.params.slug);
  try {
    const article = await getArticle(game.fandom_wiki, title, game.slug);
    res.json({ article, wiki: game.fandom_wiki });
  } catch (err) {
    if (!(err instanceof HttpError)) console.warn(`[fandom] page ${title}: ${err.message}`);
    throw fandomFailure(err);
  }
});

router.get('/:slug/fandom/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) return res.json({ results: [] });
  const game = await fandomGame(req.params.slug);
  try {
    res.json({ results: await searchWiki(game.fandom_wiki, q) });
  } catch (err) {
    throw fandomFailure(err);
  }
});

const reviewSelect = `
  SELECT r.id, r.score, r.body, r.created_at, r.updated_at,
    json_build_object('username', u.username, 'name', u.name, 'image', u.image) AS author
  FROM reviews r JOIN "user" u ON u.id = r.user_id`;

async function gameIdFor(slug) {
  const { rows } = await query(`SELECT id FROM games WHERE slug = $1`, [slug]);
  if (!rows[0]) throw new HttpError(404, 'Game not found.');
  return rows[0].id;
}

// Reviews for a game, newest first, plus the average score and the viewer's own review.
router.get('/:slug/reviews', async (req, res) => {
  const gameId = await gameIdFor(req.params.slug);
  const [list, summary, mine] = await Promise.all([
    query(`${reviewSelect} WHERE r.game_id = $1 ORDER BY r.updated_at DESC LIMIT 100`, [gameId]),
    query(`SELECT count(*)::int AS count, round(avg(score)::numeric, 1)::float AS average FROM reviews WHERE game_id = $1`, [gameId]),
    req.user ? query(`${reviewSelect} WHERE r.game_id = $1 AND r.user_id = $2`, [gameId, req.user.id]) : { rows: [] },
  ]);
  res.json({ reviews: list.rows, count: summary.rows[0].count, average: summary.rows[0].average, mine: mine.rows[0] ?? null });
});

router.put('/:slug/reviews', requireUser, async (req, res) => {
  const gameId = await gameIdFor(req.params.slug);
  const score = Number(req.body.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) throw new HttpError(400, 'Score must be a whole number from 1 to 10.');
  const body = req.body.body ? String(req.body.body).trim().slice(0, 5000) || null : null;
  const { rows: [saved] } = await query(
    `INSERT INTO reviews (user_id, game_id, score, body) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, game_id) DO UPDATE SET score = $3, body = $4, updated_at = now()
     RETURNING id, (xmax = 0) AS created`,
    [req.user.id, gameId, score, body]
  );
  // New reviews show up in friends' feeds; edits don't.
  if (saved.created) {
    await query(`INSERT INTO activities (user_id, type, game_id, meta) VALUES ($1, 'review', $2, $3)`, [
      req.user.id,
      gameId,
      { score },
    ]);
  }
  const { rows: [review] } = await query(`${reviewSelect} WHERE r.id = $1`, [saved.id]);
  res.json({ review });
});

router.delete('/:slug/reviews', requireUser, async (req, res) => {
  const gameId = await gameIdFor(req.params.slug);
  await query(`DELETE FROM reviews WHERE user_id = $1 AND game_id = $2`, [req.user.id, gameId]);
  await query(`DELETE FROM activities WHERE user_id = $1 AND game_id = $2 AND type = 'review'`, [req.user.id, gameId]);
  res.json({ ok: true });
});

router.get('/:slug/updates/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.title, u.url, u.author, u.version, u.content, u.published_at,
       g.slug AS game_slug, g.title AS game_title, g.hero_url, g.capsule_url, g.hue, g.category
     FROM game_updates u JOIN games g ON g.id = u.game_id
     WHERE g.slug = $1 AND u.id = $2`,
    [req.params.slug, Number(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(404, 'Update not found.');
  res.json({ update: rows[0] });
});

router.get('/:slug/sections/:section', async (req, res) => {
  const { rows } = await query(
    `SELECT s.id, s.slug, s.title, s.icon, s.summary, s.content,
       g.slug AS game_slug, g.title AS game_title, g.category AS game_category, g.hue AS game_hue,
       g.capsule_url AS game_capsule, g.hero_url AS game_hero
     FROM wiki_sections s JOIN games g ON g.id = s.game_id
     WHERE g.slug = $1 AND s.slug = $2`,
    [req.params.slug, req.params.section]
  );
  if (!rows[0]) throw new HttpError(404, 'Wiki page not found.');
  const { id, ...section } = rows[0];
  const [terms, siblings] = await Promise.all([
    query(`SELECT term, definition, grp FROM glossary_terms WHERE section_id = $1 ORDER BY sort_order, term`, [id]),
    query(
      `SELECT s.slug, s.title, s.icon FROM wiki_sections s JOIN games g ON g.id = s.game_id
       WHERE g.slug = $1 ORDER BY s.sort_order, s.id`,
      [req.params.slug]
    ),
  ]);
  res.json({ section, terms: terms.rows, siblings: siblings.rows });
});

export default router;
