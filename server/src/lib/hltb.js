// HowLongToBeat has no official public API. This client uses the same search
// endpoint the howlongtobeat.com site uses: fetch a short-lived token from
// /api/search/site/init, then POST the search with that token. Results are
// cached on the games table so each game is looked up rarely.
const BASE = 'https://howlongtobeat.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, Referer: `${BASE}/`, Origin: BASE };
const TOKEN_TTL_MS = 10 * 60 * 1000;

let cachedToken = null;

async function getToken(force = false) {
  if (!force && cachedToken && Date.now() - cachedToken.at < TOKEN_TTL_MS) return cachedToken.value;
  const res = await fetch(`${BASE}/api/search/site/init?t=${Date.now()}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`HLTB init failed (${res.status})`);
  const { token } = await res.json();
  cachedToken = { value: token, at: Date.now() };
  return token;
}

function searchBody(title) {
  return {
    searchType: 'games',
    searchTerms: title.trim().split(/\s+/),
    searchPage: 1,
    size: 10,
    searchOptions: {
      games: {
        userId: 0,
        platform: '',
        sortCategory: 'popular',
        rangeCategory: 'main',
        rangeTime: { min: null, max: null },
        gameplay: { perspective: '', flow: '', genre: '', difficulty: '' },
        rangeYear: { min: '', max: '' },
        modifier: '',
      },
      users: { sortCategory: 'postcount' },
      lists: { sortCategory: 'follows' },
      filter: '',
      sort: 0,
      randomizer: 0,
    },
    useCache: true,
  };
}

async function rawSearch(title, retry = true) {
  const token = await getToken(!retry);
  const res = await fetch(`${BASE}/api/search/site`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify(searchBody(title)),
    signal: AbortSignal.timeout(8000),
  });
  if ((res.status === 403 || res.status === 401) && retry) return rawSearch(title, false);
  if (!res.ok) throw new Error(`HLTB search failed (${res.status})`);
  const json = await res.json();
  return json.data || [];
}

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');

const toHours = (seconds) => (seconds > 0 ? Math.round((seconds / 3600) * 10) / 10 : null);

/** Returns { id, name, main, extra, complete, image } or null when HLTB has no match. */
export async function lookupHltb(title, year) {
  const results = await rawSearch(title);
  if (!results.length) return null;
  const target = normalize(title);
  const pick =
    results.find((r) => normalize(r.game_name) === target && (!year || r.release_world === year)) ||
    results.find((r) => normalize(r.game_name) === target) ||
    results.find((r) => normalize(r.game_alias || '').includes(target)) ||
    results[0];
  return {
    id: pick.game_id,
    name: pick.game_name,
    main: toHours(pick.comp_main),
    extra: toHours(pick.comp_plus),
    complete: toHours(pick.comp_100),
  };
}

export const hltbUrl = (id) => `${BASE}/game/${id}`;
