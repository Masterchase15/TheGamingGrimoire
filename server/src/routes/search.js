import { Router } from 'express';
import { query } from '../db/pool.js';
import { WIKI_KEY_SQL } from '../lib/fandom.js';
import { normTitle } from '../lib/wikiSync.js';

const router = Router();

// Site-wide search: games, the Grimoire's quick guides and glossary terms (so
// "Flying" or "Commander" lands you on the right page), and the articles of every
// game's wiki (characters, items, places... from the wiki_titles index kept by
// lib/wikiSync.js). Pass ?category= to scope the search to one tab.
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = ['video', 'board', 'card'].includes(req.query.category) ? req.query.category : null;
  const limit = Math.min(Number(req.query.limit) || 8, 25);
  if (q.length < 1) return res.json({ games: [], pages: [], terms: [], articles: [] });

  const like = `%${q}%`;
  const prefix = `${q}%`;
  const params = [like, prefix, limit, category];

  const [games, pages, terms, articles] = await Promise.all([
    query(
      `SELECT g.id, g.slug, g.title, g.category, g.tagline, g.hue, g.release_year, g.is_continuous, g.capsule_url
       FROM games g
       WHERE ($4::text IS NULL OR g.category = $4)
         AND (g.title ILIKE $1 OR array_to_string(g.aliases, ' ') ILIKE $1 OR array_to_string(g.genres, ' ') ILIKE $1)
       ORDER BY (g.title ILIKE $2) DESC, (g.title ILIKE $1) DESC, g.featured DESC, g.title
       LIMIT $3`,
      params
    ),
    query(
      `SELECT s.slug, s.title, s.summary, s.icon, g.slug AS game_slug, g.title AS game_title, g.category
       FROM wiki_sections s JOIN games g ON g.id = s.game_id
       WHERE ($4::text IS NULL OR g.category = $4) AND (s.title ILIKE $1 OR s.summary ILIKE $1)
       ORDER BY (s.title ILIKE $2) DESC, g.featured DESC, s.title
       LIMIT $3`,
      params
    ),
    query(
      `SELECT t.term, left(t.definition, 160) AS definition, s.slug AS section_slug, s.title AS section_title,
         g.slug AS game_slug, g.title AS game_title
       FROM glossary_terms t JOIN wiki_sections s ON s.id = t.section_id JOIN games g ON g.id = s.game_id
       WHERE ($4::text IS NULL OR g.category = $4) AND t.term ILIKE $1
       ORDER BY (t.term ILIKE $2) DESC, length(t.term), t.term
       LIMIT $3`,
      params
    ),
    // One-letter searches would match most of every wiki.
    q.length < 2
      ? { rows: [] }
      : query(
          // A wiki shared by several games (e.g. Hollow Knight and Silksong) links to the featured/oldest one.
          // Subpages ("Judy Álvarez/Gallery") rank below articles.
          `WITH wikis AS (
             SELECT DISTINCT ON (wiki) wiki, slug, title, category, hue FROM (
               SELECT ${WIKI_KEY_SQL} AS wiki, g.* FROM games g WHERE ($4::text IS NULL OR g.category = $4)
             ) x WHERE wiki IS NOT NULL ORDER BY wiki, featured DESC, id
           )
           SELECT t.title, w.slug AS game_slug, w.title AS game_title, w.category
           FROM wiki_titles t JOIN wikis w ON w.wiki = t.wiki
           WHERE t.norm LIKE $1
           ORDER BY t.norm = $5 DESC, (t.title LIKE '%/%'), (t.norm LIKE $2) DESC, (t.norm LIKE $6) DESC, length(t.title), t.title
           LIMIT $3`,
          [`%${normTitle(q)}%`, `${normTitle(q)}%`, limit, category, normTitle(q), `% ${normTitle(q)}%`]
        ),
  ]);

  res.json({ games: games.rows, pages: pages.rows, terms: terms.rows, articles: articles.rows });
});

export default router;
