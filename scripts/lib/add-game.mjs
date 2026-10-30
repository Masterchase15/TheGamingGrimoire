// Shared core of the add-vgame, add-bgame and add-cgame scripts: looks a game
// up, saves a JSON draft, previews it and sends it to the admin API. Each entry
// script fixes the category, which decides the lookups:
//   video  Steam (app id, developer, publisher, year, genres) + Fandom
//   board  BoardGameGeek (bgg_id, players, play time, age, designers; needs BGG_API_TOKEN) + Fandom
//   card   BoardGameGeek (same as board; BGG lists most card games) + Fandom
// When no Fandom wiki is found, answer "n" to sending, put another wiki's link in
// the draft's "wiki_url" and send the draft with --file. That wiki's license decides
// whether its articles are shown on the site or only linked to (server/src/lib/wikiLicense.js).
//
// Files go in the game-assets folder. In a draft, "thumbnail" and "banner" (all categories) and
// "rulebook" (board and card games) hold a file name from that folder, or a web link,
// and "faq" (board and card games) holds a link to a site with the game's FAQs.
// "unique_faq" lists questions that site doesn't cover: [{ "q": "...", "a": "..." }].
// When a game with a rulebook has no "rulebook_tldr" yet, Claude reads the PDF and
// writes it, and fills empty Details fields (needs ANTHROPIC_API_KEY in .env; see
// rulebook.mjs). The results are saved in the draft, so you can edit them.
// After saving, the server itself fetches Steam art (any game with a steam_appid),
// patch notes, price, DLC and HowLongToBeat times (video games), BoardGameGeek
// expansions (board/card games with a bgg_id) and the Fandom overview.
//
//   npm run add-vgame -- "Hades II"                      look up, save a draft, preview, send
//   npm run add-vgame -- --file game-drafts/hades-ii.json  send a draft you edited
//   npm run add-vgame -- --pull elden-ring               save a game that's on the site as a draft to edit
//   npm run add-vgame -- --refresh hades-ii              re-fetch Steam, HowLongToBeat and Fandom data now
//   npm run add-vgame -- --release celeste               hand a game back to the seed files (server/src/seed/data)
// (add-bgame and add-cgame take the same commands.)
//
// Options:
//   --slug <slug>             URL name (default: made from the title)
//   --steam <appid|none>      video: skip the Steam search; "none" = not on Steam
//                             board/card: Steam app of a digital version, used only for artwork (no lookup)
//   --bgg <id|none>           board/card: BoardGameGeek id, skips the BGG search; "none" = not on BGG
//   --fandom <wiki|none>      Fandom subdomain, e.g. "hades" for hades.fandom.com
//   --regenerate              read the rulebook again, replacing "rulebook_tldr"
//   --dry-run                 look up and preview only; send nothing
//   --yes                     send without asking
//   --api <url>               site to send to (default: GRIMOIRE_API_URL or http://localhost:3001)
//
// Each run saves the game's JSON to game-drafts/<slug>.json. Lookups only fill
// fields that are still empty, so edits you make to a draft are kept.
// The admin key comes from ADMIN_API_KEY in .env (or the environment).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { bggLookup, hasBggToken } from '../../server/src/lib/bgg.js';
import { fandomSubdomain, inspectWiki } from '../../server/src/lib/wikiLicense.js';

const MAX_PDF_BYTES = 23 * 1024 * 1024; // see rulebook.mjs

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });
const DRAFTS = path.join(root, 'game-drafts');
const ASSETS = path.join(root, 'game-assets');
const UA = 'TheGamingGrimoire-importer/1.0 (https://github.com/Masterchase15/TheGamingGrimoire)';

const COMMANDS = { video: 'add-vgame', board: 'add-bgame', card: 'add-cgame' };
const LABELS = { video: 'video game', board: 'board game', card: 'card game' };
const EXAMPLES = { video: 'Hades II', board: 'Spirit Island', card: 'Star Wars: Unlimited' };

// Stops when a draft belongs to another category's script.
function checkCategory(game, where) {
  game.category ??= CATEGORY;
  if (game.category !== CATEGORY) {
    fail(`${where} is a ${LABELS[game.category] ?? game.category}. Use npm run ${COMMANDS[game.category] ?? 'the matching script'} for it.`);
  }
}

// Set by runAddGame.
let opts, CATEGORY, CMD, API, KEY, isLocal, SITE;

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (['--dry-run', '--yes', '--regenerate'].includes(a)) o[a.slice(2)] = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}

