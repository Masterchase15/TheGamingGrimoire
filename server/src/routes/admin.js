// Admin API for adding and updating games. Every route requires an admin (see
// lib/admin.js). Games written here are marked managed_by = 'api' so the
// startup seed sync never overwrites them.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express, { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { requireAdmin } from '../lib/admin.js';
import { getOverview, sourceFor } from '../lib/fandom.js';
import { GAME_FIELDS, loadGame, replaceExpansions, replaceSections, upsertGame } from '../lib/gameStore.js';
import { validateGame } from '../lib/gameSchema.js';
import { UPLOADS_DIR } from '../lib/env.js';
import { hasBggToken } from '../lib/bgg.js';
import { syncExpansions } from '../lib/bggSync.js';
import { ensureHltb } from '../lib/hltb.js';
import { HttpError } from '../lib/session.js';
import { hasSteamKey } from '../lib/steam.js';
import { syncAssets, syncGameNews, syncGameStore } from '../lib/steamSync.js';
import { ensureWikiInfo, indexGameWiki } from '../lib/wikiSync.js';

const router = Router();
router.use(requireAdmin);

const audit = (db, req, action, slug, details) =>
  db.query(`INSERT INTO admin_audit_log (actor, action, game_slug, details, ip) VALUES ($1, $2, $3, $4, $5)`, [
    req.admin.actor,
    action,
    slug,
    JSON.stringify(details),
    req.ip,
  ]);

const failure = (err) => ({ error: err.message });

// Pulls Steam art/patch notes/price/DLC, BoardGameGeek expansions, HowLongToBeat
// times and the wiki overview (Fandom, or the license check of a wiki_url) for a
// game right away, so its page is complete without waiting for the background syncs.
// The wiki's search index is built in the background afterwards.
async function enrich(id, { force = false } = {}) {
  if (force) await query(`UPDATE games SET hltb_checked_at = NULL WHERE id = $1`, [id]);
  const { rows: [g] } = await query(`SELECT * FROM games WHERE id = $1`, [id]);
  const out = {};

  // The store API needs no key, so price and DLC work even without STEAM_API_KEY.
  if (g.category === 'video' && g.steam_appid) {
    try {
      const s = await syncGameStore(g, { force });
      out.store = s ? { price: s.price, dlc: s.dlc } : { skipped: `Steam has no store page for app ${g.steam_appid}.` };
    } catch (err) {
      out.store = failure(err);
    }
  }

  if (g.category !== 'video') {
    const { rows: [m] } = await query(`SELECT count(*)::int AS count FROM game_expansions WHERE game_id = $1 AND source = 'manual'`, [id]);
    if (!g.bgg_id) out.expansions = { listed: m.count, skipped: 'No bgg_id, so nothing syncs from BoardGameGeek.' };
    else if (!hasBggToken()) out.expansions = { listed: m.count, skipped: 'BGG_API_TOKEN is not set on the server.' };
    else {
      try {
        out.expansions = { listed: m.count, fromBgg: await syncExpansions(g) };
      } catch (err) {
        out.expansions = { listed: m.count, ...failure(err) };
      }
    }
  }

  if (!g.steam_appid) out.steam = { skipped: 'No steam_appid.' };
  else if (!hasSteamKey()) out.steam = { skipped: 'STEAM_API_KEY is not set on the server.' };
  else {
    try {
      await syncAssets({ force, gameId: id });
      const { rows: [art] } = await query(`SELECT capsule_url, hero_url, header_url FROM games WHERE id = $1`, [id]);
      out.steam = { artwork: Boolean(art.capsule_url || art.header_url) };
      if (g.category === 'video') {
        await syncGameNews(g);
        const { rows: [n] } = await query(`SELECT count(*)::int AS count FROM game_updates WHERE game_id = $1`, [id]);
        out.steam.patchNotes = n.count;
      }
    } catch (err) {
      out.steam = failure(err);
    }
  }

  if (g.category !== 'video') out.hltb = { skipped: 'Only video games have HowLongToBeat times.' };
  else if (g.is_continuous) out.hltb = { skipped: 'Ongoing games (is_continuous) have no completion times.' };
  else {
    const h = await ensureHltb(g);
    out.hltb = h.hltb_id
      ? { found: true, name: h.hltb_name, main: h.hltb_main, extra: h.hltb_extra, complete: h.hltb_complete }
      : { found: false, hint: 'Set hltb_query to the exact title HowLongToBeat uses.' };
  }

  const wg = await ensureWikiInfo(g, { force: force || !g.wiki_info });
  const source = sourceFor(wg);
  if (wg.wiki_url) {
    const info = wg.wiki_info;
    out.wiki = {
      url: wg.wiki_url,
      sitename: info.sitename ?? null,
      license: info.license,
      embeddable: info.embeddable,
      ...(info.error ? { error: info.error } : {}),
      ...(info.license?.reusable && !info.api ? { noApi: true } : {}),
    };
  }
  if (!source) out.fandom = { skipped: wg.wiki_url ? 'Links out to the wiki (its articles are not shown on the site).' : 'No fandom_wiki.' };
  else {
    try {
      const o = await getOverview(source, { page: g.fandom_page, topics: g.fandom_topics });
      out.fandom = {
        wiki: o.sitename,
        mainArticle: o.main?.title ?? null,
        topics: o.topics.length,
        ...(o.topics.length < g.fandom_topics.length ? { missingTopics: g.fandom_topics.length - o.topics.length } : {}),
      };
    } catch (err) {
      out.fandom = failure(err);
    }
    indexGameWiki(wg, { force }).catch((err) => console.warn(`[wiki] Indexing ${g.slug} failed: ${err.message}`));
  }
  return out;
}

