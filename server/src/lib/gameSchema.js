// Validates game JSON sent to the admin API. Errors block the save; warnings are
// returned so the sender knows what the page will be missing.

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FANDOM_WIKI = /^[a-z0-9][a-z0-9-]{0,60}$/;
const CATEGORIES = ['video', 'board', 'card'];

const text = (max) => ({ kind: 'text', max });
const FIELDS = {
  slug: { kind: 'slug' },
  title: text(200),
  category: { kind: 'enum', values: CATEGORIES },
  tagline: text(300),
  description: text(5000),
  aliases: { kind: 'list', max: 30 },
  genres: { kind: 'list', max: 20 },
  platforms: { kind: 'list', max: 20 },
  developer: text(200),
  publisher: text(200),
  release_year: { kind: 'int', min: 1900, max: 2100 },
  players: text(40),
  play_time: text(40),
  age: text(20),
  is_continuous: { kind: 'bool' },
  featured: { kind: 'bool' },
  hue: { kind: 'int', min: 0, max: 359 },
  hltb_query: text(200),
  steam_appid: { kind: 'int', min: 1, max: 2 ** 31 - 1 },
  bgg_id: { kind: 'int', min: 1, max: 2 ** 31 - 1 },
  patch_exclude: { kind: 'regex' },
  fandom_wiki: { kind: 'fandom' },
  fandom_page: text(250),
  fandom_topics: { kind: 'list', max: 40 },
};

// Required per category, on top of slug/title/category. A video game must say
// which Steam app it is, or send "steam_appid": null to confirm it isn't on Steam.
const REQUIRED = {
  video: ['steam_appid'],
  board: ['players', 'play_time', 'age'],
  card: ['players'],
};

function checkField(name, rule, v, errors) {
  if (v === null) return null;
  const bad = (msg) => {
    errors.push(`${name}: ${msg}`);
    return null;
  };
  switch (rule.kind) {
    case 'slug':
      if (typeof v !== 'string' || !SLUG.test(v) || v.length > 80) return bad('use lowercase letters, numbers and dashes (e.g. "hades-ii")');
      return v;
    case 'text':
      if (typeof v !== 'string') return bad('must be text');
      if (v.trim().length > rule.max) return bad(`must be at most ${rule.max} characters`);
      return v.trim() || null;
    case 'enum':
      if (!rule.values.includes(v)) return bad(`must be one of ${rule.values.join(', ')}`);
      return v;
    case 'list':
      if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim() || x.length > 200)) return bad('must be a list of text values');
      if (v.length > rule.max) return bad(`at most ${rule.max} entries`);
      return [...new Set(v.map((x) => x.trim()))];
    case 'int':
      if (!Number.isInteger(v) || v < rule.min || v > rule.max) return bad(`must be a whole number from ${rule.min} to ${rule.max}`);
      return v;
    case 'bool':
      if (typeof v !== 'boolean') return bad('must be true or false');
      return v;
    case 'regex':
      if (typeof v !== 'string' || v.length > 200) return bad('must be a short pattern');
      try {
        new RegExp(v, 'i');
      } catch {
        return bad('is not a valid pattern');
      }
      return v;
    case 'fandom':
      if (typeof v !== 'string' || !FANDOM_WIKI.test(v)) return bad('must be the wiki subdomain, e.g. "hades" for hades.fandom.com');
      return v;
  }
}

const HTTP_URL = /^https?:\/\/\S+$/i;
const EXPANSION_KEYS = ['name', 'year', 'description', 'image', 'url', 'bgg_id'];

// Expansions listed by hand (board and card games). BoardGameGeek expansions are
// synced by the server from bgg_id and don't need to be listed here.
function checkExpansions(list, errors) {
  if (!Array.isArray(list)) return errors.push('expansions: must be a list'), [];
  if (list.length > 60) return errors.push('expansions: at most 60'), [];
  return list.map((e, i) => {
    const at = `expansions[${i}]`;
    if (!e || typeof e !== 'object') return errors.push(`${at}: must be an object`), null;
    const unknown = Object.keys(e).filter((k) => !EXPANSION_KEYS.includes(k));
    if (unknown.length) errors.push(`${at}: unknown field(s) ${unknown.join(', ')}`);
    if (typeof e.name !== 'string' || !e.name.trim()) errors.push(`${at}.name: required`);
    if (e.year != null && (!Number.isInteger(e.year) || e.year < 1900 || e.year > 2100)) errors.push(`${at}.year: must be a year`);
    if (e.bgg_id != null && (!Number.isInteger(e.bgg_id) || e.bgg_id < 1)) errors.push(`${at}.bgg_id: must be a BoardGameGeek id`);
    if (e.description != null && (typeof e.description !== 'string' || e.description.length > 2000)) {
      errors.push(`${at}.description: text up to 2000 characters`);
    }
    for (const k of ['image', 'url']) {
      if (e[k] != null && (typeof e[k] !== 'string' || !HTTP_URL.test(e[k]))) errors.push(`${at}.${k}: must be an http(s) link`);
    }
    return {
      name: e.name?.trim(),
      year: e.year ?? null,
      description: e.description?.trim() || null,
      image: e.image ?? null,
      url: e.url ?? (e.bgg_id ? `https://boardgamegeek.com/boardgame/${e.bgg_id}` : null),
      bgg_id: e.bgg_id ?? null,
    };
  });
}

