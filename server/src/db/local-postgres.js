// Portable PostgreSQL for local testing (no install or Docker needed).
// scripts/dev.mjs starts it when DATABASE_URL is not set to an external database.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../lib/env.js';

export const LOCAL_DB = {
  port: 5433,
  user: 'grimoire',
  password: 'grimoire_local',
  database: 'grimoire',
};

export const LOCAL_DATABASE_URL = `postgres://${LOCAL_DB.user}:${LOCAL_DB.password}@localhost:${LOCAL_DB.port}/${LOCAL_DB.database}`;

export async function startLocalPostgres() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const databaseDir = path.join(ROOT_DIR, '.localdb');
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: LOCAL_DB.user,
    password: LOCAL_DB.password,
    port: LOCAL_DB.port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: () => {},
  });

  const firstRun = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'));
  if (firstRun) await pg.initialise();

  // A previous run that was closed abruptly can leave a stale lock file behind.
  const pidFile = path.join(databaseDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    const pid = Number(fs.readFileSync(pidFile, 'utf8').split('\n')[0]);
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {}
    if (!alive) fs.rmSync(pidFile);
  }

  await pg.start();
  if (firstRun) await pg.createDatabase(LOCAL_DB.database);
  return pg;
}
