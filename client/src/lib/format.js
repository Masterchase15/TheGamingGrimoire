export const CATEGORIES = {
  video: { label: 'Video Games', single: 'Video Game', path: '/video-games', color: 'var(--video)' },
  board: { label: 'Board Games', single: 'Board Game', path: '/board-games', color: 'var(--board)' },
  card: { label: 'Card Games', single: 'Card Game', path: '/card-games', color: 'var(--card)' },
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function initials(title) {
  const words = title
    .replace(/[:'’!.]/g, '')
    .split(/[\s-]+/)
    .filter((w) => w && !['the', 'of', 'a', 'and'].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => (/^\d/.test(w) ? w : w[0]))
    .join('')
    .toUpperCase();
}

export const hours = (h) => (h == null ? '—' : `${h % 1 === 0 ? h : h.toFixed(1)}h`);

// Stable hue per username, used for avatar gradients.
export function hueFor(text = '') {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export const displayName = (u) => u?.name || u?.display_username || u?.username || 'Someone';

// Steam prices arrive in cents with an ISO currency code.
export function money(cents, currency = 'USD') {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
