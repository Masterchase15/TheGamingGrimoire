import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, MagnifyingGlass, TextAa } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { CATEGORIES } from '../lib/format.js';
import GameCard from '../components/GameCard.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { Empty, Highlight, Spinner } from '../components/Common.jsx';
import { SectionHead } from './Home.jsx';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const scope = category ? `&category=${category}` : '';
  const { data, loading } = useApi(q ? `/search?q=${encodeURIComponent(q)}&limit=25${scope}` : null);
  const total = data ? data.games.length + data.pages.length + data.terms.length : 0;

  return (
    <>
      <header className="page-head">
        <div className="container">
          <span className="eyebrow">
            <b>?</b> <i>/</i> Search
          </span>
          <h1 className="display page-title">{q ? `“${q}”` : 'Search'}</h1>
          {q && data && (
            <p className="page-sub">
              {total} {total === 1 ? 'result' : 'results'}
              {category && <> in {CATEGORIES[category].label}</>}
            </p>
          )}
          <div style={{ maxWidth: 640, marginTop: 28 }}>
            <SearchBox category={category || undefined} size="lg" />
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: 'var(--s8)' }}>
        <div className="chip-row" role="group" aria-label="Scope">
          {[['', 'Everything'], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.label])].map(([k, label]) => (
            <button
              key={k || 'all'}
              className="filter-chip"
              aria-pressed={category === k}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (k) next.set('category', k);
                else next.delete('category');
                setParams(next);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!q ? (
          <Empty icon={MagnifyingGlass} title="Search the grimoire">
            Find games, wiki pages and keyword definitions.
          </Empty>
        ) : loading ? (
          <Spinner />
        ) : total === 0 ? (
          <Empty icon={MagnifyingGlass} title={`Nothing found for “${q}”`}>
            Check the spelling or try a broader term.
          </Empty>
        ) : (
          <>
            {data.games.length > 0 && (
              <section style={{ marginTop: 16 }}>
                <SectionHead index="01" kicker={`${data.games.length} found`} title="Games" />
                <div className="capsule-grid">
                  {data.games.map((g) => (
                    <GameCard key={g.slug} game={g} />
                  ))}
                </div>
              </section>
            )}
            {data.pages.length > 0 && (
              <section className="section">
                <SectionHead index="02" kicker={`${data.pages.length} found`} title="Wiki pages" />
                <div className="wiki-list">
                  {data.pages.map((p) => (
                    <Link key={`${p.game_slug}/${p.slug}`} to={`/game/${p.game_slug}/${p.slug}`} className="wiki-item">
                      <BookOpen size={18} weight="bold" className="gold" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
                      <div>
                        <h3>
                          <Highlight text={p.title} query={q} />
                        </h3>
                        <p>{p.game_title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {data.terms.length > 0 && (
              <section className="section">
                <SectionHead index="03" kicker={`${data.terms.length} found`} title="Keywords & terms" />
                <div className="glossary-list">
                  {data.terms.map((t) => (
                    <Link
                      key={`${t.game_slug}/${t.section_slug}/${t.term}`}
                      to={`/game/${t.game_slug}/${t.section_slug}#${encodeURIComponent(t.term)}`}
                      className="term"
                    >
                      <div className="term-head">
                        <h3 className="term-name">
                          <TextAa size={16} weight="bold" className="gold" style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} aria-hidden="true" />
                          <Highlight text={t.term} query={q} />
                        </h3>
                        <span className="chip">{t.game_title}</span>
                      </div>
                      <p>{t.definition}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
