// Adds or updates a board game. Looks up BoardGameGeek (needs BGG_API_TOKEN in .env) and
// Fandom. Steam is never searched; set steam_appid only to use a digital version's artwork.
//   npm run add-bgame -- "<title>"   (all options: scripts/lib/add-game.mjs)
import { runAddGame } from './lib/add-game.mjs';

await runAddGame('board');