function checkSections(sections, errors) {
  if (!Array.isArray(sections)) return errors.push('sections: must be a list'), [];
  if (sections.length > 50) return errors.push('sections: at most 50'), [];
  const seen = new Set();
  return sections.map((s, i) => {
    const at = `sections[${i}]`;
    if (!s || typeof s !== 'object') return errors.push(`${at}: must be an object`), null;
    if (typeof s.slug !== 'string' || !SLUG.test(s.slug)) errors.push(`${at}.slug: use lowercase letters, numbers and dashes`);
    else if (seen.has(s.slug)) errors.push(`${at}.slug: "${s.slug}" is used twice`);
    seen.add(s.slug);
    if (typeof s.title !== 'string' || !s.title.trim()) errors.push(`${at}.title: required`);
    for (const k of ['icon', 'summary', 'content']) {
      if (s[k] != null && typeof s[k] !== 'string') errors.push(`${at}.${k}: must be text`);
    }
    if (typeof s.content === 'string' && s.content.length > 100_000) errors.push(`${at}.content: too long`);
    const terms = s.terms ?? [];
    if (!Array.isArray(terms)) errors.push(`${at}.terms: must be a list`);
    else
      terms.forEach((t, j) => {
        if (!t || typeof t.term !== 'string' || typeof t.definition !== 'string' || !t.term.trim())
          errors.push(`${at}.terms[${j}]: needs "term" and "definition" text`);
      });
    return {
      slug: s.slug,
      title: s.title?.trim(),
      icon: s.icon ?? null,
      summary: s.summary ?? null,
      content: s.content ?? null,
      terms: Array.isArray(terms) ? terms.map((t) => ({ term: t?.term?.trim(), definition: t?.definition, grp: t?.grp ?? null })) : [],
    };
  });
}

/**
 * Validates `input` against the game schema. When `existing` (the stored game) is
 * given, omitted fields keep their stored values, so updates can be partial.
 * Returns { game, sections, expansions, errors, warnings }; `sections` and
 * `expansions` are undefined when the input didn't include them (the stored ones
 * are then left alone).
 */
export function validateGame(input, existing = null) {
  const errors = [];
  const warnings = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: ['Body must be a JSON object describing one game.'], warnings };
  }
  const unknown = Object.keys(input).filter((k) => !(k in FIELDS) && k !== 'sections' && k !== 'expansions');
  if (unknown.length) errors.push(`Unknown field(s): ${unknown.join(', ')}`);

  const game = {};
  for (const [name, rule] of Object.entries(FIELDS)) {
    if (name in input) game[name] = input[name] === undefined ? null : checkField(name, rule, input[name], errors);
    else if (existing) game[name] = existing[name];
  }
  for (const f of ['slug', 'title', 'category']) if (game[f] == null && !(f in input)) errors.push(`${f}: required`);

  for (const f of REQUIRED[game.category] ?? []) {
    // steam_appid may be an explicit null ("not on Steam"); everything else needs a value.
    const present = f === 'steam_appid' ? f in input || Boolean(existing) : game[f] != null;
    if (!present) {
      errors.push(
        f === 'steam_appid'
          ? 'steam_appid: required for video games (send null if the game is not on Steam)'
          : `${f}: required for ${game.category} games`
      );
    }
  }

  const sections = 'sections' in input ? checkSections(input.sections, errors) : undefined;
  let expansions;
  if ('expansions' in input) {
    if (game.category === 'video') errors.push('expansions: only board and card games list expansions (video game DLC is synced from Steam).');
    else expansions = checkExpansions(input.expansions ?? [], errors);
  }
  if (errors.length) return { game, sections, expansions, errors, warnings };

  if (!game.tagline) warnings.push('No tagline: the game card will show an empty subtitle.');
  if (!game.description) warnings.push('No description: the game page will have no About text.');
  if (!game.fandom_wiki) warnings.push('No fandom_wiki: the page will not have a Fandom wiki section.');
  if (game.category === 'video' && game.steam_appid == null) warnings.push('Not on Steam: the page will use a generated poster and show no patch notes.');
  if (game.category !== 'video' && game.steam_appid == null) warnings.push('No steam_appid: the page will use a generated poster instead of Steam art.');
  if (game.category === 'video' && game.bgg_id != null) warnings.push('bgg_id is only used for board and card games.');
  if (game.category !== 'video' && game.bgg_id == null && !expansions?.length) {
    warnings.push(`No bgg_id: expansions won't sync from BoardGameGeek (list them in "expansions" by hand if the game has any).`);
  }
  if (!existing && !sections?.length) warnings.push('No wiki sections yet: only facts, Steam, HowLongToBeat and Fandom data will show.');

  return { game, sections, expansions, errors, warnings };
}
