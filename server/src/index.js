import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { migrate } from './db/migrate.js';
import { seed } from './seed/seed.js';
import { startSteamSync } from './lib/steamSync.js';
import { PORT, ROOT_DIR, isProd } from './lib/env.js';
import { loadSession } from './lib/session.js';
import gamesRouter from './routes/games.js';
import searchRouter from './routes/search.js';
import libraryRouter from './routes/library.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import feedRouter from './routes/feed.js';
import forumsRouter from './routes/forums.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Better Auth must see the raw body, so it is mounted before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth));

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
app.listen(PORT, () => console.log(`TheGamingGrimoire API listening on http://localhost:${PORT}`));
