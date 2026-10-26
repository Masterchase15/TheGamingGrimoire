// Library statuses. Games with an ending use FINITE; games that are played
// continuously (live-service, competitive multiplayer, TCGs, most board games) use ONGOING.
// Keep in sync with client/src/lib/statuses.js.
export const FINITE_STATUSES = ['want_to_play', 'playing', 'completed', 'on_hold', 'dropped'];
export const ONGOING_STATUSES = ['want_to_play', 'active', 'on_break', 'not_playing'];

export const statusesFor = (game) => (game.is_continuous ? ONGOING_STATUSES : FINITE_STATUSES);

// Statuses that count as "currently playing" in feeds and profiles.
export const NOW_PLAYING = ['playing', 'active'];
