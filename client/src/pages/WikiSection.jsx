import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { CATEGORIES } from '../lib/format.js';
import GameArt from '../components/GameArt.jsx';
import { Crumbs, Empty, ErrorState, Highlight, Markdown, Spinner } from '../components/Common.jsx';

export default function WikiSection() {
  const { slug, section } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(`/games/${slug}/sections/${section}`);

  if (loading && !data) {
    return (
      <div className="center-page">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="page container">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const { section: s, terms, siblings } = data;
  const cat = CATEGORIES[s.game_category];
  const idx = siblings.findIndex((x) => x.slug === s.slug);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const gameForArt = { title: s.game_title, category: s.game_category, hue: s.game_hue, capsule_url: s.game_capsule };

  return (
    <div className="container page">
      <div className="wiki-layout">
        <aside className="wiki-nav" aria-label={`${s.game_title} wiki pages`}>
          <Link to={`/game/${s.game_slug}`} className="wiki-nav-game">
            <GameArt game={gameForArt} showTitle={false} />
            <div style={{ minWidth: 0 }}>
              <div className="label">{cat.single}</div>
              <div style={{ fontWeight: 650, lineHeight: 1.3 }}>{s.game_title}</div>
            </div>
          </Link>
          <nav>
            {siblings.map((x, i) => (
              <Link
                key={x.slug}
                to={`/game/${s.game_slug}/${x.slug}`}
                className={`wiki-nav-link ${x.slug === s.slug ? 'active' : ''}`}
                aria-current={x.slug === s.slug ? 'page' : undefined}
              >
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                {x.title}
              </Link>
            ))}
          </nav>
        </aside>

        <article style={{ minWidth: 0 }}>
          <Crumbs
            items={[
              { label: cat.label, to: cat.path },
              { label: s.game_title, to: `/game/${s.game_slug}` },
              { label: s.title },
            ]}
          />
          <div className="wiki-mobile-nav">
            <label className="sr-only" htmlFor="wiki-jump">
              Jump to page
            </label>
            <select id="wiki-jump" className="select" value={s.slug} onChange={(e) => navigate(`/game/${s.game_slug}/${e.target.value}`)}>
              {siblings.map((x, i) => (
                <option key={x.slug} value={x.slug}>
                  {String(i + 1).padStart(2, '0')} · {x.title}
                </option>
              ))}
            </select>
          </div>

          <header style={{ marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid var(--line)' }}>
            <span className="eyebrow">
              <b>{String(idx + 1).padStart(2, '0')}</b> <i>/</i> {s.game_title}
            </span>
            <h1 className="display article-title">{s.title}</h1>
            {s.summary && <p className="page-sub">{s.summary}</p>}
          </header>

          {s.content && <Markdown>{s.content}</Markdown>}
          {terms.length > 0 && <Glossary terms={terms} />}

          <nav className="row wrap" style={{ justifyContent: 'space-between', marginTop: 56 }} aria-label="Wiki pagination">
            {prev ? (
              <Link to={`/game/${s.game_slug}/${prev.slug}`} className="btn">
                <ArrowLeft size={16} weight="bold" aria-hidden="true" /> {prev.title}
              </Link>
            ) : (
              <Link to={`/game/${s.game_slug}`} className="btn">
                <ArrowLeft size={16} weight="bold" aria-hidden="true" /> {s.game_title}
              </Link>
            )}
            {next && (
              <Link to={`/game/${s.game_slug}/${next.slug}`} className="btn btn-gold">
                {next.title} <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}

const firstLetter = (term) => {
  const c = term[0].toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

function Glossary({ terms }) {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [letter, setLetter] = useState('');

  const groups = useMemo(() => [...new Set(terms.map((t) => t.grp).filter(Boolean))], [terms]);
  const letters = useMemo(() => new Set(terms.map((t) => firstLetter(t.term))), [terms]);

  // Deep links from search (#Flying) scroll to and highlight the term.
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    setQuery('');
    setGroup('');
    setLetter('');
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('term-flash');
        el.focus({ preventScroll: true });
      }
    });
  }, [location.hash]);

  const needle = query.trim().toLowerCase();
  const visible = terms.filter((t) => {
    if (group && t.grp !== group) return false;
    if (letter && firstLetter(t.term) !== letter) return false;
    if (!needle) return true;
    return t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle);
  });
  const sorted = needle || letter ? [...visible].sort((a, b) => a.term.localeCompare(b.term)) : visible;

  return (
    <section style={{ marginTop: 32 }} aria-label="Glossary">
      <div className="glossary-tools">
        <div className="search">
          <div className="search-field">
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <input
              className="search-input"
              type="search"
              placeholder={`Filter ${terms.length} entries…`}
              aria-label="Filter entries"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear" aria-label="Clear filter" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {groups.length > 1 && (
          <div className="chip-row" style={{ marginBottom: 0 }} role="group" aria-label="Filter by group">
            <button className="filter-chip" aria-pressed={!group} onClick={() => setGroup('')}>
              All
            </button>
            {groups.map((g) => (
              <button key={g} className="filter-chip" aria-pressed={group === g} onClick={() => setGroup(group === g ? '' : g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="az" role="group" aria-label="Filter by first letter">
          {'#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
            <button
              key={l}
              aria-pressed={letter === l}
              disabled={!letters.has(l)}
              onClick={() => setLetter(letter === l ? '' : l)}
              aria-label={l === '#' ? 'Other' : `Letter ${l}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="label" style={{ margin: '8px 0 14px' }} aria-live="polite">
        Showing {sorted.length} of {terms.length}
      </p>
      {sorted.length ? (
        <div className="glossary-list">
          {sorted.map((t) => (
            <div key={`${t.grp}-${t.term}`} id={t.term} className="term" tabIndex={-1}>
              <div className="term-head">
                <h3 className="term-name">
                  <Highlight text={t.term} query={needle} />
                </h3>
                {t.grp && groups.length > 1 && <span className="chip">{t.grp}</span>}
              </div>
              <p>
                <Highlight text={t.definition} query={needle} />
              </p>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={MagnifyingGlass} title="No entries match">
          Try another word, or clear the filters.
        </Empty>
      )}
    </section>
  );
}