// Lets scripts check their key before sending anything.
router.get('/me', (req, res) => res.json({ ok: true, actor: req.admin.actor, via: req.admin.via }));

// The stored game in the same shape POST accepts: handy for editing an existing game.
router.get('/games/:slug', async (req, res) => {
  const stored = await loadGame(req.params.slug);
  if (!stored) throw new HttpError(404, 'Game not found.');
  res.json({ managed_by: stored.managed_by, game: stored.game });
});

// Create or update one game by slug. Omitted fields keep their stored values;
// `sections`, when sent, replaces the game's wiki sections.
// Responds 400 with { errors } when the data is invalid.
router.post('/games', async (req, res) => {
  const slug = typeof req.body?.slug === 'string' ? req.body.slug : null;
  const stored = slug ? await loadGame(slug) : null;
  const { game, sections, expansions, errors, warnings } = validateGame(req.body, stored?.game);
  if (errors.length) return res.status(400).json({ error: 'The game data is not valid.', errors, warnings });
  if (stored?.managed_by === 'seed') {
    warnings.push('This game came from the seed files. It is now managed by the admin API, so later edits to it in server/src/seed/data are ignored.');
  }

  const changed = GAME_FIELDS.filter((f) => JSON.stringify(stored?.game[f] ?? null) !== JSON.stringify(game[f] ?? null));
  const compact = (list) => JSON.stringify((list ?? []).map((e) => Object.fromEntries(Object.entries(e).filter(([, v]) => v != null))));
  if (expansions && compact(expansions) !== compact(stored?.game.expansions)) changed.push('expansions');
  // ?dryRun=1 validates and reports what would change without saving anything.
  if (req.query.dryRun) {
    return res.json({ status: stored ? 'would-update' : 'would-create', slug: game.slug, changed, warnings });
  }

  const { id, created } = await withTransaction(async (db) => {
    const row = await upsertGame(db, game, { managedBy: 'api' });
    if (sections) await replaceSections(db, row.id, sections);
    if (expansions) await replaceExpansions(db, row.id, expansions);
    await audit(db, req, row.created ? 'create' : 'update', game.slug, {
      changed,
      sections: sections ? sections.length : 'unchanged',
      ...(expansions ? { expansions: expansions.length } : {}),
    });
    return row;
  });

  await query(
    `UPDATE games SET capsule_url = COALESCE(thumbnail_url, capsule_url), hero_url = COALESCE(banner_url, hero_url) WHERE id = $1`,
    [id]
  );
  const enrichment = await enrich(id);
  res.status(created ? 201 : 200).json({
    status: created ? 'created' : 'updated',
    slug: game.slug,
    url: `/game/${game.slug}`,
    changed,
    warnings,
    enrichment,
  });
});

