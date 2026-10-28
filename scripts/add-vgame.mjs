// Adds or updates a video game. Looks up Steam and Fandom; after saving, the site pulls
// Steam artwork, patch notes and HowLongToBeat times.
//   npm run add-vgame -- "<title>"   (all options: scripts/lib/add-game.mjs)
import { runAddGame } from './lib/add-game.mjs';

await runAddGame('video');
