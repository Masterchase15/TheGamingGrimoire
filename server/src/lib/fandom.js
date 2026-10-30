// Wiki (MediaWiki API) client. Every Fandom community exposes the standard
// MediaWiki API at https://<wiki>.fandom.com/api.php; a game can instead name
// its own wiki (wiki_url), which is used the same way when it runs MediaWiki and
// its license allows republishing (see wikiLicense.js). Responses are cached in
// the fandom_cache table so pages load fast and we stay polite to the wikis.
// Every page we render carries the wiki's license and a link back to the article.
import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import { query } from '../db/pool.js';
import { HttpError } from './session.js';

const UA = 'TheGamingGrimoire/1.0 (game wiki & tracker; https://github.com/Masterchase15/TheGamingGrimoire)';
const OVERVIEW_TTL = 24 * 3600 * 1000;
const PAGE_TTL = 12 * 3600 * 1000;
const SEARCH_TTL = 3600 * 1000;

export const LICENSE = { name: 'CC BY-SA 3.0', url: 'https://www.fandom.com/licensing' };

// A wiki we read from: { id, api, base, articlePath, host, provider, license }.
// `id` keys the cache and the search index: the subdomain for Fandom wikis
// (never contains a dot) and host + script path for other wikis.
export const fandomSource = (wiki) => ({
  id: wiki,
  api: `https://${wiki}.fandom.com/api.php`,
  base: `https://${wiki}.fandom.com`,
  articlePath: '/wiki/$1',
  host: `${wiki}.fandom.com`,
  provider: 'Fandom',
  license: LICENSE,
});

const externalSource = (info) => ({
  id: info.id,
  api: info.api,
  base: info.base,
  articlePath: info.articlePath,
  host: new URL(info.base).host,
  provider: info.provider,
  license: { name: info.license.name, url: info.license.url },
});

/**
 * The wiki a game's articles are read from, or null. A game's own wiki_url wins
 * over its Fandom wiki, but only when that wiki was checked and is embeddable;
 * otherwise the game links out to it (see externalWikiLink).
 */
export function sourceFor(game) {
  if (game.wiki_url) return game.wiki_info?.embeddable ? externalSource(game.wiki_info) : null;
  return game.fandom_wiki ? fandomSource(game.fandom_wiki) : null;
}

/** For a wiki_url whose license doesn't allow republishing: where "Read the wiki" goes instead. */
export function externalWikiLink(game) {
  if (!game.wiki_url || game.wiki_info?.embeddable) return null;
  const info = game.wiki_info;
  const host = new URL(game.wiki_url).host;
  return {
    mode: 'link',
    sitename: info?.sitename ?? host,
    provider: info?.provider ?? host,
    baseUrl: game.wiki_url,
    license: info?.license ? { name: info.license.name, url: info.license.url, reason: info.license.reason } : null,
  };
}

// The search-index key of a game's wiki in SQL (games aliased as g); matches sourceFor().
export const WIKI_KEY_SQL = `CASE WHEN g.wiki_url IS NOT NULL
  THEN CASE WHEN (g.wiki_info->>'embeddable')::boolean THEN g.wiki_info->>'id' END
  ELSE g.fandom_wiki END`;

// MediaWiki page paths keep "/" and ":" readable.
export const encodeTitle = (title) =>
  encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':');
export const articleUrl = (source, title) => `${source.base}${source.articlePath.replace('$1', encodeTitle(title))}`;

export async function api(source, params) {
  const url = `${source.api}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${source.provider} request failed (${res.status})`);
  const json = await res.json();
  if (json.error) {
    const err = new Error(json.error.info || json.error.code);
    err.code = json.error.code;
    throw err;
  }
  return json;
}

// Serve from cache when fresh; refetch when stale; fall back to stale data if Fandom is down.
async function cached(key, ttl, loader) {
  const { rows } = await query(`SELECT data, fetched_at FROM fandom_cache WHERE key = $1`, [key]);
  const row = rows[0];
  if (row && Date.now() - new Date(row.fetched_at).getTime() < ttl) return row.data;
  try {
    const data = await loader();
    await query(
      `INSERT INTO fandom_cache (key, data, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET data = $2, fetched_at = now()`,
      [key, JSON.stringify(data)]
    );
    return data;
  } catch (err) {
    if (row && err.code !== 'missingtitle') return row.data;
    throw err;
  }
}

const NON_ARTICLE = /^(file|image|media|category|special|template|user|user talk|talk|help|module|mediawiki|forum|message wall|blog|board|thread|map|project|.+ talk):/i;

