import { CATEGORIES } from '../lib/format.js';
import { statusColor, statusLabel } from '../lib/statuses.js';

export function StatusBadge({ status }) {
  return (
    <span className="status" style={{ '--status-c': statusColor(status) }}>
      {statusLabel(status)}
    </span>
  );
}

export function CategoryChip({ category, glass = false }) {
  return <span className={`chip chip-${category} ${glass ? 'chip-glass' : ''}`}>{CATEGORIES[category]?.single}</span>;
}

export function LiveChip({ glass = false }) {
  return (
    <span className={`chip chip-live ${glass ? 'chip-glass' : ''}`} title="Played continuously — uses ongoing statuses">
      <span className="dot" aria-hidden="true" /> Ongoing
    </span>
  );
}

// "New" if a patch landed within the last week.
export const isRecent = (date, days = 7) => date && Date.now() - new Date(date).getTime() < days * 86400000;
