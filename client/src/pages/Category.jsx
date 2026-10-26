import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { CATEGORIES } from '../lib/format.js';
import GameCard, { GameGridSkeleton } from '../components/GameCard.jsx';
import GameArt from '../components/GameArt.jsx';
import { Empty, ErrorState } from '../components/Common.jsx';

const INTROS = {
  video: 'Guides, builds, HowLongToBeat times and live Steam patch notes — from story epics to live-service shooters.',
  board: 'Rules, setup and strategy for everything from family favorites to campaign crawlers.',
  card: 'How to play, formats, deckbuilding and complete keyword glossaries.',
};
const INDEX = { video: '01', board: '02', card: '03' };
const GENRE_LIMIT = 10;

export default function Category({ category }) {
  const meta = CATEGORIES[category];
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const genre = params.get('genre') ?? '';
  const sort = params.get('sort') ?? 'popular';
  const type = params.get('type') ?? '';
  const { data, error, loading, reload } = useApi(`/games?category=${category}&sort=${sort}`);
  const [showAllGenres, setShowAllGenres] = useState(false);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  // Most common genres first; the long tail hides behind a toggle.
  const genreList = useMemo(() => {
    if (!data) return [];
    const counts = {};
    for (const g of data.games) for (const x of g.genres) counts[x] = (counts[x] ?? 0) + 1;
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  }, [data]);
  const shownGenres = showAllGenres ? genreList : genreList.slice(0, GENRE_LIMIT);
  if (genre && !shownGenres.includes(genre)) shownGenres.push(genre);

  // Client-side filtering keeps the scoped search instant.
  const games = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.games.filter((g) => {
      if (genre && !g.genres.includes(genre)) return false;
      if (type === 'ongoing' && !g.is_continuous) return false;
      if (type === 'finite' && g.is_continuous) return false;
      if (!needle) return true;
      return [g.title, g.tagline, ...g.genres].some((s) => s?.toLowerCase().includes(needle));
    });
  }, [data, q, genre, type]);

  const headArt = (data?.games ?? []).filter((g) => g.capsule_url).slice(0, 3);

  return (
    <div style={{ '--accent': meta.color }}>
      <header className="page-head">
        <div className="page-head-art" aria-hidden="true">
          {headArt.map((g) => (
            <GameArt key={g.slug} game={g} />
          ))}
        </div>
        <div className="container">
          <span className="eyebrow">
            <b style={{ color: meta.color }}>{INDEX[category]}</b> <i>/</i> Wiki realm
          </span>
          <h1 className="display page-title">{meta.label}</h1>
          <p className="page-sub">{INTROS[category]}</p>
          <div className="page-head-meta">
            <span className="label">
              <span style={{ color: 'var(--text)' }}>{data?.games.length ?? '—'}</span> entries
            </span>
            <span className="label">
              <span style={{ color: 'var(--text)' }}>{genreList.length || '—'}</span> genres
            </span>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: 'var(--s8)' }}>
        <div className="toolbar" role="search">
          <div className="search">
            <div className="search-field">
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
              <input
                className="search-input"
                type="search"
                value={q}
                onChange={(e) => update('q', e.target.value)}
                placeholder={`Search ${meta.label.toLowerCase()}…`}
                aria-label={`Search ${meta.label.toLowerCase()}`}
              />
              {q && (
                <button className="search-clear" aria-label="Clear search" onClick={() => update('q', '')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {category === 'video' && (
            <select className="select" value={type} onChange={(e) => update('type', e.target.value)} aria-label="Game type">
              <option value="">All types</option>
              <option value="finite">Single-player / finite</option>
              <option value="ongoing">Live-service / ongoing</option>
            </select>
          )}
          <select className="select" value={sort} onChange={(e) => update('sort', e.target.value)} aria-label="Sort by">
            <option value="popular">Most popular</option>
            <option value="title">A–Z</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {genreList.length > 0 && (
          <div className="chip-row" role="group" aria-label="Filter by genre">
            <button className="filter-chip" aria-pressed={!genre} onClick={() => update('genre', '')}>
              All
            </button>
            {shownGenres.map((g) => (
              <button key={g} className="filter-chip" aria-pressed={genre === g} onClick={() => update('genre', genre === g ? '' : g)}>
                {g}
              </button>
            ))}
            {genreList.length > GENRE_LIMIT && (
              <button
                className="filter-chip"
                aria-expanded={showAllGenres}
                onClick={() => setShowAllGenres((v) => !v)}
                style={{ borderStyle: 'dashed' }}
              >
                {showAllGenres ? 'Fewer' : `+${genreList.length - GENRE_LIMIT} more`}
              </button>
            )}
          </div>
        )}

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <GameGridSkeleton />
        ) : games.length ? (
          <>
            <p className="label" style={{ marginBottom: 18 }} aria-live="polite">
              Showing {games.length} {games.length === 1 ? 'game' : 'games'}
            </p>
            <div className="capsule-grid">
              {games.map((g, i) => (
                <GameCard key={g.slug} game={g} eager={i < 6} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }} />
              ))}
            </div>
          </>
        ) : (
          <Empty
            icon={MagnifyingGlass}
            title="No games match"
            action={
              <button className="btn btn-sm" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            }
          >
            Try a different search or genre.
          </Empty>
        )}
      </div>
    </div>
  );
}
