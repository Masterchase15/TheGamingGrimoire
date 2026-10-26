import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireUser } from '../lib/session.js';
import { NOW_PLAYING } from '../lib/statuses.js';

const router = Router();

// Shared activity projection: who did what, on which game/thread/friend.
export const activitySelect = `
  SELECT a.id, a.type, a.status, a.created_at,
    json_build_object('username', u.username, 'name', u.name, 'image', u.image) AS actor,
    CASE WHEN g.id IS NULL THEN NULL ELSE json_build_object(
      'id', g.id, 'slug', g.slug, 'title', g.title, 'category', g.category, 'hue', g.hue, 'capsule_url', g.capsule_url,
      'is_continuous', g.is_continuous) END AS game,
    CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object('id', t.id, 'title', t.title) END AS thread,
    CASE WHEN fu.id IS NULL THEN NULL ELSE json_build_object('username', fu.username, 'name', fu.name) END AS friend
  FROM activities a
  JOIN "user" u ON u.id = a.user_id
  LEFT JOIN games g ON g.id = a.game_id
  LEFT JOIN forum_threads t ON t.id = a.thread_id
  LEFT JOIN "user" fu ON fu.id = a.meta->>'friendId'`;

const friendIdsSql = `
  SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
  FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`;

router.get('/', requireUser, async (req, res) => {
  const uid = req.user.id;
  const [recent, mine, friendActivity, friendsPlaying, threads, pending, libraryUpdates] = await Promise.all([
    query(
      `SELECT g.id, g.slug, g.title, g.category, g.hue, g.tagline, g.capsule_url, v.viewed_at
       FROM game_views v JOIN games g ON g.id = v.game_id
       WHERE v.user_id = $1 ORDER BY v.viewed_at DESC LIMIT 8`,
      [uid]
    ),
    query(
      `SELECT g.id, g.slug, g.title, g.category, g.hue, g.capsule_url, g.hero_url, g.is_continuous, g.hltb_main, g.current_version, g.last_update_at, ug.status, ug.hours, ug.updated_at
       FROM user_games ug JOIN games g ON g.id = ug.game_id
       WHERE ug.user_id = $1 AND ug.status = ANY($2) ORDER BY ug.updated_at DESC LIMIT 8`,
      [uid, NOW_PLAYING]
    ),
    query(
      `${activitySelect} WHERE a.user_id IN (${friendIdsSql}) ORDER BY a.created_at DESC LIMIT 25`,
      [uid]
    ),
    query(
      `SELECT g.slug, g.title, g.category, g.hue, g.capsule_url,
         json_agg(json_build_object('username', u.username, 'name', u.name, 'image', u.image)
           ORDER BY ug.updated_at DESC) AS players
       FROM user_games ug JOIN games g ON g.id = ug.game_id JOIN "user" u ON u.id = ug.user_id
       WHERE ug.status = ANY($2) AND ug.user_id IN (${friendIdsSql})
       GROUP BY g.id ORDER BY count(*) DESC, max(ug.updated_at) DESC LIMIT 8`,
      [uid, NOW_PLAYING]
    ),
    query(
      `SELECT t.id, t.title, t.reply_count, t.last_post_at, u.username AS author,
         g.slug AS game_slug, g.title AS game_title
       FROM forum_threads t JOIN "user" u ON u.id = t.author_id LEFT JOIN games g ON g.id = t.game_id
       ORDER BY t.last_post_at DESC LIMIT 6`
    ),
    query(`SELECT count(*)::int AS count FROM friendships WHERE addressee_id = $1 AND status = 'pending'`, [uid]),
    // Latest patch notes for video games in the user's library.
    query(
      `SELECT u.id, u.title, u.version, u.published_at, g.slug, g.title AS game_title, g.capsule_url, g.hue, g.category
       FROM game_updates u JOIN games g ON g.id = u.game_id JOIN user_games ug ON ug.game_id = g.id AND ug.user_id = $1
       WHERE u.published_at > now() - interval '45 days'
       ORDER BY u.published_at DESC LIMIT 6`,
      [uid]
    ),
  ]);

  res.json({
    recentlyViewed: recent.rows,
    nowPlaying: mine.rows,
    friendActivity: friendActivity.rows,
    friendsPlaying: friendsPlaying.rows,
    recentThreads: threads.rows,
    pendingRequests: pending.rows[0].count,
    libraryUpdates: libraryUpdates.rows,
  });
});

export default router;