const UPLOADS = {
  thumbnail: { column: 'thumbnail_url', shows: 'capsule_url', types: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' } },
  banner: { column: 'banner_url', shows: 'hero_url', types: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' } },
  rulebook: { column: 'rulebook_url', types: { 'application/pdf': 'pdf' } },
};

// Stores a game's thumbnail, banner or rulebook in UPLOADS_DIR (the body is the file itself)
// and points the game at it. Sent by the add-game scripts after the game is saved.
router.put('/games/:slug/files/:kind', express.raw({ type: () => true, limit: '60mb' }), async (req, res) => {
  const upload = UPLOADS[req.params.kind];
  if (!upload) throw new HttpError(404, 'Unknown file kind.');
  const ext = upload.types[req.get('content-type')];
  if (!ext) throw new HttpError(400, `Unsupported file type. Use ${Object.values(upload.types).join(', ')}.`);
  if (!req.body?.length) throw new HttpError(400, 'The file is empty.');
  if (ext === 'pdf' && req.body.subarray(0, 5).toString() !== '%PDF-') throw new HttpError(400, 'That file is not a PDF.');
  const { rows: [g] } = await query(`SELECT id, slug, category FROM games WHERE slug = $1`, [req.params.slug]);
  if (!g) throw new HttpError(404, 'Game not found.');
  if (req.params.kind === 'rulebook' && g.category === 'video') throw new HttpError(400, 'Only board and card games have rulebooks.');

  const dir = path.join(UPLOADS_DIR, g.slug);
  await fs.mkdir(dir, { recursive: true });
  const hash = crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 12);
  const name = `${req.params.kind}-${hash}.${ext}`;
  await fs.writeFile(path.join(dir, name), req.body);
  for (const old of await fs.readdir(dir)) {
    if (old.startsWith(`${req.params.kind}-`) && old !== name) await fs.rm(path.join(dir, old));
  }

  const url = `/api/files/${g.slug}/${name}`;
  await query(`UPDATE games SET ${upload.column} = $2 WHERE id = $1`, [g.id, url]);
  if (upload.shows) await query(`UPDATE games SET ${upload.shows} = $2 WHERE id = $1`, [g.id, url]);
  await audit({ query }, req, 'upload', g.slug, { kind: req.params.kind, name, bytes: req.body.length });
  res.json({ url, bytes: req.body.length });
});

// Re-fetch Steam, BoardGameGeek, HowLongToBeat and Fandom data for a game now, ignoring caches.
router.post('/games/:slug/refresh', async (req, res) => {
  const { rows: [g] } = await query(`SELECT id, slug FROM games WHERE slug = $1`, [req.params.slug]);
  if (!g) throw new HttpError(404, 'Game not found.');
  await audit({ query }, req, 'refresh', g.slug, {});
  res.json({ slug: g.slug, enrichment: await enrich(g.id, { force: true }) });
});

// Hand a game back to the seed files: the next seed sync overwrites it from server/src/seed/data.
router.post('/games/:slug/release', async (req, res) => {
  const { rowCount } = await query(`UPDATE games SET managed_by = 'seed' WHERE slug = $1 AND managed_by = 'api'`, [req.params.slug]);
  if (!rowCount) throw new HttpError(404, 'No API-managed game with that slug.');
  await query(`DELETE FROM seed_meta WHERE key = 'content_hash'`); // force a full sync on the next boot
  await audit({ query }, req, 'release', req.params.slug, {});
  res.json({ slug: req.params.slug, managed_by: 'seed' });
});

export default router;
