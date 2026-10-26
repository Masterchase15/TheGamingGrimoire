import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowSquareOut, BookOpenText, ListBullets, MagnifyingGlass } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { CATEGORIES } from '../lib/format.js';
import GameArt from '../components/GameArt.jsx';
import { Crumbs, Empty, ErrorState, Spinner } from '../components/Common.jsx';
import { Attribution, FandomMark, WikiSearch, wikiPath } from '../components/Fandom.jsx';

export default function FandomArticle() {
  const { slug, '*': rawTitle } = useParams();
  const title = decodeURIComponent(rawTitle || '').replace(/_/g, ' ');
  const navigate = useNavigate();
  const location = useLocation();
  const bodyRef = useRef(null);

  const gameReq = useApi(`/games/${slug}`);
  const fandomReq = useApi(`/games/${slug}/fandom`);
  const pageReq = useApi(title ? `/games/${slug}/fandom/page?title=${encodeURIComponent(title)}` : null);

  const game = gameReq.data?.game;
  const fandom = fandomReq.data?.fandom;
  const article = pageReq.data?.article;

  // Jump to #anchors once the article HTML is in the DOM.
  useEffect(() => {
    if (!article) return;
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [article, location.hash]);

  // Article links to other wiki pages stay inside the site.
  function onArticleClick(e) {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.dataset.internal) {
      e.preventDefault();
      navigate(a.getAttribute('href'));
    } else if (a.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `${location.pathname}#${encodeURIComponent(id)}`);
    }
  }

  if (gameReq.error) {
    return (
      <div className="page container">
        <ErrorState error={gameReq.error} />
      </div>
    );
  }
  if (!game) {
    return (
      <div className="center-page">
        <Spinner />
      </div>
    );
  }

  const cat = CATEGORIES[game.category];
  const sitename = fandom?.sitename || 'Fandom';
  const sections = article?.sections ?? [];

  return (
    <div className="container page">
      <div className="wiki-layout">
        <aside className="wiki-nav" aria-label="Wiki navigation">
          <Link to={`/game/${game.slug}#wiki`} className="wiki-nav-game">
            <GameArt game={game} showTitle={false} />
            <div style={{ minWidth: 0 }}>
              <div className="label">{sitename}</div>
              <div style={{ fontWeight: 650, lineHeight: 1.3 }}>{game.title}</div>
            </div>
          </Link>
          {fandom && <WikiSearch slug={game.slug} sitename={sitename} compact />}
          {sections.length > 0 && (
            <nav className="wiki-toc" aria-label="Contents">
              <div className="label" style={{ margin: '22px 0 8px' }}>
                <ListBullets size={12} weight="bold" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
                Contents
              </div>
              {sections.map((s) => (
                <a
                  key={s.anchor}
                  href={`#${s.anchor}`}
                  className={`wiki-nav-link ${s.level > 2 ? 'sub' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {s.title}
                </a>
              ))}
            </nav>
          )}
          {fandom?.topics.length > 0 && (
            <nav aria-label="Featured pages">
              <div className="label" style={{ margin: '22px 0 8px' }}>
                Featured pages
              </div>
              {fandom.topics.slice(0, 12).map((t) => (
                <Link
                  key={t.title}
                  to={wikiPath(game.slug, t.title)}
                  className={`wiki-nav-link ${article?.title === t.title ? 'active' : ''}`}
                >
                  {t.title}
                </Link>
              ))}
            </nav>
          )}
        </aside>

        <article style={{ minWidth: 0 }}>
          <Crumbs
            items={[
              { label: cat.label, to: cat.path },
              { label: game.title, to: `/game/${game.slug}` },
              { label: 'Wiki', to: `/game/${game.slug}#wiki` },
              { label: article?.title || title },
            ]}
          />

          <div className="wiki-mobile-nav">{fandom && <WikiSearch slug={game.slug} sitename={sitename} compact />}</div>

          {pageReq.loading && !article ? (
            <div className="stack" style={{ gap: 14 }}>
              <div className="skeleton" style={{ height: 64, width: '60%' }} />
              <div className="skeleton" style={{ height: 18 }} />
              <div className="skeleton" style={{ height: 18, width: '85%' }} />
              <div className="skeleton" style={{ height: 300 }} />
            </div>
          ) : pageReq.error ? (
            pageReq.error.status === 404 ? (
              <Empty
                icon={MagnifyingGlass}
                title="Page not found on the wiki"
                action={
                  <Link to={`/game/${game.slug}#wiki`} className="btn btn-sm">
                    <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Back to {game.title}
                  </Link>
                }
              >
                “{title}” doesn’t exist on {sitename}. Try the wiki search instead.
              </Empty>
            ) : (
              <ErrorState error={pageReq.error} onRetry={pageReq.reload} />
            )
          ) : (
            article && (
              <>
                <header className="fandom-head">
                  <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                    <span className="eyebrow">
                      <b>
                        <BookOpenText size={14} weight="bold" style={{ display: 'inline', verticalAlign: '-2px' }} aria-hidden="true" />
                      </b>{' '}
                      <i>/</i> {game.title} wiki
                    </span>
                    {fandom && <FandomMark sitename={sitename} />}
                  </div>
                  <h1 className="display article-title">{article.displayTitle || article.title}</h1>
                  {article.redirectedFrom && <p className="label" style={{ marginTop: 10 }}>Redirected from {article.redirectedFrom}</p>}
                  <div className="row wrap" style={{ marginTop: 18 }}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      View on Fandom <ArrowSquareOut size={14} aria-hidden="true" />
                    </a>
                  </div>
                </header>

                {/* Article HTML is sanitized on the server (no scripts, styles or event handlers). */}
                <div
                  ref={bodyRef}
                  className="prose fandom-article"
                  onClick={onArticleClick}
                  dangerouslySetInnerHTML={{ __html: article.html }}
                />

                {fandom && (
                  <div className="fandom-foot">
                    <Attribution fandom={fandom} article={article} />
                  </div>
                )}
              </>
            )
          )}
        </article>
      </div>
    </div>
  );
}
