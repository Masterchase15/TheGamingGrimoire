// Shared core of the remove-vgame, remove-bgame and remove-cgame scripts: takes a game
// off the site through the admin API. Each entry script fixes the category, so a
// board game can't be removed with remove-vgame by mistake.
//
//   npm run remove-vgame -- hades-ii            by slug (the end of the game's URL, /game/hades-ii)
//   npm run remove-bgame -- "Spirit Island"     or by title
//
// It shows what goes with the game and asks first. Removing deletes the game's page,
// quick guides, library entries, reviews, patch notes, DLC and uploaded files; forum
// threads about it stay, no longer tied to a game. Games from the seed files
// (server/src/seed/data) are remembered as removed, so a restart doesn't bring them back.
// The game's draft in game-drafts is kept, so it can be added again with:
//   npm run add-vgame -- --file game-drafts/<slug>.json
//
// Options:
//   --dry-run      show what would be removed; remove nothing
//   --yes          remove without asking
//   --api <url>    site to remove it from (default: GRIMOIRE_API_URL or http://localhost:3001)
import fs from 'node:fs';
import path from 'node:path';
import { adminClient, c, confirm, fail, parseArgs, root } from './admin-client.mjs';
import { slugify } from './add-game.mjs';

const COMMANDS = { video: 'remove-vgame', board: 'remove-bgame', card: 'remove-cgame' };
const LABELS = { video: 'video game', board: 'board game', card: 'card game' };
const EXAMPLES = { video: 'hades-ii', board: 'spirit-island', card: 'star-wars-unlimited' };

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function runRemoveGame(category) {
  const opts = parseArgs(process.argv.slice(2), ['--dry-run', '--yes']);
  const input = opts._.join(' ').trim();
  if (!input) fail(`Say which ${LABELS[category]} to remove, e.g. npm run ${COMMANDS[category]} -- ${EXAMPLES[category]}`);
  const slug = slugify(input);
  const { api, admin } = adminClient(opts);

  const check = await admin('DELETE', `/games/${encodeURIComponent(slug)}?dryRun=1`);
  if (check.status === 404) fail(`No game "${slug}" on ${api}. Use the end of the game's URL (/game/<slug>).`);
  if (check.status !== 200) fail(check.json.error ?? `Server answered ${check.status}`);
  const g = check.json;
  if (g.category !== category) fail(`${g.title} is a ${LABELS[g.category] ?? g.category}. Use npm run ${COMMANDS[g.category] ?? 'the matching script'} for it.`);

  console.log(`\n${c.b(g.title)} ${c.dim(`[${g.category}] /game/${g.slug} on ${api}`)}`);
  console.log(`  Removing it deletes its page, ${plural(g.sections, 'quick guide')}, ${plural(g.library_entries, 'library entry', 'library entries')} and ${plural(g.reviews, 'review')}.`);
  if (g.threads) console.log(`  ${plural(g.threads, 'forum thread')} about it stay on the forums, no longer tied to a game.`);
  if (g.in_seed) console.log(c.dim('  It comes from the seed files, so it is remembered as removed and a restart won\'t add it back.'));
  const draft = path.join(root, 'game-drafts', `${g.slug}.json`);
  if (fs.existsSync(draft)) console.log(c.dim(`  Its draft ${path.relative(root, draft)} is kept.`));

  if (opts['dry-run']) {
    console.log(c.dim('\nDry run: nothing was removed.'));
    process.exit(0);
  }
  if (!(await confirm(`\n${c.warn('Remove')} ${c.b(g.title)}? This can't be undone.`, opts.yes))) {
    console.log(c.dim('Not removed.'));
    process.exit(0);
  }

  const { status, json } = await admin('DELETE', `/games/${encodeURIComponent(g.slug)}`);
  if (status !== 200) fail(json.error ?? `Server answered ${status}`);
  console.log(`${c.ok('✔ Removed')} ${c.b(g.title)}.`);
  const add = { video: 'add-vgame', board: 'add-bgame', card: 'add-cgame' }[category];
  if (fs.existsSync(draft)) console.log(c.dim(`To add it back: npm run ${add} -- --file ${path.relative(root, draft).replace(/\\/g, '/')}`));
}
