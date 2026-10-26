import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

// Site-wide search: games plus individual wiki pages and glossary terms
// (so "Flying" or "Commander" lands you on the right page). Pass ?category=
// to scope the search to one tab.
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = ['video', 'board', 'card'].includes(req.query.category) ? req.query.category : null;
  const limit = Math.min(Number(req.query.limit) || 8, 25);
  if (q.length < 1) return res.json({ games: [], pages: [], terms: [] });

  const like = `%${q}%`;
  const prefix = `${q}%`;
  const params = [like, prefix, limit, category];

  const [games, pages, terms] = await Promise.all([
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
  ]);

  res.json({ games: games.rows, pages: pages.rows, terms: terms.rows });
});

export default router;
