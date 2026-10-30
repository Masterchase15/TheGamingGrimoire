import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, BookOpenText, MagnifyingGlass, TextAa, X } from '@phosphor-icons/react';
import { api, useDebounced } from '../lib/api.js';
import { CATEGORIES, wikiPath } from '../lib/format.js';
import GameArt from './GameArt.jsx';

/**
 * Site-wide search with a live suggestions panel (games, articles from every game's
 * wiki, the Grimoire's quick guides, glossary terms).
 * Pass `category` to scope results to one tab. Enter with nothing highlighted opens the full results page.
 */
export default function SearchBox({ category, size, placeholder, autoFocus = false, inline = false, onNavigate }) {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(q.trim(), 180);

  useEffect(() => {
    if (!debounced) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const scope = category ? `&category=${category}` : '';
    api(`/search?q=${encodeURIComponent(debounced)}&limit=6${scope}`, { signal: ctrl.signal })
      .then((r) => {
        setResults(r);
        setActive(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced, category]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  // Flattened list for keyboard navigation; the last item is "see all results".
  const items = useMemo(() => {
    if (!results) return [];
    const list = [
      ...results.games.map((g) => ({ type: 'game', key: `g-${g.slug}`, to: `/game/${g.slug}`, data: g })),
      ...(results.articles ?? []).map((a) => ({
        type: 'article',
        key: `a-${a.game_slug}-${a.title}`,
        to: wikiPath(a.game_slug, a.title),
        data: a,
      })),
      ...results.pages.map((p) => ({
        type: 'page',
        key: `p-${p.game_slug}-${p.slug}`,
        to: `/game/${p.game_slug}/${p.slug}`,
        data: p,
      })),
      ...results.terms.map((t) => ({
        type: 'term',
        key: `t-${t.game_slug}-${t.section_slug}-${t.term}`,
        to: `/game/${t.game_slug}/${t.section_slug}#${encodeURIComponent(t.term)}`,
        data: t,
      })),
    ];
    list.push({ type: 'all', key: 'all', to: searchPath() });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  function searchPath() {
    const params = new URLSearchParams({ q: q.trim() });
    if (category) params.set('category', category);
    return `/search?${params}`;
  }

  function go(to) {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    onNavigate?.();
    navigate(to);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && items[active]) go(items[active].to);
      else if (q.trim()) go(searchPath());
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showPanel = (open || inline) && q.trim().length > 0;
  const empty = results && !results.games.length && !results.articles?.length && !results.pages.length && !results.terms.length;
  const label = placeholder || (category ? `Search ${CATEGORIES[category].label.toLowerCase()}…` : 'Search games, rules, keywords…');
  let index = -1;
  const optionProps = (item) => {
    index += 1;
    const i = index;
    return {
      id: `${listId}-${i}`,
      role: 'option',
      'aria-selected': active === i,
      onMouseEnter: () => setActive(i),
      onMouseDown: (e) => e.preventDefault(),
      onClick: () => go(item.to),
    };
  };
  const groups = [
    ['game', 'Games'],
    ['article', 'Wiki articles'],
    ['page', 'Quick guides'],
    ['term', 'Keywords & terms'],
  ];

  return (
    <div className={`search ${size === 'lg' ? 'search-lg' : ''} ${inline ? 'search-inline' : ''}`} ref={rootRef}>
      <div className="search-field">
        <MagnifyingGlass size={size === 'lg' ? 22 : 18} weight="bold" aria-hidden="true" />
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          value={q}
          placeholder={label}
          aria-label={label}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="search-panel" id={listId} role="listbox" aria-label="Search suggestions">
          {!results && loading && <div className="search-empty">Searching…</div>}
          {empty && <div className="search-empty">No matches for “{q.trim()}”.</div>}
          {results &&
            groups.map(([type, title]) => {
              const group = items.filter((it) => it.type === type);
              if (!group.length) return null;
              return (
                <div key={type} role="group" aria-label={title}>
                  <div className="search-group-label">{title}</div>
                  {group.map((item) => (
                    <div key={item.key} className="search-item" {...optionProps(item)}>
                      <ResultVisual item={item} />
                      <div className="search-item-text">
                        <div className="search-item-title">{item.data.title || item.data.term}</div>
                        <div className="search-item-sub">{subtitle(item)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          {results && (
            <div className="search-footer" {...optionProps(items[items.length - 1])}>
              <span>See all results for “{q.trim()}”</span>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultVisual({ item }) {
  if (item.type === 'game') {
    return <GameArt game={item.data} className="search-thumb" showTitle={false} />;
  }
  const Icon = item.type === 'article' ? BookOpenText : item.type === 'page' ? BookOpen : TextAa;
  return (
    <span className="search-icon" aria-hidden="true">
      <Icon size={16} weight="bold" />
    </span>
  );
}

function subtitle(item) {
  const d = item.data;
  if (item.type === 'game') return `${CATEGORIES[d.category].single}${d.release_year ? ` · ${d.release_year}` : ''}`;
  if (item.type === 'article') return `${d.game_title} wiki`;
  if (item.type === 'page') return `${d.game_title} · Quick guide`;
  return `${d.game_title} · ${d.definition}`;
}
