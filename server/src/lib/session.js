import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

// Attaches req.user (or null) for every API request.
export async function loadSession(req, _res, next) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    req.user = session?.user ?? null;
  } catch {
    req.user = null;
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You need to be signed in to do that.' });
  next();
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Public user shape — never expose email to other users.
export const publicUserColumns = (alias = 'u') =>
  `${alias}.id, ${alias}.name, ${alias}.username, ${alias}."displayUsername" AS display_username, ${alias}.image, ${alias}.bio, ${alias}."createdAt" AS created_at`;
