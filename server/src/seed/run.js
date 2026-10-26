import { migrate } from '../db/migrate.js';
import { pool } from '../db/pool.js';
import { seed } from './seed.js';

await migrate();
await seed({ force: true });
await pool.end();
