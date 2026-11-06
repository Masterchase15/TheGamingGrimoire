import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { HttpError, requireUser } from '../lib/session.js';

const router = Router();

const threadColumns = `t.id, t.title, t.reply_count, t.created_at, t.last_post_at,
  json_build_object('username', u.username, 'name', u.name, 'image', u.image) AS author,
  CASE WHEN g.id IS NULL THEN NULL ELSE json_build_object(
    'slug', g.slug, 'title', g.title, 'category', g.category, 'hue', g.hue, 'capsule_url', g.capsule_url) END AS game`;

router.get('/threads', async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.game === 'general') {
    where = 'WHERE t.game_id IS NULL';
  } else if (req.query.game) {
    params.push(req.query.game);
    where = `WHERE g.slug = $1`;
  }
  const { rows } = await query(
    `SELECT ${threadColumns}, left(t.body, 220) AS excerpt
     FROM forum_threads t JOIN "user" u ON u.id = t.author_id LEFT JOIN games g ON g.id = t.game_id
     ${where} ORDER BY t.last_post_at DESC LIMIT 100`,
    params
  );
  res.json({ threads: rows });
});

function cleanText(value, field, max) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(400, `${field} can't be empty.`);
  if (text.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  return text;
}

router.post('/threads', requireUser, async (req, res) => {
  const title = cleanText(req.body.title, 'Title', 140);
  const body = cleanText(req.body.body, 'Post', 10000);
  let gameId = null;
  if (req.body.gameSlug) {
    const { rows } = await query(`SELECT id FROM games WHERE slug = $1`, [req.body.gameSlug]);
    if (!rows[0]) throw new HttpError(400, 'That game does not exist.');
    gameId = rows[0].id;
  }
  const thread = await withTransaction(async (db) => {
    const { rows: [t] } = await db.query(
      `INSERT INTO forum_threads (game_id, author_id, title, body) VALUES ($1, $2, $3, $4) RETURNING id`,
      [gameId, req.user.id, title, body]
    );
    await db.query(
      `INSERT INTO activities (user_id, type, game_id, thread_id) VALUES ($1, 'thread', $2, $3)`,
      [req.user.id, gameId, t.id]
    );
    return t;
  });
  res.status(201).json({ id: thread.id });
});

// `mine` tells the viewer which posts they wrote (and so can edit or delete).
router.get('/threads/:id', async (req, res) => {
  const viewer = req.user?.id ?? null;
  const { rows: [thread] } = await query(
    `SELECT ${threadColumns}, t.body, t.edited_at, (t.author_id = $2) AS mine
     FROM forum_threads t JOIN "user" u ON u.id = t.author_id LEFT JOIN games g ON g.id = t.game_id
     WHERE t.id = $1`,
    [Number(req.params.id), viewer]
  );
  if (!thread) throw new HttpError(404, 'Thread not found.');
  const { rows: posts } = await query(
    `SELECT p.id, p.body, p.created_at, p.edited_at, (p.author_id = $2) AS mine,
       json_build_object('username', u.username, 'name', u.name, 'image', u.image) AS author
     FROM forum_posts p JOIN "user" u ON u.id = p.author_id
     WHERE p.thread_id = $1 ORDER BY p.created_at`,
    [thread.id, viewer]
  );
  thread.mine = Boolean(thread.mine);
  res.json({ thread, posts: posts.map((p) => ({ ...p, mine: Boolean(p.mine) })) });
});

// Only a thread's author can change it.
async function ownThread(db, id, user) {
  const { rows: [t] } = await db.query(`SELECT id, author_id, game_id FROM forum_threads WHERE id = $1`, [id]);
  if (!t) throw new HttpError(404, 'Thread not found.');
  if (t.author_id !== user.id) throw new HttpError(403, 'You can only change threads you started.');
  return t;
}

router.patch('/threads/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id);
  await ownThread({ query }, id, req.user);
  const title = cleanText(req.body.title, 'Title', 140);
  const body = cleanText(req.body.body, 'Post', 10000);
  await query(
    `UPDATE forum_threads SET title = $2, body = $3,
       edited_at = CASE WHEN title = $2 AND body = $3 THEN edited_at ELSE now() END
     WHERE id = $1`,
    [id, title, body]
  );
  res.json({ ok: true });
});

// Deleting a thread removes its replies and feed entries with it (ON DELETE CASCADE).
router.delete('/threads/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id);
  const t = await ownThread({ query }, id, req.user);
  await query(`DELETE FROM forum_threads WHERE id = $1`, [id]);
  const { rows: [g] } = t.game_id ? await query(`SELECT slug FROM games WHERE id = $1`, [t.game_id]) : { rows: [] };
  res.json({ ok: true, gameSlug: g?.slug ?? null });
});

// Only a reply's author can change it.
async function ownPost(db, threadId, postId, user) {
  const { rows: [p] } = await db.query(
    `SELECT id, author_id, created_at FROM forum_posts WHERE id = $1 AND thread_id = $2`,
    [postId, threadId]
  );
  if (!p) throw new HttpError(404, 'Reply not found.');
  if (p.author_id !== user.id) throw new HttpError(403, 'You can only change your own replies.');
  return p;
}

router.patch('/threads/:id/posts/:postId', requireUser, async (req, res) => {
  const threadId = Number(req.params.id);
  const postId = Number(req.params.postId);
  await ownPost({ query }, threadId, postId, req.user);
  const body = cleanText(req.body.body, 'Reply', 10000);
  await query(
    `UPDATE forum_posts SET body = $2, edited_at = CASE WHEN body = $2 THEN edited_at ELSE now() END WHERE id = $1`,
    [postId, body]
  );
  res.json({ ok: true });
});

router.delete('/threads/:id/posts/:postId', requireUser, async (req, res) => {
  const threadId = Number(req.params.id);
  const postId = Number(req.params.postId);
  await withTransaction(async (db) => {
    const p = await ownPost(db, threadId, postId, req.user);
    await db.query(`DELETE FROM forum_posts WHERE id = $1`, [postId]);
    // Keep the thread's reply count and "last activity" time accurate.
    await db.query(
      `UPDATE forum_threads t SET reply_count = GREATEST(reply_count - 1, 0),
         last_post_at = COALESCE((SELECT max(created_at) FROM forum_posts WHERE thread_id = t.id), t.created_at)
       WHERE id = $1`,
      [threadId]
    );
    // Drop the matching "replied" feed entry (the one closest in time to the reply).
    await db.query(
      `DELETE FROM activities WHERE id = (
         SELECT id FROM activities WHERE user_id = $1 AND type = 'reply' AND thread_id = $2
         ORDER BY abs(extract(epoch FROM created_at - $3::timestamptz)) LIMIT 1)`,
      [req.user.id, threadId, p.created_at]
    );
  });
  res.json({ ok: true });
});

router.post('/threads/:id/posts', requireUser, async (req, res) => {
  const body = cleanText(req.body.body, 'Reply', 10000);
  const threadId = Number(req.params.id);
  const post = await withTransaction(async (db) => {
    const { rows: [t] } = await db.query(
      `UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = now() WHERE id = $1 RETURNING id, game_id`,
      [threadId]
    );
    if (!t) throw new HttpError(404, 'Thread not found.');
    const { rows: [p] } = await db.query(
      `INSERT INTO forum_posts (thread_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
      [threadId, req.user.id, body]
    );
    await db.query(
      `INSERT INTO activities (user_id, type, game_id, thread_id) VALUES ($1, 'reply', $2, $3)`,
      [req.user.id, t.game_id, threadId]
    );
    return p;
  });
  res.status(201).json({ id: post.id });
});

export default router;