const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, ok: (s) => `\x1b[32m${s}\x1b[0m`, warn: (s) => `\x1b[33m${s}\x1b[0m`, bad: (s) => `\x1b[31m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
const fail = (msg) => {
  console.error(c.bad(`✖ ${msg}`));
  process.exit(1);
};

// ---------- helpers ----------
const slugify = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/&/g, ' and ')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const norm = (s) => s.toLowerCase().replace(/[™®©]/g, '').replace(/[^a-z0-9]+/g, '');
const hueFor = (slug) => [...slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return res.json();
}

async function admin(method, route, body) {
  let res;
  try {
    res = await fetch(`${API}/api/admin${route}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(90000),
    });
  } catch {
    fail(`Could not reach ${API}. ${isLocal ? 'Is the site running? Start it with start.bat.' : ''}`);
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) fail(`The admin API refused the key (${json.error}). Check ADMIN_API_KEY in .env matches the server's.`);
  if (res.status === 429) fail(json.error);
  return { status: res.status, json };
}

async function uploadFile(slug, { kind, file, type }) {
  const body = fs.readFileSync(file);
  let res;
  try {
    res = await fetch(`${API}/api/admin/games/${slug}/files/${kind}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': type },
      body,
      signal: AbortSignal.timeout(300000),
    });
  } catch {
    fail(`Could not upload ${path.basename(file)} to ${API}.`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) fail(`Upload of ${path.basename(file)} failed: ${json.error ?? res.status}`);
  console.log(`  ${(kind[0].toUpperCase() + kind.slice(1)).padEnd(14)} ${c.ok(`uploaded ${path.basename(file)}`)} ${c.dim(`(${(body.length / 1048576).toFixed(1)} MB)`)}`);
}

// ---------- lookups ----------
async function steamLookup(title, { exactOnly }) {
  const search = await getJson(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`);
  const items = (search.items ?? []).filter((i) => i.type === 'app');
  const hit = items.find((i) => norm(i.name) === norm(title)) ?? (exactOnly ? null : items[0]);
  if (!hit) return null;
  const d = await steamDetails(hit.id);
  return { ...d, exact: norm(d.name) === norm(title) };
}

async function steamDetails(appid) {
  const details = await getJson(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=US`);
  const d = details[appid]?.data;
  if (!d) throw new Error(`Steam app ${appid} not found`);
  return {
    appid,
    name: d.name,
    type: d.type,
    exact: true,
    developer: d.developers?.join(', '),
    publisher: d.publishers?.join(', '),
    year: Number(d.release_date?.date?.match(/\d{4}/)?.[0]) || null,
    genres: (d.genres ?? []).map((x) => x.description).filter((x) => !/^(indie|early access|free to play)$/i.test(x)),
  };
}

function fandomCandidates(title) {
  const base = title.split(/[:–—-]/)[0];
  const noNumber = base.replace(/\s+(?:[ivx]+|\d+)$/i, '');
  const words = base.split(/\s+/).filter((w) => !/^(the|a|an|of)$/i.test(w));
  return [...new Set([norm(title), norm(base), norm(noNumber), norm(base.replace(/^the\s+/i, '')), ...words.map(norm).sort((x, y) => y.length - x.length).slice(0, 2)])]
    .filter((w) => w.length >= 3);
}

// The article about the game on a MediaWiki wiki: { page, first } (first = top search hit).
async function findArticle(api, general, title) {
  const found = await getJson(
    `${api}?${new URLSearchParams({ action: 'query', list: 'search', srsearch: title, srnamespace: '0', srlimit: '5', format: 'json', formatversion: '2' })}`
  );
  // The wiki's front page ("Wingspan Wiki") is never the game's article.
  const results = (found.query?.search ?? []).filter((r) => r.title !== general.sitename && r.title !== general.mainpage);
  const page = results.find((r) => norm(r.title) === norm(title)) ?? results.find((r) => norm(r.title).startsWith(norm(title)));
  return { page: page?.title ?? null, first: results[0]?.title ?? null };
}

async function fandomLookup(title, forced) {
  const wikis = forced ? [forced] : fandomCandidates(title);
  for (const wiki of wikis) {
    try {
      const api = `https://${wiki}.fandom.com/api.php`;
      const site = await getJson(`${api}?action=query&meta=siteinfo&format=json&formatversion=2`);
      if (!site.query?.general?.server?.includes(`${wiki}.fandom.com`)) continue;
      const { page, first } = await findArticle(api, site.query.general, title);
      // A guessed subdomain only counts if the wiki has an article about this game
      // (e.g. "Spirit Island" must not land on an unrelated spirit.fandom.com).
      if (!page && !forced) continue;
      return { wiki, sitename: site.query.general.sitename, page: page ?? first };
    } catch {
      // not a wiki (Fandom redirects unknown subdomains to an HTML page)
    }
  }
  return null;
}


