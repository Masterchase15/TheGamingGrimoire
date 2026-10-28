// BoardGameGeek XML API v2 client. Needs a BGG_API_TOKEN (BGG requires a
// registered application token). Used by the server to sync expansions and by
// the add-bgame / add-cgame scripts to look games up, so it has no database code.
const API = 'https://boardgamegeek.com/xmlapi2';
const UA = 'TheGamingGrimoire/1.0 (https://github.com/Masterchase15/TheGamingGrimoire)';

export const hasBggToken = () => Boolean(process.env.BGG_API_TOKEN);
export const bggUrl = (id) => `https://boardgamegeek.com/boardgame/${id}`;

export const decodeXml = (s = '') =>
  s
    .replace(/&#10;/g, '\n')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&');

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'User-Agent': UA, Authorization: `Bearer ${process.env.BGG_API_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`BoardGameGeek answered ${res.status}`);
  return res.text();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Splits a <items> response into one parsed object per <item>. */
function parseItems(xml) {
  return [...xml.matchAll(/<item\b[^>]*\bid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g)].map(([, id, body]) => {
    const val = (tag) => body.match(new RegExp(`<${tag}\\b[^>]*\\bvalue="([^"]*)"`))?.[1];
    const inner = (tag) => body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim();
    const links = (type) =>
      [...body.matchAll(new RegExp(`<link type="${type}" id="(\\d+)" value="([^"]*)"( inbound="true")?`, 'g'))].map((m) => ({
        id: Number(m[1]),
        name: decodeXml(m[2]),
        inbound: Boolean(m[3]),
      }));
    return {
      id: Number(id),
      name: decodeXml(body.match(/<name type="primary"[^>]*value="([^"]*)"/)?.[1] ?? ''),
      year: Number(val('yearpublished')) || null,
      minPlayers: val('minplayers'),
      maxPlayers: val('maxplayers'),
      minTime: val('minplaytime'),
      maxTime: val('maxplaytime'),
      minAge: val('minage'),
      description: inner('description') ? decodeXml(inner('description')) : null,
      thumbnail: inner('thumbnail') ?? null,
      image: inner('image') ?? null,
      usersRated: Number(val('usersrated')) || 0,
      links,
    };
  });
}

/** Full records for up to 20 ids per request (BGG's limit), fetched in sequence. */
export async function fetchThings(ids, { stats = false } = {}) {
  const out = [];
  for (let i = 0; i < ids.length; i += 20) {
    if (i) await sleep(2000); // BGG throttles rapid requests
    out.push(...parseItems(await get(`/thing?id=${ids.slice(i, i + 20).join(',')}${stats ? '&stats=1' : ''}`)));
  }
  return out;
}

const range = (a, b, unit = '') => (a && b && a !== b ? `${a}–${b}${unit}` : a && a !== '0' ? `${a}${unit}` : null);

/**
 * Finds a game by exact title (or uses `forcedId`) and returns the fields the
 * add scripts fill in. Null when nothing matches.
 */
export async function bggLookup(title, forcedId) {
  let id = forcedId ? Number(forcedId) : null;
  if (!id) {
    const xml = await get(`/search?type=boardgame&exact=1&query=${encodeURIComponent(title)}`);
    id = Number(xml.match(/<item type="boardgame" id="(\d+)"/)?.[1]) || null;
    if (!id) return null;
  }
  const [t] = await fetchThings([id]);
  if (!t) return null;
  const names = (type) => t.links(type).map((l) => l.name);
  return {
    id,
    name: t.name || title,
    year: t.year,
    players: range(t.minPlayers, t.maxPlayers),
    play_time: range(t.minTime, t.maxTime, ' min'),
    age: Number(t.minAge) ? `${t.minAge}+` : null,
    developer: names('boardgamedesigner').slice(0, 2).join(', ') || null,
    publisher: names('boardgamepublisher')[0] ?? null,
    genres: names('boardgamecategory').slice(0, 4),
    expansions: t.links('boardgameexpansion').filter((l) => !l.inbound).length,
  };
}

// Big games (Catan, Magic) have hundreds of expansions and fan promos; the page
// shows the ones the most BGG users have rated.
const MAX_CHECKED = 300;
const MAX_KEPT = 30;

/** A base game's expansions, most popular first: [{ bggId, name, year, description, image, url, popularity }]. */
export async function fetchExpansions(bggId) {
  const [base] = await fetchThings([bggId]);
  if (!base) throw new Error(`BoardGameGeek has no game ${bggId}`);
  const ids = base.links('boardgameexpansion').filter((l) => !l.inbound).map((l) => l.id).slice(0, MAX_CHECKED);
  if (!ids.length) return { name: base.name, expansions: [] };
  await sleep(2000);
  const things = await fetchThings(ids, { stats: true });
  const expansions = things
    .sort((a, b) => b.usersRated - a.usersRated || (b.year ?? 0) - (a.year ?? 0))
    .slice(0, MAX_KEPT)
    .map((t) => ({
      bggId: t.id,
      name: t.name,
      year: t.year,
      description: t.description ? excerpt(t.description) : null,
      image: t.thumbnail || t.image,
      url: bggUrl(t.id),
      popularity: t.usersRated,
    }));
  return { name: base.name, expansions };
}

function excerpt(text, max = 280) {
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s;
}
