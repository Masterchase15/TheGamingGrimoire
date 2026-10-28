// Steam Web API client. The API key is read from the STEAM_API_KEY environment
// variable (set in the git-ignored .env locally, or Railway service variables)
// and is only ever used server-side.
const API = 'https://api.steampowered.com';
const ASSET_BASE = 'https://shared.akamai.steamstatic.com/store_item_assets/';
const CLAN_IMAGE_BASE = 'https://clan.akamai.steamstatic.com/images/';

export const hasSteamKey = () => Boolean(process.env.STEAM_API_KEY);

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Steam request failed (${res.status})`);
  return res.json();
}

/** Library capsule (600x900), library hero (wide banner) and header art for up to ~50 apps. */
export async function fetchAssets(appids) {
  const input = {
    ids: appids.map((appid) => ({ appid })),
    context: { language: 'english', country_code: 'US' },
    data_request: { include_assets: true },
  };
  const url = `${API}/IStoreBrowseService/GetItems/v1/?key=${process.env.STEAM_API_KEY}&input_json=${encodeURIComponent(
    JSON.stringify(input)
  )}`;
  const json = await getJson(url);
  const result = new Map();
  for (const item of json.response?.store_items ?? []) {
    const a = item.assets;
    if (!a?.asset_url_format) continue;
    const build = (file) => (file ? ASSET_BASE + a.asset_url_format.replace('${FILENAME}', file) : null);
    result.set(item.appid, {
      capsule: build(a.library_capsule_2x || a.library_capsule),
      hero: build(a.library_hero_2x || a.library_hero),
      header: build(a.header),
    });
  }
  return result;
}

const PATCH_TITLE = /\b(patch|hotfix|hot-fix|update|version|changelog|release notes|fixes)\b/i;
// News posts that mention "update" but aren't patch notes.
const NOT_PATCH = /\b(community update|dev(eloper)? update|roadmap|livestream|stream|sale|discount|giveaway|trailer|showcase|coming soon|what's coming|preview)\b/i;
const VERSION_IN_TEXT =
  /(?:\b(?:patch|version|update|hotfix|build|ver\.?)\s*(?:notes\s*)?(?:version\s*)?[#:]?\s*v?|\bv)(\d+(?:\.\d+){1,3}[a-z]?)\b/i;
const BARE_VERSION = /(?:^|[\s:(–—-])v?(\d+\.\d+(?:\.\d+){0,2}[a-z]?)(?=$|[\s:,)–—-])/i;

/** Pulls a version number like 1.17 or 7.2.1 out of a patch title (or its first lines). */
export function extractVersion(title, body = '') {
  const m = title.match(VERSION_IN_TEXT) || title.match(BARE_VERSION) || body.slice(0, 400).match(VERSION_IN_TEXT);
  return m ? m[1] : null;
}

function isPatch(item) {
  if (item.tags?.includes('patchnotes')) return true;
  if (NOT_PATCH.test(item.title)) return false;
  return PATCH_TITLE.test(item.title) || BARE_VERSION.test(item.title);
}

/** Converts Steam announcement BBCode into Markdown that the client renders safely (no raw HTML). */
export function bbcodeToMarkdown(input) {
  let s = input.replace(/\r/g, '').replace(/\{STEAM_CLAN_IMAGE\}\//g, CLAN_IMAGE_BASE);
  // Drop embeds that can't be shown as markdown.
  s = s.replace(/\[(previewyoutube|video|dynamiclink)[^\]]*\][\s\S]*?\[\/\1\]/gi, '');
  s = s.replace(/\[(previewyoutube|dynamiclink)[^\]]*\]/gi, '');
  s = s.replace(/\[img(?:\s+[^\]]*)?\](.*?)\[\/img\]/gi, (_, src) => `\n\n![](${src.trim()})\n\n`);
  s = s.replace(/\[img\s+src="([^"]+)"[^\]]*\]/gi, (_, src) => `\n\n![](${src})\n\n`);
  s = s.replace(/\[url=["']?([^\]"']+)["']?\]([\s\S]*?)\[\/url\]/gi, (_, href, text) => `[${text.trim() || href}](${href})`);
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, href) => `<${href.trim()}>`);
  s = s.replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, '\n\n## $1\n\n');
  s = s.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, '\n\n### $1\n\n');
  s = s.replace(/\[h[3-6]\]([\s\S]*?)\[\/h[3-6]\]/gi, '\n\n#### $1\n\n');
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, (_, t) => (t.trim() ? `**${t.trim()}**` : ''));
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, (_, t) => (t.trim() ? `*${t.trim()}*` : ''));
  s = s.replace(/\[(?:u|strike|spoiler|noparse)\]([\s\S]*?)\[\/(?:u|strike|spoiler|noparse)\]/gi, '$1');
  s = s.replace(/\[quote(?:=[^\]]*)?\]([\s\S]*?)\[\/quote\]/gi, (_, t) => `\n\n> ${t.trim().replace(/\n/g, '\n> ')}\n\n`);
  s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '\n\n```\n$1\n```\n\n');
  s = s.replace(/\[hr\]\s*\[\/hr\]|\[hr\]/gi, '\n\n---\n\n');
  // Lists: [list]/[olist] with [*] items (closed or not).
  s = s.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (_, body) => listify(body, true));
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, body) => listify(body, false));
  s = s.replace(/\[p\]([\s\S]*?)\[\/p\]/gi, '$1\n\n');
  // Tables become plain lines.
  s = s.replace(/\[\/?(table|tr|th|td)[^\]]*\]/gi, (m) => (/\/(tr)/i.test(m) ? '\n' : /\/(td|th)/i.test(m) ? ' · ' : ''));
  s = s.replace(/\[\/?[a-z0-9]+(?:=[^\]]*)?\]/gi, ''); // any leftover tags
  // Steam sometimes ships HTML instead of BBCode.
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?(p|div|span|strong|em|b|i|u)[^>]*>/gi, '');
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function listify(body, ordered) {
  const items = body
    .split(/\[\*\]/)
    .map((x) => x.replace(/\[\/\*\]/g, '').replace(/\[\/?p\]/gi, ' ').trim())
    .filter(Boolean);
  return `\n\n${items.map((it, i) => `${ordered ? `${i + 1}.` : '-'} ${it.replace(/\n+/g, ' ')}`).join('\n')}\n\n`;
}

/** Recent patch notes for an app, newest first. */
export async function fetchPatchNotes(appid, { limit = 12, exclude } = {}) {
  const url = `${API}/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=60&maxlength=0&feeds=steam_community_announcements&key=${process.env.STEAM_API_KEY}`;
  const json = await getJson(url);
  const skip = exclude ? new RegExp(exclude, 'i') : null;
  const items = (json.appnews?.newsitems ?? [])
    .filter((item) => isPatch(item) && !(skip && skip.test(item.title)))
    .slice(0, limit);
  return items.map((item) => {
    const content = bbcodeToMarkdown(item.contents || '');
    return {
      gid: String(item.gid),
      title: item.title,
      url: item.url,
      author: item.author || null,
      version: extractVersion(item.title, content),
      content,
      published_at: new Date(item.date * 1000),
    };
  });
}

/** Plain-text preview of a markdown body (no links, images or markup). */
export function plainExcerpt(md = '', max = 260) {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<https?:[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#*_>`|~]+/g, ' ')
    .replace(/^\s*[-\d.]+\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

export const steamStoreUrl = (appid) => `https://store.steampowered.com/app/${appid}`;

// ---------- Store API (prices and DLC; no key needed) ----------
const STORE = 'https://store.steampowered.com/api/appdetails';
// Prices are shown in this store region's currency.
const COUNTRY = (process.env.STEAM_COUNTRY || 'us').toLowerCase();

const decodeEntities = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

const priceOf = (p) =>
  p ? { currency: p.currency, initial: p.initial, final: p.final, discount: p.discount_percent } : null;

/** "Oct 8, 2026" → "2026-10-08" (null when Steam gives something vaguer, like "Q4 2026"). */
function parseReleaseDate(text) {
  if (!text || !/\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}/.test(text)) return null;
  const d = new Date(`${text} UTC`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Store details for one app: name, type, price, release date and its DLC app ids. Null if Steam has no page for it. */
export async function fetchStoreApp(appid) {
  const json = await getJson(`${STORE}?appids=${appid}&cc=${COUNTRY}&l=english`);
  const d = json?.[appid]?.success ? json[appid].data : null;
  if (!d) return null;
  return {
    appid,
    name: d.name,
    type: d.type,
    description: d.short_description ? decodeEntities(d.short_description).trim() : null,
    header: d.header_image ?? null,
    isFree: Boolean(d.is_free),
    price: priceOf(d.price_overview),
    releaseDate: d.release_date?.date || null,
    releasedOn: parseReleaseDate(d.release_date?.date),
    comingSoon: Boolean(d.release_date?.coming_soon),
    dlc: d.dlc ?? [],
  };
}

/** Current prices for many apps in one request (Steam allows several ids only for price data). Map of appid → price or null. */
export async function fetchStorePrices(appids) {
  const out = new Map();
  if (!appids.length) return out;
  const json = await getJson(`${STORE}?appids=${appids.join(',')}&cc=${COUNTRY}&filters=price_overview`);
  for (const id of appids) {
    const r = json?.[id];
    // An unsuccessful entry means the app left the store; an empty list means it has no price (free).
    if (r?.success) out.set(id, priceOf(Array.isArray(r.data) ? null : r.data?.price_overview));
  }
  return out;
}
