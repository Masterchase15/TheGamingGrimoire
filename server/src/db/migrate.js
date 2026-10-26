import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMigrations } from 'better-auth/db';
import { auth } from '../auth.js';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Better Auth tables first (app tables reference "user"), then our own schema.
export async function migrate() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  const sql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}
