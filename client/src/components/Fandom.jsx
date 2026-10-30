import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowSquareOut, BookOpenText, MagnifyingGlass, X } from '@phosphor-icons/react';
import { api, useDebounced } from '../lib/api.js';
import { wikiPath } from '../lib/format.js';
import { Spinner } from './Common.jsx';

export { wikiPath };

export function FandomMark({ sitename, provider = 'Fandom' }) {
  return (
    <span className="fandom-mark" title={`Content from ${sitename} on ${provider}`}>
      <span className="fandom-dot" aria-hidden="true" />
      {sitename} · {provider}
    </span>
  );
}

// Credits the wiki and its license (Fandom's CC BY-SA, or whatever a game's own wiki uses).
export function Attribution({ fandom, article }) {
  const provider = fandom.provider || 'Fandom';
  return (
    <p className="fandom-attrib">
      Text from{' '}
      <a href={article?.url || fandom.baseUrl} target="_blank" rel="noopener noreferrer">
        {article ? `“${article.title}”` : fandom.sitename}
      </a>{' '}
      on {article ? fandom.sitename || provider : provider}, licensed under{' '}
      <a href={fandom.license?.url || 'https://www.fandom.com/licensing'} target="_blank" rel="noopener noreferrer">
        {fandom.license?.name || 'CC BY-SA 3.0'}
      </a>
      {article?.historyUrl && (
        <>
          {' · '}
          <a href={article.historyUrl} target="_blank" rel="noopener noreferrer">
            Contributors
          </a>
        </>
      )}
      .
    </p>
  );
}

/** Search box scoped to one game's Fandom wiki, with live results. */
export function WikiSearch({ slug, sitename, compact = false }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounced = useDebounced(q.trim(), 300);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!debounced) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    api(`/games/${slug}/fandom/search?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => setResults(r.results))
      .catch((e) => e.name !== 'AbortError' && setError(e.message))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced, slug]);

  return (
    <div className={`wiki-search ${compact ? 'compact' : ''}`} ref={rootRef}>
      <form
        className="search-field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results?.[0]) navigate(wikiPath(slug, results[0].title));
        }}
      >
        <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
        <input
          className="search-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${sitename}…`}
          aria-label={`Search ${sitename}`}
        />
        {q && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQ('')}>
            <X size={16} />
          </button>
        )}
      </form>
      {debounced && (
        <div className="wiki-search-results" aria-live="polite">
          {loading && !results && (
            <div className="search-empty">
              <Spinner />
            </div>
          )}
          {error && <div className="search-empty">{error}</div>}
          {results?.length === 0 && <div className="search-empty">No pages match “{debounced}”.</div>}
          {results?.map((r) => (
            <Link key={r.title} to={wikiPath(slug, r.title)} className="wiki-search-item">
              <span className="wiki-search-title">{r.title}</span>
              {/* Snippet HTML is sanitized server-side to <mark> only. */}
              {!compact && r.snippet && <span className="wiki-search-snippet" dangerouslySetInnerHTML={{ __html: `…${r.snippet}…` }} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** The Fandom wiki block on a game page: overview, search and featured topics. */
export function FandomOverview({ slug, fandom }) {
  const { main, topics } = fandom;
  return (
    <div className="stack" style={{ gap: 28 }}>
      {main && (
        <article className="wiki-hero frame">
          {main.thumbnail && (
            <div className="wiki-hero-img">
              <img src={main.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="wiki-hero-body">
            <span className="label label-gold">Overview</span>
            <h3>{main.title}</h3>
            {main.extract && <p className="text-2">{main.extract}</p>}
            <div className="row wrap" style={{ marginTop: 18 }}>
              <Link to={wikiPath(slug, main.title)} className="btn btn-gold btn-sm">
                <BookOpenText size={16} weight="bold" aria-hidden="true" /> Read full article
              </Link>
              <a href={main.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                Open on {fandom.provider || 'Fandom'} <ArrowSquareOut size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </article>
      )}

      <WikiSearch slug={slug} sitename={fandom.sitename} />

      {topics.length > 0 && (
        <div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="label">Featured pages · {topics.length}</span>
            <a className="link-btn muted" href={fandom.baseUrl} target="_blank" rel="noopener noreferrer">
              {fandom.articles ? `${fandom.articles.toLocaleString()} articles` : 'Browse'} on {fandom.provider || 'Fandom'} <ArrowSquareOut size={12} aria-hidden="true" />
            </a>
          </div>
          <div className="topic-grid">
            {topics.map((t, i) => (
              <Link key={t.title} to={wikiPath(slug, t.title)} className="topic-card rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <div className={`topic-img ${t.icon ? 'is-icon' : ''}`}>
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="topic-glyph" aria-hidden="true">
                      {t.title.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="topic-body">
                  <h4>
                    {t.title} <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </h4>
                  {t.extract && <p>{t.extract}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Attribution fandom={fandom} />
    </div>
  );
}

/**
 * A game's own wiki whose license doesn't allow republishing its articles (or
 * couldn't be checked): the Grimoire only links to it.
 */
export function ExternalWiki({ wiki }) {
  return (
    <article className="wiki-hero frame">
      <div className="wiki-hero-body">
        <span className="label label-gold">Community wiki</span>
        <h3>{wiki.sitename}</h3>
        <p className="text-2">
          {wiki.license
            ? <>This wiki is licensed under{' '}
                {wiki.license.url ? (
                  <a href={wiki.license.url} target="_blank" rel="noopener noreferrer">{wiki.license.name}</a>
                ) : (
                  wiki.license.name
                )}
                , which {wiki.license.reason || 'does not allow republishing'}, so its articles aren’t shown here. Read them on the wiki itself.</>
            : 'This wiki’s license couldn’t be checked, so its articles aren’t shown here. Read them on the wiki itself.'}
        </p>
        <div className="row wrap" style={{ marginTop: 18 }}>
          <a href={wiki.baseUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
            <BookOpenText size={16} weight="bold" aria-hidden="true" /> Read the wiki <ArrowSquareOut size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
