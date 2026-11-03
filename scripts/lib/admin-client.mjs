// What the pull-games and remove-?game scripts share: the admin key and site from .env
// (or --api), console colors and a small client for the admin API.
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });

export const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, ok: (s) => `\x1b[32m${s}\x1b[0m`, warn: (s) => `\x1b[33m${s}\x1b[0m`, bad: (s) => `\x1b[31m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
export const fail = (msg) => {
  console.error(c.bad(`✖ ${msg}`));
  process.exit(1);
};

// Flags without a value; every other --option takes the next argument.
export function parseArgs(argv, flags) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (flags.includes(a)) o[a.slice(2)] = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}

export function adminClient(opts) {
  const api = (opts.api || process.env.GRIMOIRE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const key = process.env.ADMIN_API_KEY;
  const isLocal = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(api);
  if (!key) fail('ADMIN_API_KEY is not set. Run start.bat once (it adds one to .env), or set it in the environment.');

  async function admin(method, route) {
    let res;
    try {
      res = await fetch(`${api}/api/admin${route}`, { method, headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60000) });
    } catch {
      fail(`Could not reach ${api}. ${isLocal ? 'Is the site running? Start it with start.bat.' : ''}`);
    }
    const json = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) fail(`The admin API refused the key (${json.error}). Check ADMIN_API_KEY in .env matches the server's.`);
    if (res.status === 429) fail(json.error);
    return { status: res.status, json };
  }
  return { api, admin };
}

export async function confirm(question, yes) {
  if (yes) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} ${c.dim('[y/N]')} `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}
