// Access control for the admin API. A request is allowed when it either
//  - sends `Authorization: Bearer <ADMIN_API_KEY>` (used by scripts), or
//  - comes from a signed-in user whose role is 'admin' (used from the browser).
// Repeated failures from one IP are locked out for a while.
import crypto from 'node:crypto';

const MIN_KEY_LENGTH = 32;
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60 * 1000;
const failures = new Map(); // ip -> { count, resetAt }

const digest = (s) => crypto.createHash('sha256').update(s).digest();

export function adminKeyConfigured() {
  return (process.env.ADMIN_API_KEY ?? '').length >= MIN_KEY_LENGTH;
}

function keyMatches(given) {
  if (!adminKeyConfigured()) return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  return crypto.timingSafeEqual(digest(given), digest(process.env.ADMIN_API_KEY));
}

function lockedOut(ip) {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() > f.resetAt) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

function recordFailure(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() > f.resetAt) failures.set(ip, { count: 1, resetAt: Date.now() + LOCKOUT_MS });
  else f.count += 1;
}

export function requireAdmin(req, res, next) {
  const ip = req.ip;
  if (lockedOut(ip)) return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });

  const header = req.get('authorization') ?? '';
  if (header.startsWith('Bearer ')) {
    if (keyMatches(header.slice(7).trim())) {
      req.admin = { actor: 'api-key', via: 'api-key' };
      return next();
    }
    recordFailure(ip);
    return res.status(401).json({ error: 'Invalid admin API key.' });
  }

  if (req.user?.role === 'admin') {
    req.admin = { actor: req.user.username || req.user.id, via: 'session' };
    return next();
  }
  recordFailure(ip);
  if (req.user) return res.status(403).json({ error: 'Admins only.' });
  return res.status(401).json({ error: 'Admin sign-in or API key required.' });
}
