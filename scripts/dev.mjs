// Local development runner used by start.bat / `npm run dev`.
// 1. Creates .env on first run (random auth secret, local database URL).
// 2. Starts the bundled local PostgreSQL unless DATABASE_URL points elsewhere.
// 3. Runs the API (auto-restarts on change) and the Vite dev server together.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

const { LOCAL_DATABASE_URL, startLocalPostgres } = await import('../server/src/db/local-postgres.js');

if (!fs.existsSync(envPath)) {
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(
    envPath,
    [
      '# Local development settings (not committed to git).',
      `DATABASE_URL=${LOCAL_DATABASE_URL}`,
      `BETTER_AUTH_SECRET=${secret}`,
      'BETTER_AUTH_URL=http://localhost:5173',
      'CLIENT_URL=http://localhost:5173',
      'PORT=3001',
      '# Steam Web API key (server-side only, never committed).',
      'STEAM_API_KEY=',
      '',
    ].join('\n')
  );
  console.log('Created .env with local defaults.');
}

// Re-read after possibly creating it (env.js already ran dotenv on import).
const dotenv = await import('dotenv');
const env = { ...process.env, ...dotenv.parse(fs.readFileSync(envPath)) };

let pg = null;
if (env.DATABASE_URL === LOCAL_DATABASE_URL) {
  process.stdout.write('Starting local PostgreSQL... ');
  pg = await startLocalPostgres();
  console.log('ready.');
}

const children = [];
function run(name, args, color) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (buf) => {
      for (const line of buf.toString().split(/\r?\n/)) if (line.trim()) out.write(prefix + line + '\n');
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  children.push(child);
  return child;
}

run('api', ['--watch-path=server/src', 'server/src/index.js'], 35);
run('web', [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--config', 'client/vite.config.js'], 36);

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill();
  if (pg) await pg.stop().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
