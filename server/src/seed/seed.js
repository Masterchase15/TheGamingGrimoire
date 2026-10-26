import crypto from 'node:crypto';
import { pool, withTransaction } from '../db/pool.js';
import videoGames from './data/video-games.js';
import boardGames from './data/board-games.js';
import cardGames from './data/card-games.js';
import mtg from './data/mtg.js';
import fandom from './data/fandom.js';

export const ALL_GAMES = [...videoGames, ...boardGames, mtg, ...cardGames];

// Wiki content lives in code (server/src/seed/data) and is synced into the
// database on startup. A hash of the content lets unchanged boots skip the work.
export async function seed({ force = false } = {}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS seed_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const hash = crypto.createHash('sha256').update(JSON.stringify([ALL_GAMES, fandom])).digest('hex');
  const { rows } = await pool.query(`SELECT value FROM seed_meta WHERE key = 'content_hash'`);
  if (!force && rows[0]?.value === hash) return;

  await withTransaction(async (db) => {
    for (const g of ALL_GAMES) {
      const { rows: [{ id: gameId }] } = await db.query(
        `INSERT INTO games (slug, title, category, tagline, description, aliases, genres, platforms, developer,
           publisher, release_year, players, play_time, age, is_continuous, featured, hue, hltb_query, steam_appid, patch_exclude, fandom_wiki, fandom_page, fandom_topics)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         ON CONFLICT (slug) DO UPDATE SET title=$2, category=$3, tagline=$4, description=$5, aliases=$6, genres=$7,
           platforms=$8, developer=$9, publisher=$10, release_year=$11, players=$12, play_time=$13, age=$14,
           is_continuous=$15, featured=$16, hue=$17, hltb_query=$18,
           steam_appid=$19, patch_exclude=$20, fandom_wiki=$21, fandom_page=$22, fandom_topics=$23,
           steam_assets_checked_at = CASE WHEN games.steam_appid IS DISTINCT FROM $19 THEN NULL ELSE games.steam_assets_checked_at END,
           updated_at=now()
         RETURNING id`,
        [
          g.slug, g.title, g.category, g.tagline ?? null, g.description ?? null, g.aliases ?? [], g.genres ?? [],
          g.platforms ?? [], g.developer ?? null, g.publisher ?? null, g.release_year ?? null, g.players ?? null,
          g.play_time ?? null, g.age ?? null, Boolean(g.is_continuous), Boolean(g.featured), g.hue ?? 265,
          g.hltb_query ?? null, g.steam_appid ?? null, g.patch_exclude ?? null,
          fandom[g.slug]?.wiki ?? null, fandom[g.slug]?.page ?? null, fandom[g.slug]?.topics ?? [],
        ]
      );

      const sections = g.sections ?? [];
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
    await db.query(
      `INSERT INTO seed_meta (key, value) VALUES ('content_hash', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [hash]
    );
  });
  console.log(`[seed] Synced ${ALL_GAMES.length} games into the wiki.`);
}