// ---------- draft building ----------
const ORDER = ['slug', 'title', 'category', 'tagline', 'description', 'aliases', 'genres', 'platforms', 'developer', 'publisher', 'release_year', 'players', 'play_time', 'age', 'is_continuous', 'featured', 'hue', 'hltb_query', 'steam_appid', 'bgg_id', 'patch_exclude', 'thumbnail', 'banner', 'rulebook', 'wiki_url', 'fandom_wiki', 'fandom_page', 'fandom_topics', 'rulebook_tldr', 'faq', 'unique_faq', 'expansions', 'sections'];
const ordered = (g) => Object.fromEntries([...ORDER.filter((k) => k in g).map((k) => [k, g[k]]), ...Object.entries(g).filter(([k]) => !ORDER.includes(k))]);
const draftPath = (slug) => path.join(DRAFTS, `${slug}.json`);
function saveDraft(game) {
  fs.mkdirSync(DRAFTS, { recursive: true });
  fs.writeFileSync(draftPath(game.slug), JSON.stringify(ordered(game), null, 2) + '\n');
  return path.relative(root, draftPath(game.slug));
}
const fill = (g, key, value) => {
  const empty = g[key] === undefined || g[key] === '' || (Array.isArray(g[key]) && !g[key].length);
  if (empty && value !== undefined && value !== null && !(Array.isArray(value) && !value.length)) g[key] = value;
};

// Steam (video games): app id plus developer, publisher, year and genres.
async function steamStep(g, notes) {
  if (opts.steam === 'none') {
    g.steam_appid = null;
    return;
  }
  if (g.steam_appid !== undefined && !opts.steam) return;
  process.stdout.write('Searching Steam... ');
  try {
    const s = opts.steam ? await steamDetails(Number(opts.steam)) : await steamLookup(g.title, { exactOnly: false });
    if (!s) {
      console.log(c.warn('no match'));
      g.steam_appid = null;
      notes.push(`No Steam match, so steam_appid is null (not on Steam). Pass --steam <appid> if that is wrong.`);
      return;
    }
    g.steam_appid = s.appid;
    console.log(c.ok(`found "${s.name}" (app ${s.appid})`));
    if (!s.exact) notes.push(`Steam match "${s.name}" isn't an exact title match. Check it, or pass --steam <appid> / --steam none.`);
    if (s.type && s.type !== 'game') notes.push(`Steam app ${s.appid} is a "${s.type}", not a game. Check it.`);
    fill(g, 'developer', s.developer);
    fill(g, 'publisher', s.publisher);
    fill(g, 'release_year', s.year);
    fill(g, 'genres', s.genres);
    fill(g, 'platforms', ['PC']);
    notes.push('Steam only knows PC. Add console platforms to "platforms" if the game is on them.');
  } catch (err) {
    console.log(c.warn(`failed (${err.message})`));
  }
}

// BoardGameGeek (board and card games): the BGG id plus players, time, age,
// designers, publisher and categories. BGG files card games under its "boardgame"
// type, so one search covers both. Expansions aren't copied into the draft: the
// server syncs them from bgg_id (and picks up new ones later).
async function bggStep(g, notes) {
  if (opts.bgg === 'none') {
    g.bgg_id = null;
    return;
  }
  if (!hasBggToken()) {
    if (opts.bgg) g.bgg_id = Number(opts.bgg);
    notes.push('Set BGG_API_TOKEN in .env to look up board and card games (and their expansions) on BoardGameGeek.');
    return;
  }
  process.stdout.write('Searching BoardGameGeek... ');
  try {
    const b = await bggLookup(g.title, opts.bgg || g.bgg_id);
    if (b) {
      console.log(c.ok(`found "${b.name}" (BGG ${b.id})${b.expansions ? `, ${b.expansions} expansions` : ''}`));
      g.bgg_id = b.id;
      for (const k of ['players', 'play_time', 'age', 'developer', 'publisher', 'genres']) fill(g, k, b[k]);
      fill(g, 'release_year', b.year);
      if (b.name.toLowerCase() !== g.title.toLowerCase()) notes.push(`BoardGameGeek's entry is "${b.name}". Check it's the right game, or pass --bgg <id>.`);
    } else {
      console.log(c.warn('no exact match (try --bgg <id>)'));
      notes.push('Not found on BoardGameGeek. Pass --bgg <id> if it is there, or list expansions by hand in "expansions".');
    }
  } catch (err) {
    console.log(c.warn(`failed (${err.message})`));
  }
}

