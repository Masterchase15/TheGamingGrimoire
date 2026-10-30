// Writes games and their wiki sections to the database. Used by the seed sync
// (content in server/src/seed/data) and by the admin API (content sent as JSON).
import { query } from '../db/pool.js';

// Scalar game fields that both sources can set, in insert order.
export const GAME_FIELDS = [
  'slug', 'title', 'category', 'tagline', 'description', 'aliases', 'genres', 'platforms', 'developer',
  'publisher', 'release_year', 'players', 'play_time', 'age', 'is_continuous', 'featured', 'hue', 'hltb_query',
  'steam_appid', 'bgg_id', 'patch_exclude', 'fandom_wiki', 'fandom_page', 'fandom_topics', 'wiki_url',
  'thumbnail_url', 'banner_url', 'rulebook_url', 'rulebook_tldr', 'faq_url', 'unique_faq',
];

const DEFAULTS = {
  aliases: [], genres: [], platforms: [], fandom_topics: [], is_continuous: false, featured: false, hue: 265,
};

/**
 * Inserts or updates a game by slug. `managedBy` records which source owns it
 * ('seed' or 'api'); the seed sync never overwrites games the API owns.
 * Returns { id, created }.
 */
export async function upsertGame(db, g, { managedBy }) {
  const values = GAME_FIELDS.map((f) => g[f] ?? DEFAULTS[f] ?? null);
  values[GAME_FIELDS.indexOf('is_continuous')] = Boolean(g.is_continuous);
  values[GAME_FIELDS.indexOf('featured')] = Boolean(g.featured);
  // JSONB columns: node-postgres would otherwise send these as Postgres arrays.
  for (const f of ['rulebook_tldr', 'unique_faq']) values[GAME_FIELDS.indexOf(f)] = JSON.stringify(g[f] ?? []);
  const placeholders = GAME_FIELDS.map((_, i) => `$${i + 1}`).join(',');
  const updates = GAME_FIELDS.filter((f) => f !== 'slug').map((f) => `${f} = EXCLUDED.${f}`).join(', ');
  const { rows: [row] } = await db.query(
    `INSERT INTO games (${GAME_FIELDS.join(', ')}, managed_by)
     VALUES (${placeholders}, $${GAME_FIELDS.length + 1})
     ON CONFLICT (slug) DO UPDATE SET ${updates}, managed_by = EXCLUDED.managed_by,
       hero_url = CASE WHEN games.banner_url IS NOT NULL AND EXCLUDED.banner_url IS NULL THEN NULL ELSE games.hero_url END,
       steam_assets_checked_at = CASE WHEN games.steam_appid IS DISTINCT FROM EXCLUDED.steam_appid
         OR (games.banner_url IS NOT NULL AND EXCLUDED.banner_url IS NULL)
         THEN NULL ELSE games.steam_assets_checked_at END,
       store_checked_at = CASE WHEN games.steam_appid IS DISTINCT FROM EXCLUDED.steam_appid
         THEN NULL ELSE games.store_checked_at END,
       bgg_checked_at = CASE WHEN games.bgg_id IS DISTINCT FROM EXCLUDED.bgg_id
         THEN NULL ELSE games.bgg_checked_at END,
       wiki_info = CASE WHEN games.wiki_url IS DISTINCT FROM EXCLUDED.wiki_url THEN NULL ELSE games.wiki_info END,
       hltb_checked_at = CASE WHEN games.title IS DISTINCT FROM EXCLUDED.title
         OR games.hltb_query IS DISTINCT FROM EXCLUDED.hltb_query THEN NULL ELSE games.hltb_checked_at END,
       updated_at = now()
     RETURNING id, (xmax = 0) AS created`,
    [...values, managedBy]
  );
  return row;
}

/** Replaces a game's wiki sections (and their glossary terms) with `sections`, in order. */
export async function replaceSections(db, gameId, sections) {
  await db.query(`DELETE FROM wiki_sections WHERE game_id = $1 AND NOT (slug = ANY($2))`, [
    gameId,
    sections.map((s) => s.slug),
  ]);
  for (const [i, s] of sections.entries()) {
    const { rows: [{ id: sectionId }] } = await db.query(
      `INSERT INTO wiki_sections (game_id, slug, title, icon, summary, content, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (game_id, slug) DO UPDATE SET title=$3, icon=$4, summary=$5, content=$6, sort_order=$7
       RETURNING id`,
      [gameId, s.slug, s.title, s.icon ?? null, s.summary ?? null, s.content?.trim() ?? null, i]
    );
    await db.query(`DELETE FROM glossary_terms WHERE section_id = $1`, [sectionId]);
    const terms = s.terms ?? [];
    if (terms.length) {
      await db.query(
        `INSERT INTO glossary_terms (section_id, term, definition, grp, sort_order)
         SELECT $1, t.term, t.definition, t.grp, t.ord
         FROM unnest($2::text[], $3::text[], $4::text[], $5::int[]) AS t(term, definition, grp, ord)`,
        [
          sectionId,
          terms.map((t) => t.term),
          terms.map((t) => t.definition),
          terms.map((t) => t.grp ?? null),
          terms.map((_, j) => j),
        ]
      );
    }
  }
}

/** Replaces a game's hand-listed expansions. Ones synced from BoardGameGeek are kept. */
export async function replaceExpansions(db, gameId, expansions) {
  await db.query(`DELETE FROM game_expansions WHERE game_id = $1 AND source = 'manual'`, [gameId]);
  for (const [i, e] of expansions.entries()) {
    await db.query(
      `INSERT INTO game_expansions (game_id, source, bgg_id, name, year, description, image_url, url, sort_order)
       VALUES ($1, 'manual', $2, $3, $4, $5, $6, $7, $8)`,
      [gameId, e.bgg_id, e.name, e.year, e.description, e.image, e.url, i]
    );
  }
}

/** A game in the same JSON shape the admin API accepts (sections, terms and hand-listed expansions included), or null. */
export async function loadGame(slug, db = { query }) {
  const { rows: [game] } = await db.query(`SELECT * FROM games WHERE slug = $1`, [slug]);
  if (!game) return null;
  const { rows: sections } = await db.query(
    `SELECT s.id, s.slug, s.title, s.icon, s.summary, s.content,
       COALESCE(json_agg(json_build_object('term', t.term, 'definition', t.definition, 'grp', t.grp)
         ORDER BY t.sort_order) FILTER (WHERE t.id IS NOT NULL), '[]') AS terms
     FROM wiki_sections s LEFT JOIN glossary_terms t ON t.section_id = s.id
     WHERE s.game_id = $1 GROUP BY s.id ORDER BY s.sort_order, s.id`,
    [game.id]
  );
  const out = Object.fromEntries(GAME_FIELDS.map((f) => [f, game[f]]));
  if (game.category !== 'video') {
    const { rows: expansions } = await db.query(
      `SELECT name, year, description, image_url AS image, url, bgg_id FROM game_expansions
       WHERE game_id = $1 AND source = 'manual' ORDER BY sort_order`,
      [game.id]
    );
    out.expansions = expansions.map((e) => Object.fromEntries(Object.entries(e).filter(([, v]) => v != null)));
  }
  out.sections = sections.map(({ id, terms, ...s }) => ({
    ...s,
    ...(terms.length ? { terms: terms.map(({ grp, ...t }) => (grp ? { ...t, grp } : t)) } : {}),
  }));
  return { id: game.id, managed_by: game.managed_by, game: out };
}
