import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowSquareOut,
  BookOpen,
  CaretDown,
  CaretUp,
  ChatsCircle,
  Clock,
  GitCommit,
  Info,
  NotePencil,
  Plus,
  PuzzlePiece,
  Star,
  SteamLogo,
  Tag,
  Users,
} from '@phosphor-icons/react';
import { api, useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, hours, money, timeAgo } from '../lib/format.js';
import { STATUS } from '../lib/statuses.js';
import GameArt from '../components/GameArt.jsx';
import LibraryEditor from '../components/LibraryEditor.jsx';
import { CategoryChip, LiveChip, StatusBadge, isRecent } from '../components/Badges.jsx';
import { SectionIcon } from '../components/Icons.jsx';
import { Crumbs, Empty, ErrorState, Markdown, Spinner } from '../components/Common.jsx';
import { SectionHead } from './Home.jsx';
import { ThreadList } from './Forums.jsx';
import { FandomMark, FandomOverview, wikiPath } from '../components/Fandom.jsx';
import { GameReviews } from '../components/Reviews.jsx';

export default function Game() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = useSession();
  const { data, error, loading, reload, setData } = useApi(`/games/${slug}`);
  const fandomReq = useApi(`/games/${slug}/fandom`);
  const fandom = fandomReq.data?.fandom;
  const [editing, setEditing] = useState(false);
  // Kept in sync by the reviews section so the hero and subnav update after posting.
  const [reviewSummary, setReviewSummary] = useState(null);

  // Honor #patch-notes / #discussions deep links once content exists.
  useEffect(() => {
    if (data && location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    }
  }, [data, location.hash]);

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

  const { game, sections, hltb, stats, entry, threadCount, steam, updates, store, dlc, expansions, bgg } = data;
  const reviews = reviewSummary ?? data.reviews;
  const onSale = store?.price?.discount > 0;
  // "Read the wiki" opens the game's Fandom article; games without one fall back to the first quick guide.
  const wikiLink = game.fandom_page ? wikiPath(game.slug, game.fandom_page) : sections[0] && `/game/${game.slug}/${sections[0].slug}`;
  const cat = CATEGORIES[game.category];
  const totalMembers = Object.values(stats).reduce((a, b) => a + b, 0);
  const showPatches = game.category === 'video';

  function openEditor() {
    if (!session?.user) navigate(`/login?next=/game/${slug}`);
    else setEditing(true);
  }

  const facts = [
    ['Released', game.release_year],
    ['Developer', game.developer],
    ['Publisher', game.publisher !== game.developer ? game.publisher : null],
    ['Players', game.players],
    ['Play time', game.play_time],
    ['Age', game.age],
    ['Platforms', game.platforms.join(', ')],
    ['Genres', game.genres.join(', ')],
  ].filter(([, v]) => v);

  const subnav = [
    ['overview', 'Overview'],
    showPatches && ['patch-notes', 'Patch notes', updates.length],
    dlc && ['dlc', 'DLC', dlc.length],
    expansions && ['expansions', 'Expansions', expansions.length],
    ['wiki', 'Wiki', fandom ? fandom.topics.length + sections.length : sections.length],
    ['reviews', 'Reviews', reviews.count],
    ['discussions', 'Discussions', threadCount],
  ].filter(Boolean);
  // Section numbers follow whichever sections this game shows.
  const sectionIndex = (id) => String(subnav.findIndex(([s]) => s === id) + 1).padStart(2, '0');

  return (
    <>
      <section className="game-hero">
        {game.hero_url ? (
          <div className="game-hero-bg" aria-hidden="true">
            <img src={game.hero_url} alt="" />
          </div>
        ) : game.capsule_url ? (
          <div className="game-hero-bg blur" aria-hidden="true">
            <img src={game.capsule_url} alt="" />
          </div>
        ) : (
          <div className="game-hero-bg fallback" style={{ '--h': game.hue }} aria-hidden="true" />
        )}
        <div className="container game-hero-inner">
          <GameArt game={game} className="game-poster" eager />
          <div style={{ minWidth: 0 }}>
            <Crumbs items={[{ label: cat.label, to: cat.path }, { label: game.title }]} />
            <div className="row wrap" style={{ gap: 8 }}>
              <CategoryChip category={game.category} glass />
              {game.is_continuous && <LiveChip glass />}
              {game.current_version && <span className="chip chip-gold chip-glass">v{game.current_version}</span>}
              {onSale && (
                <a href={steam.storeUrl} target="_blank" rel="noreferrer noopener" className="chip chip-sale chip-glass" title="On sale on Steam">
                  <Tag size={12} weight="bold" aria-hidden="true" /> −{store.price.discount}% · {money(store.price.final, store.price.currency)}
                </a>
              )}
              {entry && <StatusBadge status={entry.status} />}
              {reviews.count > 0 && (
                <a href="#reviews" className="chip chip-glass" title="Grimoire score">
                  <Star size={12} weight="fill" color="var(--gold)" aria-hidden="true" /> {reviews.average.toFixed(1)}/10 ·{' '}
                  {reviews.count} {reviews.count === 1 ? 'review' : 'reviews'}
                </a>
              )}
            </div>
            <h1 className="display game-title">{game.title}</h1>
            {game.tagline && <p className="game-tagline">{game.tagline}</p>}
            <div className="game-actions">
              {entry ? (
                <button className="btn btn-outline" onClick={openEditor}>
                  <NotePencil size={18} weight="bold" aria-hidden="true" /> Edit in library
                </button>
              ) : (
                <button className="btn btn-gold" onClick={openEditor}>
                  <Plus size={18} weight="bold" aria-hidden="true" /> Add to library
                </button>
              )}
              {wikiLink && (
                <Link className="btn" to={wikiLink}>
                  <BookOpen size={18} weight="bold" aria-hidden="true" /> Read the wiki
                </Link>
              )}
              {steam && (
                <a className="btn btn-ghost" href={steam.storeUrl} target="_blank" rel="noreferrer noopener">
                  <SteamLogo size={18} weight="bold" aria-hidden="true" /> Steam
                </a>
              )}
              {bgg && (
                <a className="btn btn-ghost" href={bgg.url} target="_blank" rel="noreferrer noopener">
                  <ArrowSquareOut size={18} weight="bold" aria-hidden="true" /> BoardGameGeek
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <nav className="subnav" aria-label="Game sections">
        <div className="container subnav-inner">
          {subnav.map(([id, label, count]) => (
            <a key={id} href={`#${id}`}>
              {label}
              {count != null && <span className="count">{count}</span>}
            </a>
          ))}
        </div>
      </nav>

      <div className="container page">
        <div className="game-layout">
          <div style={{ minWidth: 0 }}>
            <section id="overview">
              <SectionHead index={sectionIndex('overview')} kicker="Overview" title="About the game" />
              {game.description && <p className="game-desc">{game.description}</p>}
              {totalMembers > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="label">
                      <Users size={12} weight="bold" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
                      {totalMembers} {totalMembers === 1 ? 'player' : 'players'} tracking
                    </span>
                  </div>
                  <div className="dist-bar" role="img" aria-label="Status distribution">
                    {game.statuses.map((s) =>
                      stats[s] ? <span key={s} style={{ width: `${(stats[s] / totalMembers) * 100}%`, background: STATUS[s].color }} /> : null
                    )}
                  </div>
                  <div className="legend">
                    {game.statuses.map((s) => (
                      <span key={s}>
                        <i style={{ background: STATUS[s].color }} />
                        {STATUS[s].label}: <strong style={{ color: 'var(--text)' }}>{stats[s] ?? 0}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {showPatches && (
              <section id="patch-notes" className="section">
                <SectionHead
                  index={sectionIndex('patch-notes')}
                  kicker="Updates"
                  title="Patch notes"
                  link={
                    steam?.checkedAt && <span className="label">Checked {timeAgo(steam.checkedAt)}</span>
                  }
                />
                <PatchNotes slug={game.slug} updates={updates} steam={steam} />
              </section>
            )}

            {dlc && (
              <section id="dlc" className="section">
                <SectionHead
                  index={sectionIndex('dlc')}
                  kicker="Add-ons"
                  title="DLC"
                  link={store?.checkedAt && <span className="label">Prices checked {timeAgo(store.checkedAt)}</span>}
                />
                <DlcList dlc={dlc} steam={steam} />
              </section>
            )}

            {expansions && (
              <section id="expansions" className="section">
                <SectionHead
                  index={sectionIndex('expansions')}
                  kicker="Add-ons"
                  title="Expansions"
                  link={
                    bgg && (
                      <a className="link-btn muted" href={bgg.url} target="_blank" rel="noreferrer noopener">
                        BoardGameGeek <ArrowSquareOut size={12} aria-hidden="true" />
                      </a>
                    )
                  }
                />
                <ExpansionList expansions={expansions} title={game.title} />
              </section>
            )}

            <section id="wiki" className="section">
              <SectionHead
                index={sectionIndex('wiki')}
                kicker="Grimoire"
                title="Wiki"
                link={fandom && <FandomMark sitename={fandom.sitename} />}
              />
              {fandomReq.loading && game.fandom_wiki ? (
                <div className="skeleton" style={{ height: 260 }} />
              ) : fandom ? (
                <FandomOverview slug={game.slug} fandom={fandom} />
              ) : fandomReq.error && game.fandom_wiki ? (
                <p className="callout">The Fandom wiki couldn’t be reached right now. The quick guides below are still available.</p>
              ) : null}
              {sections.length > 0 && (fandom || (fandomReq.error && game.fandom_wiki)) && (
                <div className="row" style={{ justifyContent: 'space-between', margin: '40px 0 14px' }}>
                  <span className="label">Grimoire quick guides · {sections.length}</span>
                  <span className="label">Written for TheGamingGrimoire</span>
                </div>
              )}
              <div className="wiki-list">
                {sections.map((s, i) => (
                  <Link key={s.slug} to={`/game/${game.slug}/${s.slug}`} className="wiki-item">
                    <span className="wiki-num">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>
                        <SectionIcon name={s.icon} size={18} />
                        {s.title}
                      </h3>
                      {s.summary && <p>{s.summary}</p>}
                      {s.term_count > 0 && <span className="chip chip-gold">{s.term_count} entries</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section id="reviews" className="section">
              <SectionHead
                index={sectionIndex('reviews')}
                kicker="Verdicts"
                title="Reviews"
              />
              <GameReviews game={game} signedIn={Boolean(session?.user)} onChange={setReviewSummary} />
            </section>

            <section id="discussions" className="section">
              <SectionHead
                index={sectionIndex('discussions')}
                kicker="Community"
                title="Discussions"
                link={
                  <Link to={`/forums/new?game=${game.slug}`} className="btn btn-sm btn-gold">
                    <Plus size={14} weight="bold" aria-hidden="true" /> New thread
                  </Link>
                }
              />
              <ThreadList query={`?game=${game.slug}`} hideGame emptyText={`No discussions about ${game.title} yet`} />
            </section>
          </div>

          <aside className="game-aside">
            {store && <PriceCard store={store} steam={steam} />}
            {showPatches && steam && <VersionCard steam={steam} latest={updates[0]} />}

            {hltb && (
              <div>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="label">
                    <Clock size={12} weight="bold" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
                    How long to beat
                  </span>
                  {hltb.found && (
                    <a className="link-btn muted" href={hltb.url} target="_blank" rel="noreferrer noopener">
                      HLTB <ArrowSquareOut size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
                {hltb.found ? (
                  <div className="stat-blocks">
                    {[
                      [hltb.main, 'Main'],
                      [hltb.extra, 'Extras'],
                      [hltb.complete, '100%'],
                    ].map(([v, l]) => (
                      <div className="stat-block" key={l}>
                        <strong>{hours(v)}</strong>
                        <span className="label">{l}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small text-2">No HowLongToBeat entry was found for this game yet.</p>
                )}
              </div>
            )}

            <div className="panel frame">
              <div className="panel-title">
                <h2>
                  <Info size={16} weight="bold" aria-hidden="true" /> Details
                </h2>
              </div>
              <dl className="facts">
                {facts.map(([k, v]) => (
                  <div className="fact" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {editing && (
        <LibraryEditor
          game={game}
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setEditing(false);
            setData((d) => ({ ...d, entry: saved }));
            reload();
          }}
        />
      )}
    </>
  );
}

const shortDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function Price({ price, isFree, big }) {
  if (isFree) return <span className={big ? 'price-num' : 'price'}>Free</span>;
  if (!price) return <span className="price muted">No price listed</span>;
  return (
    <span className={big ? 'price-num' : 'price'}>
      {price.discount > 0 && <s className="price-was">{money(price.initial, price.currency)}</s>}
      {money(price.final, price.currency)}
    </span>
  );
}

function PriceCard({ store, steam }) {
  const sale = store.price?.discount > 0;
  return (
    <div className={`price-card ${sale ? 'on-sale' : ''}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="label">
          <Tag size={12} weight="bold" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
          {sale ? 'On sale' : 'Price on Steam'}
        </span>
        {sale && <span className="chip chip-sale">−{store.price.discount}%</span>}
      </div>
      <Price price={store.price} isFree={store.isFree} big />
      {!store.isFree && !store.price && <p className="small text-2">Steam doesn’t list a price for this game right now.</p>}
      <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <span className="xs text-3">Checked {timeAgo(store.checkedAt)}. Steam sales are re-checked every few hours.</span>
        <a className="link-btn muted" href={steam.storeUrl} target="_blank" rel="noreferrer noopener" style={{ flexShrink: 0 }}>
          Store <ArrowSquareOut size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

const DLC_KINDS = { music: 'Soundtrack', video: 'Video', dlc: null };
const ADDONS_SHOWN = 6;

function DlcList({ dlc, steam }) {
  const [all, setAll] = useState(false);
  if (!steam) {
    return (
      <Empty icon={PuzzlePiece} title="Not on Steam">
        This game isn’t sold on Steam, so its DLC can’t be synced automatically.
      </Empty>
    );
  }
  if (!dlc.length) {
    return (
      <Empty icon={PuzzlePiece} title="No DLC">
        Steam doesn’t list any DLC for this game. New DLC shows up here automatically.
      </Empty>
    );
  }
  const shown = all ? dlc : dlc.slice(0, ADDONS_SHOWN);
  return (
    <>
      <div className="addon-grid">
        {shown.map((d) => (
          <a key={d.appid} className="addon" href={d.url} target="_blank" rel="noreferrer noopener">
            <div className="addon-art wide">{d.header_url ? <img src={d.header_url} alt="" loading="lazy" /> : <PuzzlePiece size={32} weight="thin" aria-hidden="true" />}</div>
            <div className="addon-body">
              <div className="row wrap" style={{ gap: 6 }}>
                {d.coming_soon ? (
                  <span className="chip chip-solid">Coming soon</span>
                ) : (
                  d.released_on && isRecent(d.released_on, 60) && <span className="chip chip-solid">New</span>
                )}
                {DLC_KINDS[d.kind] !== null && <span className="chip">{DLC_KINDS[d.kind] ?? d.kind}</span>}
                {d.price?.discount > 0 && <span className="chip chip-sale">−{d.price.discount}%</span>}
              </div>
              <h3 className="addon-title">{d.name}</h3>
              {d.description && <p className="addon-desc">{d.description}</p>}
              <div className="addon-foot">
                <span className="label">{d.released_on ? shortDate(d.released_on) : d.release_date || 'Release date TBA'}</span>
                <Price price={d.price} isFree={d.is_free} />
              </div>
            </div>
          </a>
        ))}
      </div>
      {dlc.length > ADDONS_SHOWN && (
        <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show all ${dlc.length} DLC`}
        </button>
      )}
    </>
  );
}

function ExpansionList({ expansions, title }) {
  const [all, setAll] = useState(false);
  if (!expansions.length) {
    return (
      <Empty icon={PuzzlePiece} title="No expansions listed">
        No expansions for {title} have been added yet.
      </Empty>
    );
  }
  const shown = all ? expansions : expansions.slice(0, ADDONS_SHOWN);
  return (
    <>
      <div className="addon-grid">
        {shown.map((e) => {
          const El = e.url ? 'a' : 'div';
          return (
            <El key={`${e.source}-${e.bgg_id ?? e.name}`} className="addon" {...(e.url ? { href: e.url, target: '_blank', rel: 'noreferrer noopener' } : {})}>
              <div className="addon-art">{e.image_url ? <img src={e.image_url} alt="" loading="lazy" /> : <PuzzlePiece size={32} weight="thin" aria-hidden="true" />}</div>
              <div className="addon-body">
                <h3 className="addon-title">{e.name}</h3>
                {e.description && <p className="addon-desc">{e.description}</p>}
                <div className="addon-foot">
                  <span className="label">{e.year ?? ''}</span>
                  {e.url && (
                    <span className="link-btn muted">
                      {e.source === 'bgg' || /boardgamegeek\.com/.test(e.url) ? 'BGG' : 'Details'} <ArrowSquareOut size={12} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            </El>
          );
        })}
      </div>
      {expansions.length > ADDONS_SHOWN && (
        <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show all ${expansions.length} expansions`}
        </button>
      )}
    </>
  );
}

function VersionCard({ steam, latest }) {
  return (
    <div className="version-card">
      <div className="hazard" />
      <span className="label">
        <GitCommit size={12} weight="bold" style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
        Current version
      </span>
      {steam.currentVersion ? (
        <div className="version-num">v{steam.currentVersion}</div>
      ) : latest ? (
        <div className="version-num as-text">{latest.title}</div>
      ) : (
        <div className="version-num as-text">No updates posted yet</div>
      )}
      <div className="stack" style={{ gap: 6 }}>
        {steam.lastUpdateAt && (
          <span className="small text-2">
            Last updated <strong style={{ color: 'var(--text)' }}>{new Date(steam.lastUpdateAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>{' '}
            ({timeAgo(steam.lastUpdateAt)})
          </span>
        )}
        <span className="xs text-3">Synced from Steam automatically.</span>
      </div>
    </div>
  );
}

function PatchNotes({ slug, updates, steam }) {
  const [open, setOpen] = useState(null);
  const [bodies, setBodies] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  async function toggle(id) {
    if (open === id) return setOpen(null);
    setOpen(id);
    if (!bodies[id]) {
      setLoadingId(id);
      try {
        const { update } = await api(`/games/${slug}/updates/${id}`);
        setBodies((b) => ({ ...b, [id]: update.content || '_This post has no text._' }));
      } catch {
        setBodies((b) => ({ ...b, [id]: '_Could not load these patch notes. Try again later._' }));
      } finally {
        setLoadingId(null);
      }
    }
  }

  if (!steam) {
    return (
      <Empty icon={GitCommit} title="Not on Steam">
        This game isn’t sold on Steam, so its patch notes can’t be synced automatically.
      </Empty>
    );
  }
  if (!updates.length) {
    return (
      <Empty icon={GitCommit} title="No patch notes yet">
        The developer hasn’t posted patch notes on Steam recently. We check for new ones every 30 minutes.
      </Empty>
    );
  }

  return (
    <div className="timeline">
      {updates.map((u, i) => (
        <article key={u.id} className={`patch ${i === 0 ? 'latest' : ''}`}>
          <div className="patch-head">
            {u.version && <span className="chip chip-gold">v{u.version}</span>}
            {i === 0 && <span className="chip chip-solid">Latest</span>}
            {i !== 0 && isRecent(u.published_at) && <span className="chip chip-gold">New</span>}
            <time className="label" dateTime={u.published_at}>
              {new Date(u.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </time>
          </div>
          <h3 className="patch-title">{u.title}</h3>
          {open !== u.id && u.excerpt && <p className="patch-excerpt">{u.excerpt}</p>}
          <div className="patch-actions">
            <button className="link-btn" onClick={() => toggle(u.id)} aria-expanded={open === u.id}>
              {open === u.id ? (
                <>
                  Hide notes <CaretUp size={12} weight="bold" aria-hidden="true" />
                </>
              ) : (
                <>
                  Read notes <CaretDown size={12} weight="bold" aria-hidden="true" />
                </>
              )}
            </button>
            {u.url && (
              <a className="link-btn muted" href={u.url} target="_blank" rel="noreferrer noopener">
                Open on Steam <ArrowSquareOut size={12} aria-hidden="true" />
              </a>
            )}
          </div>
          {open === u.id && (
            <div className="patch-body">
              {loadingId === u.id ? <Spinner /> : <Markdown>{bodies[u.id]}</Markdown>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
