import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { pool } from './db/pool.js';
import { CLIENT_URL, isProd } from './lib/env.js';
import { emailConfigured, sendPasswordResetLink, sendVerificationLink } from './lib/email.js';

const baseURL = process.env.BETTER_AUTH_URL || CLIENT_URL;

// Without a mail provider in production nobody could receive a link, so requiring one would lock every account out.
const requireEmailVerification = emailConfigured || !isProd;
if (!requireEmailVerification) {
  console.error('RESEND_API_KEY and EMAIL_FROM are not set: emails cannot be sent, so email verification is off and password resets will not arrive.');
}

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
    requireEmailVerification,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      sendPasswordResetLink(user.email, `${baseURL}/api/auth/reset-password/${token}?callbackURL=/reset-password`);
    },
  },
  emailVerification: {
    expiresIn: 60 * 60 * 24,
    sendOnSignUp: true,
    // Accounts made before verification existed get their link the next time they sign in.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      sendVerificationLink(user.email, `${baseURL}/api/auth/verify-email?token=${token}&callbackURL=/verify-email`);
    },
  },
  rateLimit: {
    customRules: {
      '/request-password-reset': { window: 60 * 5, max: 3 },
      '/forget-password': { window: 60 * 5, max: 3 },
      '/send-verification-email': { window: 60 * 5, max: 3 },
    },
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
