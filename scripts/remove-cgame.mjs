// Removes a card game from the site (asks first; see scripts/lib/remove-game.mjs).
//   npm run remove-cgame -- <slug or title>
import { runRemoveGame } from './lib/remove-game.mjs';

await runRemoveGame('card');