/** Game overview: the main article summary plus featured topic cards. */
export function getOverview(source, { page, topics }) {
  const sig = crypto.createHash('md5').update(JSON.stringify([page, topics])).digest('hex').slice(0, 10);
  return cached(`overview:${source.id}:${sig}`, OVERVIEW_TTL, async () => {
    const site = await api(source, { action: 'query', meta: 'siteinfo', siprop: 'general|statistics' });
    const titles = [page, ...topics].filter(Boolean);
    const resolved = new Map();
    const contentNs = await contentNamespaces(source);
    // TextExtracts handles up to 20 intro extracts per request.
    for (let i = 0; i < titles.length; i += 20) {
      const batch = titles.slice(i, i + 20);
      const json = await api(source, {
        action: 'query',
        titles: batch.join('|'),
        redirects: '1',
        prop: 'pageimages|extracts|pageprops',
        piprop: 'thumbnail',
        pithumbsize: '480',
        exintro: '1',
        explaintext: '1',
        exsentences: '2',
        exlimit: '20',
        ppprop: 'disambiguation',
      });
      const q = json.query ?? {};
      const hop = (map, t) => map.find((r) => r.from === t)?.to ?? t;
      const pages = new Map((q.pages ?? []).map((p) => [p.title, p]));
      for (const t of batch) {
        const finalTitle = hop(q.redirects ?? [], hop(q.normalized ?? [], t));
        const p = pages.get(finalTitle);
        if (!p || p.missing || !contentNs.includes(p.ns) || p.pageprops?.disambiguation !== undefined) continue;
        resolved.set(t, {
          title: p.title,
          extract: (p.extract || '').replace(/\s+/g, ' ').trim() || null,
          thumbnail: p.thumbnail?.source ?? null,
          // Small source images are icons; the UI shows them uncropped.
          icon: p.thumbnail ? p.thumbnail.width < 260 && p.thumbnail.height < 260 : false,
        });
      }
    }
    // TextExtracts returns nothing for articles that open with an infobox, so
    // fall back to the first real paragraph of the article's lead section.
    const missing = [...resolved.values()].filter((r) => !r.extract);
    await mapLimit(missing, 4, async (r) => {
      r.extract = await introParagraph(source, r.title).catch(() => null);
    });

    const main = resolved.get(page) ?? null;
    const seen = new Set(main ? [main.title] : []);
    const topicCards = [];
    for (const t of topics) {
      const r = resolved.get(t);
      if (r && !seen.has(r.title)) {
        seen.add(r.title);
        topicCards.push(r);
      }
    }
    const g = site.query.general;
    return {
      mode: 'embed',
      wiki: source.id,
      sitename: g.sitename,
      provider: source.provider,
      baseUrl: source.base,
      articles: site.query.statistics?.articles ?? null,
      logo: g.logo || null,
      main: main && { ...main, url: articleUrl(source, main.title) },
      topics: topicCards,
      license: source.license,
    };
  });
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/** First substantial paragraph of an article's lead, as plain text (~2 sentences). */
async function introParagraph(source, title) {
  const json = await api(source, { action: 'parse', page: title, prop: 'text', section: '0', disableeditsection: '1', redirects: '1' });
  const html = json.parse.text
    .replace(/<(aside|table|figure|style|script|blockquote)[\s\S]*?<\/\1>/gi, '')
    .replace(/<div[^>]*class="[^"]*quote[^"]*"[\s\S]*?<\/div>/gi, '')
    .replace(/<sup[\s\S]*?<\/sup>/gi, '');
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (text.length >= 60) {
      // Cut after two sentences, ignoring initials like "R. R. Martin".
      let cut = text.length;
      let found = 0;
      for (const end of text.matchAll(/[.!?](?=\s+[A-Z"“(]|$)/g)) {
        const word = text.slice(0, end.index).split(/\s+/).pop();
        if (/^([A-Za-z]\.)+$/.test(`${word}.`) || /^(mr|mrs|ms|dr|st|vs|jr|sr|no|vol|ch|e\.g|i\.e)$/i.test(word)) continue;
        cut = end.index + 1;
        if (++found === 2) break;
      }
      const short = text.slice(0, cut).trim();
      return short.length > 320 ? `${short.slice(0, 317).replace(/\s+\S*$/, '')}…` : short;
    }
  }
  return null;
}

/** A full article, sanitized and with wiki links rewritten to stay inside the site. */
export function getArticle(source, title, slug) {
  return cached(`page:${source.id}:${title}`, PAGE_TTL, async () => {
    let json;
    try {
      json = await api(source, {
        action: 'parse',
        page: title,
        redirects: '1',
        prop: 'text|sections|displaytitle',
        disableeditsection: '1',
        disabletoc: '1',
      });
    } catch (err) {
      if (err.code === 'missingtitle') throw Object.assign(new HttpError(404, 'That wiki page does not exist.'), { code: 'missingtitle' });
      throw err;
    }
    const p = json.parse;
    return {
      title: p.title,
      displayTitle: sanitizeHtml(p.displaytitle || p.title, { allowedTags: [], allowedAttributes: {} }),
      html: cleanArticle(p.text, source, slug),
      sections: (p.sections ?? [])
        .filter((s) => Number(s.level) <= 3 && s.anchor)
        .map((s) => ({
          level: Number(s.level),
          anchor: s.anchor,
          title: sanitizeHtml(s.line, { allowedTags: [], allowedAttributes: {} }),
        })),
      url: articleUrl(source, p.title),
      historyUrl: `${source.api.replace(/api\.php$/, 'index.php')}?title=${encodeTitle(p.title)}&action=history`,
      redirectedFrom: p.redirects?.[0]?.from ?? null,
    };
  });
}

/**
 * The namespaces that hold a wiki's articles. Usually just 0, but some wikis keep
 * them in their own namespaces (UESP files Skyrim articles under "Skyrim:").
 */
export function contentNamespaces(source) {
  return cached(`namespaces:${source.id}`, OVERVIEW_TTL * 7, async () => {
    const json = await api(source, { action: 'query', meta: 'siteinfo', siprop: 'namespaces' });
    const ids = Object.values(json.query?.namespaces ?? {}).filter((n) => n.content && n.id >= 0).map((n) => n.id);
    return ids.length ? ids : [0];
  });
}

/** Full-text search inside one wiki. Snippets keep only <mark> highlights. */
export function searchWiki(source, q) {
  return cached(`search:${source.id}:${q.toLowerCase()}`, SEARCH_TTL, async () => {
    const json = await api(source, {
      action: 'query',
      list: 'search',
      srsearch: q,
      srlimit: '12',
      srnamespace: (await contentNamespaces(source)).join('|'),
      srprop: 'snippet',
    });
    return (json.query?.search ?? []).map((r) => ({
      title: r.title,
      snippet: sanitizeHtml(r.snippet.replace(/<span class="searchmatch">(.*?)<\/span>/g, '<mark>$1</mark>'), {
        allowedTags: ['mark'],
        allowedAttributes: {},
      }),
    }));
  });
}

// Elements that are wiki chrome rather than content.
const DROP_CLASSES = [
  'mw-editsection',
  'navbox',
  'toc',
  'noprint',
  'printfooter',
  'catlinks',
  'mw-empty-elt',
  'wds-dropdown',
  'reviews',
  'fandom-community-header',
  'article-comments',
];

function rewriteHref(href, source, slug) {
  if (!href) return { href: null };
  if (href.startsWith('#')) return { href };
  let url;
  try {
    url = new URL(href, source.base);
  } catch {
    return { href: null };
  }
  if (!/^https?:$/.test(url.protocol)) return { href: null };
  const prefix = source.articlePath.replace('$1', '');
  if (url.host === source.host && url.pathname.startsWith(prefix) && !url.search) {
    const title = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/_/g, ' ');
    if (title && !NON_ARTICLE.test(title)) {
      return { href: `/game/${slug}/wiki/${encodeTitle(title)}${url.hash}`, internal: true };
    }
  }
  return { href: url.toString(), external: true };
}

function cleanArticle(html, source, slug) {
  return sanitizeHtml(html, {
    allowedTags: [
      'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code', 'b', 'strong', 'i', 'em', 'u', 's',
      'small', 'sub', 'sup', 'mark', 'abbr', 'span', 'div', 'a', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'img', 'figure',
      'figcaption', 'aside', 'section', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'details',
      'summary', 'center',
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'title'],
      a: ['href', 'target', 'rel', 'data-internal'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'referrerpolicy'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan', 'scope'],
    },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      const cls = frame.attribs?.class || '';
      if (DROP_CLASSES.some((c) => cls.split(/\s+/).includes(c))) return true;
      if (frame.tag === 'img' && !frame.attribs.src) return true;
      return false;
    },
    transformTags: {
      img: (tagName, attribs) => {
        // Fandom lazy-loads images: the real URL lives in data-src.
        let src = attribs['data-src'] || attribs.src || '';
        if (src.startsWith('//')) src = `https:${src}`;
        else if (src.startsWith('/')) src = `${source.base}${src}`; // wiki.gg and most self-hosted wikis
        if (!src.startsWith('https://')) src = '';
        return {
          tagName,
          attribs: {
            src,
            alt: attribs.alt || '',
            ...(attribs.width ? { width: attribs.width } : {}),
            ...(attribs.height ? { height: attribs.height } : {}),
            loading: 'lazy',
            decoding: 'async',
            referrerpolicy: 'no-referrer',
            ...(attribs.class ? { class: attribs.class } : {}),
          },
        };
      },
      a: (tagName, attribs) => {
        const { href, internal, external } = rewriteHref(attribs.href, source, slug);
        if (!href) return { tagName: 'span', attribs: attribs.class ? { class: attribs.class } : {} };
        return {
          tagName,
          attribs: {
            href,
            ...(attribs.title ? { title: attribs.title } : {}),
            ...(attribs.class ? { class: attribs.class } : {}),
            ...(internal ? { 'data-internal': '1' } : {}),
            ...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {}),
          },
        };
      },
    },
  });
}
