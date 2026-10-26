import { Link } from 'react-router-dom';
import { Clock, Users } from '@phosphor-icons/react';
import GameArt from './GameArt.jsx';
import { CategoryChip, LiveChip, StatusBadge, isRecent } from './Badges.jsx';
import { CATEGORIES, hours } from '../lib/format.js';

// Steam-library style capsule card.
export default function GameCard({ game, status, style, eager }) {
  const meta = [
    game.release_year,
    game.current_version ? `v${game.current_version}` : null,
    !game.current_version && game.players ? `${game.players} players` : null,
  ].filter(Boolean);

  return (
    <Link to={`/game/${game.slug}`} className="capsule rise" style={style}>
      <div className="capsule-art">
        <GameArt game={game} eager={eager} />
        <div className="capsule-badges">
          {status ? <StatusBadge status={status} /> : <CategoryChip category={game.category} glass />}
          {isRecent(game.last_update_at) && <span className="chip chip-solid">Updated</span>}
        </div>
        <div className="capsule-foot">
          {game.is_continuous && <LiveChip glass />}
          {game.hltb_main && (
            <span className="chip chip-glass" title="HowLongToBeat main story">
              <Clock size={12} weight="bold" aria-hidden="true" /> {hours(game.hltb_main)}
            </span>
          )}
          {game.member_count > 0 && (
            <span className="chip chip-glass" title="Players tracking">
              <Users size={12} weight="bold" aria-hidden="true" /> {game.member_count}
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="capsule-title">{game.title}</h3>
        <div className="capsule-meta">
          <span>{CATEGORIES[game.category]?.single}</span>
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function GameGridSkeleton({ count = 10 }) {
  return (
    <div className="capsule-grid" aria-busy="true" aria-label="Loading games">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '2 / 3' }} />
          <div className="skeleton" style={{ height: 14, marginTop: 12, width: '70%' }} />
        </div>
      ))}
    </div>
  );
}
