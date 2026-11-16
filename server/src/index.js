import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { migrate } from './db/migrate.js';
import { seed } from './seed/seed.js';
import { startSteamSync } from './lib/steamSync.js';
import { startBggSync } from './lib/bggSync.js';
import { startWikiSync } from './lib/wikiSync.js';
import { PORT, ROOT_DIR, UPLOADS_DIR, isProd } from './lib/env.js';
import { loadSession } from './lib/session.js';
import { blockBots, rateLimit } from './lib/botGuard.js';
import gamesRouter from './routes/games.js';
import searchRouter from './routes/search.js';
import libraryRouter from './routes/library.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import feedRouter from './routes/feed.js';
import forumsRouter from './routes/forums.js';
import adminRouter from './routes/admin.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(blockBots);
app.use(compression());

// Wiki articles are fetched by title, so a crawler can walk them endlessly; cap it per IP.
app.use(['/api/games/:slug/fandom', '/api/search'], rateLimit({ windowMs: 60_000, max: 40 }));

// Better Auth must see the raw body, so it is mounted before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth));

// Admin requests can carry a whole game's wiki content, so they get a larger body limit.
app.use('/api/admin', express.json({ limit: '2mb' }), loadSession, adminRouter);

// Uploaded thumbnails and rulebooks. Names contain a hash of the file, so they can be cached for good.
app.use(
  '/api/files',
  express.static(UPLOADS_DIR, {
    index: false,
    immutable: true,
    maxAge: '30d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

app.use(express.json({ limit: '100kb' }));
app.use('/api', loadSession);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/games', gamesRouter);
app.use('/api/search', searchRouter);
app.use('/api/library', libraryRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/forums', forumsRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// In production the built React app is served from the same origin.
const clientDist = path.join(ROOT_DIR, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  // Vite puts a content hash in every /assets filename, so browsers and CDNs can keep them for good.
  app.use(
    '/assets',
    express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: isProd ? '1y' : 0, index: false, fallthrough: false })
  );
  app.use(express.static(clientDist, { maxAge: isProd ? '1h' : 0, index: false }));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our end.' : err.message });
});

await migrate();
await seed();
startSteamSync();
startBggSync();
startWikiSync();
app.listen(PORT, () => console.log(`TheGamingGrimoire API listening on http://localhost:${PORT}`));
