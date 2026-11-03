// Saves games that are on the site as drafts in game-drafts, so they can be edited
// (details, files, Grimoire quick guides) and sent back with the add-?game scripts.
// This includes the games the site started with (the seed files in server/src/seed/data).
//
//   npm run pull-games                       every game that has no draft yet
//   npm run pull-games -- catan elden-ring   just these games (by slug)
//   npm run pull-games -- --category board   only board games (video, board or card)
//   npm run pull-games -- --overwrite        also replace drafts you already have
//
// Then edit game-drafts/<slug>.json and send it, e.g. npm run add-bgame -- --file game-drafts/catan.json.
// Once sent, a seed-file game is managed through the drafts and the seed files no longer change it.
import fs from 'node:fs';
import path from 'node:path';
import { adminClient, c, fail, parseArgs, root } from './lib/admin-client.mjs';
import { draftFromStored, saveDraftFile } from './lib/add-game.mjs';

const ADD = { video: 'add-vgame', board: 'add-bgame', card: 'add-cgame' };
const opts = parseArgs(process.argv.slice(2), ['--overwrite']);
if (opts.category && !ADD[opts.category]) fail('--category is video, board or card.');
const { api, admin } = adminClient(opts);

const list = await admin('GET', '/games');
if (list.status !== 200) fail(list.json.error ?? `Server answered ${list.status}`);
let games = list.json.games;
if (opts._.length) {
  const missing = opts._.filter((s) => !games.some((g) => g.slug === s));
  if (missing.length) fail(`Not on ${api}: ${missing.join(', ')}`);
  games = games.filter((g) => opts._.includes(g.slug));
}
if (opts.category) games = games.filter((g) => g.category === opts.category);

let saved = 0;
let kept = 0;
for (const g of games) {
  const file = path.join(root, 'game-drafts', `${g.slug}.json`);
  if (fs.existsSync(file) && !opts.overwrite) {
    kept++;
    continue;
  }
  const { status, json } = await admin('GET', `/games/${encodeURIComponent(g.slug)}`);
  if (status !== 200) {
    console.log(`  ${c.bad('✖')} ${g.title}: ${json.error ?? status}`);
    continue;
  }
  const out = saveDraftFile(draftFromStored(json.game));
  console.log(`  ${c.ok('✔')} ${out.replace(/\\/g, '/').padEnd(52)} ${c.dim(`${g.category}, ${json.game.sections.length} quick guides${g.managed_by === 'seed' ? ', from the seed files' : ''}`)}`);
  saved++;
}

console.log(`\n${c.b(`Saved ${saved} draft${saved === 1 ? '' : 's'}`)}${kept ? c.dim(` (${kept} already had one; --overwrite replaces them)`) : ''}.`);
if (saved) console.log(c.dim(`Edit a draft, then send it with its category's script, e.g. npm run ${ADD[games[0].category]} -- --file game-drafts/${games[0].slug}.json`));
