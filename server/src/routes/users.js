import { Router } from 'express';
import { query } from '../db/pool.js';
import { HttpError, publicUserColumns } from '../lib/session.js';
import { NOW_PLAYING } from '../lib/statuses.js';
import { activitySelect } from './feed.js';

const router = Router();

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const { rows } = await query(
    `SELECT ${publicUserColumns()},
       (SELECT count(*)::int FROM user_games ug WHERE ug.user_id = u.id) AS game_count
     FROM "user" u
     WHERE (u.username ILIKE $1 OR u.name ILIKE $1) AND u.id <> COALESCE($2, '')
     ORDER BY (u.username ILIKE $3) DESC, u.username
     LIMIT 20`,
    [`%${q}%`, req.user?.id ?? null, `${q}%`]
  );
  res.json({ users: rows });
});

async function findUser(username) {
  const { rows } = await query(
    `SELECT ${publicUserColumns()} FROM "user" u WHERE lower(u.username) = lower($1)`,
    [username]
  );
  if (!rows[0]) throw new HttpError(404, 'User not found.');
  return rows[0];
}

// Friendship state from the viewer's point of view.
async function relationship(viewerId, userId) {
  if (!viewerId) return { state: 'anonymous' };
  if (viewerId === userId) return { state: 'self' };
  const { rows } = await query(
    `SELECT id, requester_id, status FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
    [viewerId, userId]
  );
  const f = rows[0];
  if (!f) return { state: 'none' };
  if (f.status === 'accepted') return { state: 'friends', id: f.id };
  return { state: f.requester_id === viewerId ? 'outgoing' : 'incoming', id: f.id };
}

router.get('/:username', async (req, res) => {
  const user = await findUser(req.params.username);
  const [rel, counts, nowPlaying, activity, friendCount, reviewCount] = await Promise.all([
    relationship(req.user?.id, user.id),
    query(`SELECT status, count(*)::int AS count FROM user_games WHERE user_id = $1 GROUP BY status`, [user.id]),
    query(
      `SELECT g.id, g.slug, g.title, g.category, g.hue, g.capsule_url, g.hero_url, ug.status, ug.updated_at
       FROM user_games ug JOIN games g ON g.id = ug.game_id
       WHERE ug.user_id = $1 AND ug.status = ANY($2) ORDER BY ug.updated_at DESC LIMIT 12`,
      [user.id, NOW_PLAYING]
    ),
    query(`${activitySelect} WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT 15`, [user.id]),
    query(
      `SELECT count(*)::int AS count FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`,
      [user.id]
    ),
    query(`SELECT count(*)::int AS count FROM reviews WHERE user_id = $1`, [user.id]),
  ]);
  res.json({
    user,
    relationship: rel,
    statusCounts: Object.fromEntries(counts.rows.map((r) => [r.status, r.count])),
    nowPlaying: nowPlaying.rows,
    activity: activity.rows,
    friendCount: friendCount.rows[0].count,
    reviewCount: reviewCount.rows[0].count,
  });
});

router.get('/:username/library', async (req, res) => {
  const user = await findUser(req.params.username);
  const { rows } = await query(
    `SELECT g.id, g.slug, g.title, g.category, g.hue, g.capsule_url, g.is_continuous, g.tagline, g.hltb_main, g.current_version,
       ug.status, ug.rating, ug.hours, ug.favorite, ug.updated_at,
       CASE WHEN ug.user_id = $2 THEN ug.notes END AS notes
     FROM user_games ug JOIN games g ON g.id = ug.game_id
     WHERE ug.user_id = $1 ORDER BY ug.favorite DESC, ug.updated_at DESC`,
    [user.id, req.user?.id ?? null]
  );
  res.json({ user, entries: rows });
});

router.get('/:username/reviews', async (req, res) => {
  const user = await findUser(req.params.username);
  const { rows } = await query(
    `SELECT r.id, r.score, r.body, r.created_at, r.updated_at,
       g.id AS game_id, g.slug, g.title, g.category, g.hue, g.capsule_url, g.release_year
     FROM reviews r JOIN games g ON g.id = r.game_id
     WHERE r.user_id = $1 ORDER BY r.updated_at DESC`,
    [user.id]
  );
  res.json({ reviews: rows });
});

export default router;
