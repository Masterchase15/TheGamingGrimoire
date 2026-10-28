import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { pool } from './db/pool.js';
import { CLIENT_URL } from './lib/env.js';

const baseURL = process.env.BETTER_AUTH_URL || CLIENT_URL;

export const auth = betterAuth({
  appName: 'TheGamingGrimoire',
  database: pool,
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [...new Set([baseURL, CLIENT_URL])],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      bio: { type: 'string', required: false, input: true },
      // 'admin' unlocks the admin API. Set with `npm run make-admin -- <username>`; users can't set it themselves.
      role: { type: 'string', required: false, input: false, defaultValue: 'user' },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 24,
    }),
  ],
});
