// Cheap defences against scrapers that run up network egress.

// Crawlers that feed AI training/answer engines, plus headless browsers that announce themselves.
// None of these send visitors, so they get a tiny 403 instead of the full page and its scripts.
const DEFAULT_BLOCKED = [
  'HeadlessChrome',
  'ElevenlabsCrawler',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'CCBot',
  'Bytespider',
  'PerplexityBot',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'Google-Extended',
  'Applebot-Extended',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Timpibot',
  'PetalBot',
  'DataForSeoBot',
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'python-requests',
  'Scrapy',
];

// Extra patterns can be added without a deploy via the BLOCKED_USER_AGENTS variable:
// regexes separated by newlines or "||", e.g. `X11; Linux x86_64\).*Chrome/155`.
function buildPattern() {
  const extra = (process.env.BLOCKED_USER_AGENTS || '')
    .split(/\n|\|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
  const parts = [...DEFAULT_BLOCKED.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), ...extra];
  return new RegExp(parts.join('|'), 'i');
}

const blockedUa = buildPattern();

export function blockBots(req, res, next) {
  // robots.txt stays reachable so well-behaved crawlers can read why they are turned away.
  if (req.path === '/robots.txt' || req.path === '/api/health') return next();
  const ua = req.get('user-agent') || '';
  if (!ua || blockedUa.test(ua)) return res.status(403).type('text/plain').send('Forbidden');
  next();
}

// Fixed-window, in-memory, per-IP rate limit. Fine for a single instance.
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.reset <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    let entry = hits.get(req.ip);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Slow down and try again shortly.' });
    }
    next();
  };
}
