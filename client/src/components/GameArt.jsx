import { useState } from 'react';
import { CATEGORIES } from '../lib/format.js';
import { CategoryIcon } from './Icons.jsx';

/**
 * Portrait game art: the Steam library capsule when we have one, otherwise a
 * generated poster in the same 2:3 format so grids stay consistent.
 */
export default function GameArt({ game, className = '', eager = false, showTitle = true }) {
  const [failed, setFailed] = useState(false);
  const src = game.capsule_url && !failed ? game.capsule_url : null;
  return (
    <div className={`art ${className}`} aria-hidden="true">
      {src ? (
        <img
          src={src}
          alt=""
          width="600"
          height="900"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="art-poster" style={{ '--h': game.hue ?? 265 }}>
          {showTitle && <span className="art-poster-cat">{CATEGORIES[game.category]?.single}</span>}
          <span className="art-poster-glyph">
            <CategoryIcon category={game.category} weight="thin" />
          </span>
          {showTitle && <span className="art-poster-title">{game.title}</span>}
        </div>
      )}
    </div>
  );
}
