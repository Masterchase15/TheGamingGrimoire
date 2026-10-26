import { Router } from 'express';
import { query } from '../db/pool.js';
import { HttpError, requireUser } from '../lib/session.js';
import { statusesFor } from '../lib/statuses.js';

const router = Router();
router.use(requireUser);

function parseEntry(body, game) {
  const allowed = statusesFor(game);
  if (!allowed.includes(body.status)) {
    throw new HttpError(400, `Status must be one of: ${allowed.join(', ')}.`);
  }
  const rating = body.rating == null || body.rating === '' ? null : Number(body.rating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
    throw new HttpError(400, 'Rating must be a whole number from 1 to 10.');
  }
  const hours = body.hours == null || body.hours === '' ? null : Number(body.hours);
  if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 100000)) {
    throw new HttpError(400, 'Hours must be a positive number.');
  }
  const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  return { status: body.status, rating, hours, notes, favorite: Boolean(body.favorite) };
}

router.put('/:gameId', async (req, res) => {
  const { rows: [game] } = await query(`SELECT id, is_continuous FROM games WHERE id = $1`, [req.params.gameId]);
  if (!game) throw new HttpError(404, 'Game not found.');
  const entry = parseEntry(req.body, game);

  const { rows: [previous] } = await query(
    `SELECT status FROM user_games WHERE user_id = $1 AND game_id = $2`,
    [req.user.id, game.id]
  );
  const { rows: [saved] } = await query(
    `INSERT INTO user_games (user_id, game_id, status, rating, hours, notes, favorite)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, game_id) DO UPDATE SET status = $3, rating = $4, hours = $5, notes = $6,
       favorite = $7, updated_at = now()
     RETURNING status, rating, hours, notes, favorite, updated_at`,
    [req.user.id, game.id, entry.status, entry.rating, entry.hours, entry.notes, entry.favorite]
  );

  // Only status changes show up in friends' feeds.
  if (previous?.status !== entry.status) {
    await query(
      `INSERT INTO activities (user_id, type, game_id, status) VALUES ($1, 'status', $2, $3)`,
      [req.user.id, game.id, entry.status]
    );
  }
  res.json({ entry: saved });
});

router.delete('/:gameId', async (req, res) => {
  await query(`DELETE FROM user_games WHERE user_id = $1 AND game_id = $2`, [req.user.id, req.params.gameId]);
  res.json({ ok: true });
});

export default router;
