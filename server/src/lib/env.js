import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '../../..');

// Local development keeps its settings in a .env at the repo root.
// On Railway, variables come from the service environment instead.
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

export const isProd = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT || 3001);
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