// Fandom (every category): the wiki and the article about the game.
async function fandomStep(g, notes) {
  if (opts.fandom === 'none') {
    delete g.fandom_wiki;
    return;
  }
  if (g.fandom_wiki && !opts.fandom) return;
  process.stdout.write('Looking for a Fandom wiki... ');
  const f = await fandomLookup(g.title, opts.fandom);
  if (f) {
    console.log(c.ok(`${f.sitename} (${f.wiki}.fandom.com)${f.page ? `, article "${f.page}"` : ''}`));
    g.fandom_wiki = f.wiki;
    fill(g, 'fandom_page', f.page);
    g.fandom_topics ??= [];
    notes.push(`Check that ${f.wiki}.fandom.com is the right wiki. Add article titles to "fandom_topics" to feature them on the game page.`);
  } else {
    console.log(c.warn('none found'));
    notes.push(`No Fandom wiki found. Pass --fandom <subdomain> if there is one, or put another wiki's link in "wiki_url" in game-drafts/${g.slug}.json.`);
  }
}

// A wiki that isn't on Fandom, from the draft's "wiki_url". Reads its license the
// same way the server will, so the preview shows whether the site can show its
// articles or will link to it. Its article about the game goes in fandom_page.
async function customWikiStep(g, notes) {
  const url = g.wiki_url.trim();
  const sub = fandomSubdomain(url);
  if (sub) {
    // A Fandom link: use it as the game's Fandom wiki.
    g.wiki_url = '';
    if (g.fandom_wiki !== sub) delete g.fandom_page;
    g.fandom_wiki = sub;
    opts.fandom = sub;
    return fandomStep(g, notes);
  }
  g.wiki_url = url;
  if (g.fandom_wiki) {
    // The wiki_url replaces the Fandom wiki; its article and topics belonged to Fandom.
    console.log(c.dim(`wiki_url is set, so ${g.fandom_wiki}.fandom.com is dropped from the draft.`));
    delete g.fandom_wiki;
    delete g.fandom_page;
    g.fandom_topics = [];
  }
  process.stdout.write(`Checking ${url} and its license... `);
  let w;
  try {
    w = await inspectWiki(url);
  } catch (err) {
    console.log(c.bad('failed'));
    fail(`"wiki_url" can't be used: ${err.message}`);
  }
  const lic = w.license;
  console.log(`${c.b(w.sitename)}, ${lic ? lic.name : 'license unknown'}`);
  if (w.embeddable) {
    console.log(c.ok(`  ✔ ${lic.name} ${lic.reason}: its articles will show on the site like a Fandom wiki, credited to ${w.sitename}.`));
    g.fandom_topics ??= [];
    if (!g.fandom_page) {
      const found = await findArticle(w.api, { sitename: w.sitename, mainpage: w.mainpage }, g.title).catch(() => null);
      if (found?.page) {
        g.fandom_page = found.page;
        console.log(c.dim(`  Article about the game: "${found.page}"`));
      } else notes.push(`No article named after the game on ${w.sitename}. Set "fandom_page" to the article "Read the wiki" should open.`);
    }
    notes.push(`Add article titles from ${w.sitename} to "fandom_topics" to feature them on the game page.`);
  } else if (lic?.reusable) {
    console.log(c.warn(`  ! ${lic.name} allows reuse, but the site isn't a MediaWiki wiki, so "Read the wiki" will link to it.`));
  } else {
    console.log(c.warn(`  ! ${lic?.name ?? 'The license'} ${lic?.reason ?? 'could not be read'}: "Read the wiki" will link to ${w.url} instead of showing its articles.`));
  }
}

// The draft's own wiki_url when it has one, otherwise Fandom.
const wikiStep = (g, notes) => (g.wiki_url?.trim() ? customWikiStep(g, notes) : fandomStep(g, notes));

