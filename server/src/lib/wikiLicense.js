// Looks at a wiki that isn't on Fandom (given as wiki_url) and works out whether
// its license lets us republish its articles. No database access, so the
// add-game scripts can use it to preview a wiki before sending a game.
//
// MediaWiki sites (wiki.gg, UESP, Bulbapedia, ...) report their license through
// the API (meta=siteinfo&siprop=rightsinfo). Other sites are scanned for license
// links in their HTML. Only licenses that allow copying and adapting on any site
// count as embeddable; anything else (NonCommercial, NoDerivatives, all rights
// reserved, or no license found) makes the game link out to the wiki instead.

const UA = 'TheGamingGrimoire/1.0 (game wiki & tracker; https://github.com/Masterchase15/TheGamingGrimoire)';

// CC "NonCommercial" licenses allow non-commercial sites only. The Grimoire treats
// them as not reusable so the site stays free to run ads or donations later.
// Set to true if the site will stay strictly non-commercial.
const ALLOW_NONCOMMERCIAL = false;

const CC_NAMES = { by: 'CC BY', 'by-sa': 'CC BY-SA', 'by-nc': 'CC BY-NC', 'by-nc-sa': 'CC BY-NC-SA', 'by-nd': 'CC BY-ND', 'by-nc-nd': 'CC BY-NC-ND' };

/**
 * Classifies a license from its URL and/or name. Returns { name, url, reusable, reason }.
 */
export function classifyLicense(url, text) {
  const u = (url || '').toLowerCase();
  const t = (text || '').toLowerCase();
  const cc = u.match(/creativecommons\.org\/licenses\/([a-z-]+)\/?([\d.]+)?/);
  let kind = cc?.[1];
  let version = cc?.[2];
  if (!kind) {
    // Spelled out ("Attribution-NonCommercial-ShareAlike 2.5") or abbreviated ("CC BY-SA 4.0", "CC-BY-SA").
    const nc = /noncommercial|\bnc\b/.test(t);
    const nd = /noderiv|no derivative|\bnd\b/.test(t);
    const sa = /sharealike|share alike|\bsa\b/.test(t);
    if (/creative commons|attribution|\bcc[\s-]?by\b/.test(t)) kind = ['by', nc && 'nc', nd && 'nd', sa && 'sa'].filter(Boolean).join('-');
    version = t.match(/\b(\d\.\d)\b/)?.[1];
  }
  if (kind && CC_NAMES[kind]) {
    const name = `${CC_NAMES[kind]}${version ? ` ${version}` : ''}`;
    const nc = kind.includes('nc');
    const nd = kind.includes('nd');
    const reusable = !nd && (!nc || ALLOW_NONCOMMERCIAL);
    const reason = nd ? 'does not allow changed copies (NoDerivatives)' : nc && !ALLOW_NONCOMMERCIAL ? 'allows non-commercial use only' : 'allows republishing with attribution';
    return { name, url: url || ccUrl(kind, version), reusable, reason };
  }
  if (/creativecommons\.org\/publicdomain|public domain|\bcc0\b/.test(`${u} ${t}`)) {
    return { name: /cc0|zero/.test(`${u} ${t}`) ? 'CC0 (public domain)' : 'Public domain', url: url || null, reusable: true, reason: 'is in the public domain' };
  }
  if (/gnu\.org\/(licenses\/)?fdl|gnu free documentation|\bgfdl\b/.test(`${u} ${t}`)) {
    return { name: 'GNU FDL', url: url || 'https://www.gnu.org/licenses/fdl-1.3.html', reusable: true, reason: 'allows republishing with attribution' };
  }
  if (/fandom\.com\/licensing/.test(u)) {
    return { name: 'CC BY-SA 3.0', url, reusable: true, reason: 'allows republishing with attribution' };
  }
  return {
    name: text?.trim() || (url ? 'Custom license' : 'No license found'),
    url: url || null,
    reusable: false,
    reason: url || text ? 'is not an open license' : 'states no reuse license, so all rights are reserved',
  };
}

const ccUrl = (kind, version) => `https://creativecommons.org/licenses/${kind}/${version || '4.0'}/`;

async function get(url, { json = false } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return { url: res.url, body: json ? await res.json() : await res.text() };
}

/** Rejects links the server shouldn't fetch (non-web schemes, localhost, private networks). */
export function checkWikiUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const h = url.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h) || h.includes(':')) return null;
  return url;
}

/** The Fandom subdomain when `url` is a Fandom wiki (e.g. "cyberpunk"), else null. */
export function fandomSubdomain(url) {
  const m = checkWikiUrl(url)?.hostname.match(/^([a-z0-9][a-z0-9-]*)\.fandom\.com$/i);
  return m && m[1].toLowerCase() !== 'www' ? m[1].toLowerCase() : null;
}

