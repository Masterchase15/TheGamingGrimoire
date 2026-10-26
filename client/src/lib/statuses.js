// Keep in sync with server/src/lib/statuses.js.
export const STATUS = {
  want_to_play: { label: 'Want to Play', color: '#a78bfa', verb: 'wants to play' },
  playing: { label: 'Playing', color: '#38bdf8', verb: 'started playing' },
  completed: { label: 'Completed', color: '#34d399', verb: 'completed' },
  on_hold: { label: 'On Hold', color: '#fbbf24', verb: 'put on hold' },
  dropped: { label: 'Dropped', color: '#f87171', verb: 'dropped' },
  active: { label: 'Actively Playing', color: '#22d3ee', verb: 'is actively playing' },
  on_break: { label: 'Taking a Break', color: '#fbbf24', verb: 'is taking a break from' },
  not_playing: { label: 'Not Playing', color: '#94a3b8', verb: 'stopped playing' },
};

export const FINITE_STATUSES = ['want_to_play', 'playing', 'completed', 'on_hold', 'dropped'];
export const ONGOING_STATUSES = ['want_to_play', 'active', 'on_break', 'not_playing'];

export const statusLabel = (s) => STATUS[s]?.label ?? s;
export const statusColor = (s) => STATUS[s]?.color ?? '#94a3b8';