// ---------- files ----------
const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };
const FILE_TYPES = {
  thumbnail: IMAGE_TYPES,
  banner: IMAGE_TYPES,
  rulebook: { '.pdf': 'application/pdf' },
};
const isWebLink = (v) => /^https?:\/\//i.test(v);
const isUploaded = (v) => v.startsWith('/api/files/'); // already on the site (from --pull)

// A draft's thumbnail, banner or rulebook file on this computer: a name inside game-assets, or a full path.
function localFile(kind, value) {
  const file = path.resolve(ASSETS, value);
  if (!fs.existsSync(file)) fail(`"${kind}": ${file} doesn't exist. Put the file in game-assets, or use a full path.`);
  const type = FILE_TYPES[kind][path.extname(file).toLowerCase()];
  if (!type) fail(`"${kind}": use a ${Object.keys(FILE_TYPES[kind]).join(', ')} file.`);
  return { file, type };
}

async function loadPdf(value) {
  if (isUploaded(value)) {
    const res = await fetch(`${API}${value}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`${value} answered ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (!isWebLink(value)) return fs.readFileSync(localFile('rulebook', value).file);
  const res = await fetch(value, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${new URL(value).host} answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Board and card games: Claude reads the rulebook for the TLDR and Details. Skipped
// when the draft already has them, so edits (and the cost of reading it) aren't repeated.
async function rulebookStep(g, notes) {
  const rulebook = g.rulebook?.trim();
  if (!rulebook) return;
  if (g.rulebook_tldr?.length && !opts.regenerate) return;
  process.stdout.write('Reading the rulebook with Claude (can take a minute or two)... ');
  try {
    const pdf = await loadPdf(rulebook);
    if (pdf.length > MAX_PDF_BYTES) throw new Error(`the PDF is ${(pdf.length / 1048576).toFixed(0)} MB; the limit is ${MAX_PDF_BYTES / 1048576} MB`);
    const { readRulebook } = await import('./rulebook.mjs');
    const { tldr, details, usage } = await readRulebook(pdf, g.title);
    console.log(c.ok(`${tldr.length} TLDR sections`) + c.dim(` (${usage.input.toLocaleString()} tokens in, ${usage.output.toLocaleString()} out)`));
    g.rulebook_tldr = tldr;
    for (const k of ['players', 'play_time', 'age', 'publisher']) fill(g, k, details[k] || null);
    fill(g, 'developer', details.designer || null);
    fill(g, 'release_year', Number(details.release_year) || null);
    notes.push('Read over "rulebook_tldr" and the Details fields in the draft: they were written by Claude from the rulebook.');
  } catch (err) {
    console.log(c.warn('skipped'));
    const why = /authentication/i.test(err.message) ? 'no Claude API key found' : err.message;
    notes.push(`Couldn't read the rulebook (${why}). Set ANTHROPIC_API_KEY in .env, or fill in "rulebook_tldr" by hand.`);
  }
}

// Board and card games: a Steam app id is optional and only used for artwork, so
// it's taken from --steam or the draft without calling Steam.
function tabletopSteam(g, notes) {
  if (opts.steam === 'none') g.steam_appid = null;
  else if (opts.steam) g.steam_appid = Number(opts.steam);
  if (!g.steam_appid) notes.push('Optional: if there is a digital version on Steam, set "steam_appid" (or pass --steam <appid>) to use its artwork.');
}

const STEPS = {
  video: [steamStep, wikiStep],
  board: [bggStep, wikiStep, rulebookStep],
  card: [bggStep, wikiStep, rulebookStep],
};

async function buildDraft(title) {
  const slug = opts.slug || slugify(title);
  const existing = fs.existsSync(draftPath(slug)) ? JSON.parse(fs.readFileSync(draftPath(slug), 'utf8')) : null;
  if (existing) checkCategory(existing, `game-drafts/${slug}.json`);
  const g = existing ?? { slug, title, category: CATEGORY, tagline: '', description: '' };
  if (existing) console.log(c.dim(`Using your existing draft ${path.relative(root, draftPath(slug))} (only empty fields get filled).`));
  const notes = [];

  for (const step of STEPS[CATEGORY]) await step(g, notes);

  if (CATEGORY === 'video') {
    if (g.is_continuous === undefined) g.is_continuous = false;
    notes.push(`is_continuous is ${g.is_continuous}. Set it to true for live-service or competitive multiplayer games (they have no HowLongToBeat times).`);
  } else {
    tabletopSteam(g, notes);
    fill(g, 'platforms', g.steam_appid ? ['Tabletop', 'PC'] : ['Tabletop']);
    if (g.is_continuous === undefined) g.is_continuous = true;
  }
  if (CATEGORY !== 'video') for (const k of ['players', 'play_time', 'age']) g[k] ??= '';
  if (CATEGORY !== 'video' && !g.players) {
    notes.push(`Fill in "players" (required), "play_time" and "age"${hasBggToken() ? ', or pass --bgg <id> if the game is on BoardGameGeek' : ''}.`);
  }
  // Expansions that aren't on BoardGameGeek can be listed by hand:
  //   { "name": "...", "year": 2024, "description": "...", "image": "https://...", "url": "https://..." }
  if (CATEGORY !== 'video') g.expansions ??= [];

  g.thumbnail ??= '';
  g.banner ??= '';
  g.wiki_url ??= '';
  if (CATEGORY !== 'video') {
    g.rulebook ??= '';
    g.rulebook_tldr ??= [];
    g.faq = typeof g.faq === 'string' ? g.faq : '';
    g.unique_faq ??= [];
  }
  g.aliases ??= [];
  if (g.hue === undefined) g.hue = hueFor(g.slug);
  if (!g.sections) g.sections = [];
  if (!g.tagline || !g.description) notes.push('Write a "tagline" and "description" in your own words before publishing.');
  return { game: g, notes };
}

// ---------- output ----------
function preview(g) {
  const show = (k, v) => console.log(`  ${c.dim(k.padEnd(14))} ${v == null || v === '' ? c.warn('(empty)') : v}`);
  console.log(`\n${c.b(g.title)} ${c.dim(`[${g.category}] /game/${g.slug}`)}`);
  show('tagline', g.tagline || null);
  show('description', g.description ? `${g.description.slice(0, 80)}${g.description.length > 80 ? '…' : ''}` : null);
  show('developer', g.developer);
  show('publisher', g.publisher);
  show('release_year', g.release_year);
  show('genres', g.genres?.join(', ') || null);
  show('platforms', g.platforms?.join(', ') || null);
  if (g.category !== 'video') {
    show('players', g.players);
    show('play_time', g.play_time);
    show('age', g.age);
  }
  show('is_continuous', String(g.is_continuous ?? false));
  show('steam_appid', g.steam_appid === null ? 'none (not on Steam)' : g.steam_appid ? `${g.steam_appid}  ${c.dim(`https://store.steampowered.com/app/${g.steam_appid}`)}` : null);
  if (g.category !== 'video') {
    show('bgg_id', g.bgg_id ? `${g.bgg_id}  ${c.dim(`https://boardgamegeek.com/boardgame/${g.bgg_id}`)}` : null);
    show('expansions', `${g.expansions?.length ?? 0} listed by hand${g.bgg_id ? ' (+ synced from BoardGameGeek)' : ''}`);
  }
  if (g.thumbnail) show('thumbnail', g.thumbnail);
  if (g.banner) show('banner', g.banner);
  if (g.category !== 'video' && g.rulebook) show('rulebook', `${g.rulebook}  ${c.dim(`${g.rulebook_tldr?.length ?? 0} TLDR sections`)}`);
  if (g.category !== 'video' && typeof g.faq === 'string' && g.faq) show('faq', g.faq);
  if (g.category !== 'video' && g.unique_faq?.length) show('unique_faq', `${g.unique_faq.length} questions`);
  if (g.wiki_url) show('wiki', `${g.wiki_url}${g.fandom_page ? ` → ${g.fandom_page}` : ''}`);
  else show('fandom', g.fandom_wiki ? `${g.fandom_wiki}.fandom.com → ${g.fandom_page ?? g.title}` : null);
  show('sections', `${g.sections?.length ?? 0}`);
}

const fmtPrice = (p) =>
  p === 'free' ? 'free' : p ? `${(p.final / 100).toFixed(2)} ${p.currency}${p.discount ? c.warn(` (−${p.discount}% sale)`) : ''}` : 'no price listed';

function printEnrichment(e) {
  const line = (name, r, okText) =>
    console.log(`  ${name.padEnd(14)} ${r.skipped ? c.dim(r.skipped) : r.error ? c.bad(r.error) : okText(r)}`);
  line('Steam', e.steam, (r) => `${r.artwork ? c.ok('artwork ✓') : c.warn('no artwork')}${r.patchNotes !== undefined ? `, ${r.patchNotes} patch notes` : ''}`);
  if (e.store) line('Price / DLC', e.store, (r) => `${c.ok(fmtPrice(r.price))}, ${r.dlc} DLC`);
  if (e.expansions) {
    const x = e.expansions;
    const hand = `${x.listed} listed by hand`;
    const text = x.error ? c.bad(x.error) : x.skipped ? `${hand}. ${c.dim(x.skipped)}` : `${c.ok(`${x.fromBgg} from BoardGameGeek`)}, ${hand}`;
    console.log(`  ${'Expansions'.padEnd(14)} ${text}`);
  }
  if (CATEGORY === 'video') line('HowLongToBeat', e.hltb, (r) => (r.found ? c.ok(`"${r.name}": ${r.main ?? '?'}h main / ${r.extra ?? '?'}h extras / ${r.complete ?? '?'}h completionist`) : c.warn(`not found. ${r.hint}`)));
  if (e.wiki) {
    const w = e.wiki;
    const lic = w.license ? `${w.license.name} (${w.license.reason})` : 'license unknown';
    console.log(`  ${'Wiki license'.padEnd(14)} ${w.error ? c.bad(`could not check ${w.url}: ${w.error}`) : w.embeddable ? c.ok(lic) : c.warn(lic)}`);
    console.log(`  ${''.padEnd(14)} ${w.embeddable ? c.ok(`articles from ${w.sitename} are shown on the site`) : c.warn(`"Read the wiki" links to ${w.url}`)}`);
  }
  line(e.wiki ? 'Wiki' : 'Fandom', e.fandom, (r) => `${c.ok(r.wiki)}${r.mainArticle ? `, article "${r.mainArticle}"` : c.warn(', main article not found (check fandom_page)')}, ${r.topics} topics${r.missingTopics ? c.warn(` (${r.missingTopics} not found)`) : ''}`);
}

async function confirm(question) {
  if (opts.yes) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} ${c.dim('[y/N]')} `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// ---------- main ----------
export async function runAddGame(category) {
  CATEGORY = category;
  CMD = COMMANDS[category];
  opts = parseArgs(process.argv.slice(2));
  API = (opts.api || process.env.GRIMOIRE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  KEY = process.env.ADMIN_API_KEY;
  isLocal = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API);
  SITE = isLocal ? process.env.CLIENT_URL || 'http://localhost:5173' : API;
  fs.mkdirSync(ASSETS, { recursive: true });
  if (opts.category) fail(`--category is no longer needed: use npm run add-vgame, add-bgame or add-cgame.`);

  if (!KEY && !opts['dry-run']) fail('ADMIN_API_KEY is not set. Run start.bat once (it adds one to .env), or set it in the environment.');

  if (opts.pull) {
    const { status, json } = await admin('GET', `/games/${encodeURIComponent(opts.pull)}`);
    if (status !== 200) fail(json.error);
    checkCategory(json.game, json.game.title);
    json.game.wiki_url ??= '';
    const { thumbnail_url, banner_url, rulebook_url, faq_url, ...pulled } = json.game;
    json.game = { ...pulled, thumbnail: thumbnail_url ?? '', banner: banner_url ?? '', ...(CATEGORY === 'video' ? {} : { rulebook: rulebook_url ?? '', faq: faq_url ?? '' }) };
    console.log(c.ok(`Saved ${saveDraft(json.game)}`) + c.dim(` (currently managed by: ${json.managed_by}). Edit it, then run with --file.`));
    process.exit(0);
  }

  if (opts.refresh) {
    const { status, json } = await admin('POST', `/games/${encodeURIComponent(opts.refresh)}/refresh`);
    if (status !== 200) fail(json.error);
    console.log(c.b(`Refreshed ${json.slug}`));
    printEnrichment(json.enrichment);
    process.exit(0);
  }

  if (opts.release) {
    const { status, json } = await admin('POST', `/games/${encodeURIComponent(opts.release)}/release`);
    if (status !== 200) fail(json.error);
    console.log(c.ok(`${json.slug} is managed by the seed files again.`) + c.dim(' Restart the site (or npm run seed) to reload it from server/src/seed/data.'));
    process.exit(0);
  }

  let game;
  let notes = [];
  if (opts.file) {
    try {
      game = JSON.parse(fs.readFileSync(path.resolve(opts.file), 'utf8'));
    } catch (err) {
      fail(`Could not read ${opts.file}: ${err.message}`);
    }
    checkCategory(game, opts.file);
    if (game.wiki_url?.trim()) await customWikiStep(game, notes);
    if (CATEGORY !== 'video') await rulebookStep(game, notes);
    // Older drafts have "faq" as an empty list; it's a link now.
    if (Array.isArray(game.faq)) game.faq = '';
    if (CATEGORY !== 'video') game.unique_faq ??= [];
    game.banner ??= '';
    // Keep what the steps filled in (fandom_page, the TLDR) in the draft.
    fs.writeFileSync(path.resolve(opts.file), JSON.stringify(ordered(game), null, 2) + '\n');
  } else {
    const title = opts._.join(' ').trim();
    if (!title) fail(`Give a ${LABELS[CATEGORY]} title, e.g. npm run ${CMD} -- "${EXAMPLES[CATEGORY]}"   (or --file / --pull / --refresh)`);
    ({ game, notes } = await buildDraft(title));
    console.log(c.dim(`Draft saved to ${saveDraft(game)}`));
  }

  preview(game);
  if (notes.length) {
    console.log(`\n${c.b('Check before publishing')}`);
    for (const n of notes) console.log(`  • ${n}`);
  }

  if (!KEY) {
    console.log(c.dim('\nDry run (no ADMIN_API_KEY): nothing was checked with the server or sent.'));
    process.exit(0);
  }

  // Local files are uploaded after the game is saved; links are stored as they are.
  const { thumbnail, banner, rulebook, faq, ...payload } = game;
  if (faq?.trim()) payload.faq_url = faq.trim();
  const uploads = [];
  // An empty banner removes any banner sent before, so the page goes back to its usual one.
  if (banner === '') payload.banner_url = null;
  for (const [kind, value] of [['thumbnail', thumbnail], ['banner', banner], ['rulebook', CATEGORY === 'video' ? '' : rulebook]]) {
    const v = value?.trim();
    if (!v) continue;
    if (isWebLink(v) || isUploaded(v)) payload[`${kind}_url`] = v;
    else uploads.push({ kind, ...localFile(kind, v) });
  }

  const check = await admin('POST', '/games?dryRun=1', payload);
  if (check.status === 400) {
    console.log(`\n${c.bad('The server would reject this game:')}`);
    for (const e of check.json.errors) console.log(`  ${c.bad('✖')} ${e}`);
    console.log(c.dim(`\nFix ${opts.file ?? `game-drafts/${game.slug}.json`} and run: npm run ${CMD} -- --file ${opts.file ?? `game-drafts/${game.slug}.json`}`));
    process.exit(1);
  }
  if (check.status !== 200) fail(check.json.error ?? `Server answered ${check.status}`);
  for (const w of check.json.warnings) console.log(`  ${c.warn('!')} ${w}`);
  console.log(`\nThis will ${check.json.status === 'would-create' ? c.ok('create') : c.warn('update')} ${c.b(game.slug)} on ${API}` +
    (check.json.status === 'would-update' ? c.dim(` (changes: ${check.json.changed.join(', ') || 'sections only'})`) : ''));

  if (opts['dry-run']) {
    console.log(c.dim('Dry run: nothing was sent.'));
    process.exit(0);
  }
  if (!(await confirm('Send it?'))) {
    console.log(c.dim(`Not sent. Edit the draft and run: npm run ${CMD} -- --file game-drafts/${game.slug}.json`));
    process.exit(0);
  }

  console.log(c.dim(`Sending and fetching ${CATEGORY === 'video' ? 'Steam (art, patch notes, price, DLC) / HowLongToBeat / Fandom' : 'artwork, BoardGameGeek expansions and Fandom'} data (can take a few seconds)...`));
  const { status, json } = await admin('POST', '/games', payload);
  if (status === 400) {
    for (const e of json.errors) console.log(`  ${c.bad('✖')} ${e}`);
    process.exit(1);
  }
  if (status >= 300) fail(json.error ?? `Server answered ${status}`);
  console.log(`\n${c.ok(`✔ ${json.status === 'created' ? 'Added' : 'Updated'}`)} ${c.b(game.title)}: ${SITE}${json.url}`);
  printEnrichment(json.enrichment);
  for (const u of uploads) await uploadFile(game.slug, u);
}