async function siteinfo(api) {
  const { body } = await get(`${api}?action=query&meta=siteinfo&siprop=general|rightsinfo|statistics&format=json&formatversion=2`, { json: true });
  return body?.query?.general ? body.query : null;
}

// Where a MediaWiki site's api.php lives: the page's EditURI link, else the usual paths.
async function findApi(pageUrl, html) {
  const candidates = [];
  const rsd = html?.match(/<link[^>]+rel=["']EditURI["'][^>]*>/i)?.[0].match(/href=["']([^"']+)["']/i)?.[1];
  if (rsd) candidates.push(new URL(rsd.replace(/&amp;/g, '&'), pageUrl).href.replace(/\?.*$/, ''));
  const { origin, pathname } = new URL(pageUrl);
  const base = pathname.match(/^(.*?)\/(wiki|index\.php)\b/)?.[1] ?? '';
  candidates.push(`${origin}${base}/api.php`, `${origin}/api.php`, `${origin}/w/api.php`, `${origin}/mediawiki/api.php`);
  for (const api of [...new Set(candidates)]) {
    try {
      const q = await siteinfo(api);
      if (q) return { api, q };
    } catch {
      // not here
    }
  }
  return null;
}

// License hints in a page's HTML: rel="license" links, then any license URL or name in the footer.
function licenseFromHtml(html) {
  const rel = html.match(/<(?:link|a)\b[^>]*rel=["'][^"']*\blicense\b[^"']*["'][^>]*>/i)?.[0];
  const relHref = rel?.match(/href=["']([^"']+)["']/i)?.[1];
  if (relHref) return classifyLicense(relHref, rel.match(/>([^<]*)$/)?.[1]);
  const ccLink = html.match(/https?:\/\/creativecommons\.org\/(?:licenses|publicdomain)\/[a-z0-9./-]+/i)?.[0];
  if (ccLink) return classifyLicense(ccLink, null);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const named = text.match(/(creative commons[^.]{0,80}|cc[\s-]by(?:[\s-](?:nc|nd|sa))*(?:\s\d\.\d)?|gnu free documentation license|public domain)/i)?.[0];
  return classifyLicense(null, named ?? null);
}

const providerName = (host) => host.replace(/^(www|en)\./, '');

/**
 * Inspects a wiki link. Returns
 *   { url, id, sitename, provider, api, base, articlePath, mainpage, articles, license, embeddable, checkedAt }
 * `embeddable` is true when the license allows republishing and the site has a
 * MediaWiki API we can read articles from; otherwise the game page links out.
 */
export async function inspectWiki(rawUrl) {
  const url = checkWikiUrl(rawUrl);
  if (!url) throw new Error('wiki_url must be a public http(s) link');
  let page = null;
  try {
    page = await get(url.href);
  } catch (err) {
    page = { url: url.href, body: '', error: err.message };
  }
  const found = await findApi(page.url, page.body);
  const host = new URL(page.url).host;
  const out = {
    url: url.href,
    id: null,
    sitename: providerName(host),
    provider: providerName(host),
    api: null,
    base: new URL(page.url).origin,
    articlePath: null,
    mainpage: null,
    articles: null,
    license: null,
    embeddable: false,
    checkedAt: new Date().toISOString(),
  };
  if (found) {
    const g = found.q.general;
    const server = (g.server || '').startsWith('//') ? `https:${g.server}` : g.server || out.base;
    const rights = found.q.rightsinfo ?? {};
    // rightsinfo.url is sometimes a wiki page title ("Project:Copyrights") rather than a link.
    const rightsUrl = rights.url && !/^https?:\/\//i.test(rights.url) ? `${server}${g.articlepath.replace('$1', encodeURIComponent(rights.url.replace(/ /g, '_')))}` : rights.url;
    Object.assign(out, {
      id: `${new URL(server).host}${g.scriptpath || ''}`,
      sitename: g.sitename,
      api: found.api,
      base: server,
      articlePath: g.articlepath || '/wiki/$1',
      mainpage: g.mainpage ?? null,
      articles: found.q.statistics?.articles ?? null,
      license: classifyLicense(rightsUrl, rights.text),
    });
    // A license URL with no name (or a wiki page) still classifies by name, so try the text alone too.
    if (!out.license.reusable && rights.text) {
      const byText = classifyLicense(null, rights.text);
      if (byText.reusable) out.license = { ...byText, url: rightsUrl || byText.url };
    }
  } else if (page.body) {
    out.license = licenseFromHtml(page.body);
    out.sitename = page.body.match(/<title>([^<]*)<\/title>/i)?.[1]?.split(/\s[|–—-]\s/)[0].trim() || out.sitename;
  } else {
    out.license = { name: 'Unknown', url: null, reusable: false, reason: `could not be checked (${page.error})` };
    out.error = page.error;
  }
  out.embeddable = Boolean(out.api && out.license?.reusable);
  return out;
}
