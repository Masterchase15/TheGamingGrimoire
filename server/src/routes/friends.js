import { Router } from 'express';
import { query } from '../db/pool.js';
import { HttpError, publicUserColumns, requireUser } from '../lib/session.js';

const router = Router();
router.use(requireUser);

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT f.id AS friendship_id, f.status, f.requester_id, f.created_at AS since, ${publicUserColumns()}
     FROM friendships f
     JOIN "user" u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
     WHERE f.requester_id = $1 OR f.addressee_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  const shape = (r) => ({ friendshipId: r.friendship_id, since: r.since, user: pickUser(r) });
  res.json({
    friends: rows.filter((r) => r.status === 'accepted').map(shape),
    incoming: rows.filter((r) => r.status === 'pending' && r.requester_id !== req.user.id).map(shape),
    outgoing: rows.filter((r) => r.status === 'pending' && r.requester_id === req.user.id).map(shape),
  });
});

function pickUser(r) {
  return {
    id: r.id,
    username: r.username,
    display_username: r.display_username,
    name: r.name,
    image: r.image,
    bio: r.bio,
  };
}

router.post('/request', async (req, res) => {
  const { rows: [target] } = await query(`SELECT id FROM "user" WHERE lower(username) = lower($1)`, [
    String(req.body.username || ''),
  ]);
  if (!target) throw new HttpError(404, 'User not found.');
  if (target.id === req.user.id) throw new HttpError(400, "You can't add yourself.");

  const { rows: [existing] } = await query(
    `SELECT id, requester_id, status FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
    [req.user.id, target.id]
  );
  if (existing?.status === 'accepted') return res.json({ state: 'friends', id: existing.id });
  // They already asked us: accept instead of creating a duplicate request.
  if (existing && existing.requester_id === target.id) {
    await accept(existing.id, req.user.id);
    return res.json({ state: 'friends', id: existing.id });
  }
  if (existing) return res.json({ state: 'outgoing', id: existing.id });

  const { rows: [created] } = await query(
    `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2) RETURNING id`,
    [req.user.id, target.id]
  );
  res.json({ state: 'outgoing', id: created.id });
});

async function accept(friendshipId, userId) {
  const { rows: [f] } = await query(
    `UPDATE friendships SET status = 'accepted', responded_at = now()
     WHERE id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING requester_id, addressee_id`,
    [friendshipId, userId]
  );
  if (!f) throw new HttpError(404, 'Friend request not found.');
  await query(
    `INSERT INTO activities (user_id, type, meta) VALUES ($1, 'friend', $3), ($2, 'friend', $4)`,
    [
      f.requester_id,
      f.addressee_id,
      JSON.stringify({ friendId: f.addressee_id }),
      JSON.stringify({ friendId: f.requester_id }),
    ]
  );
}

router.post('/:id/accept', async (req, res) => {
  await accept(Number(req.params.id), req.user.id);
  res.json({ state: 'friends' });
});

// Decline, cancel or unfriend.
router.delete('/:id', async (req, res) => {
  await query(
    `DELETE FROM friendships WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
    [Number(req.params.id), req.user.id]
  );
  res.json({ state: 'none' });
});

export default router;
