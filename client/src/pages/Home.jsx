import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookBookmark,
  ChatsCircle,
  Clock,
  ClockCounterClockwise,
  GitCommit,
  Play,
  UserPlus,
  UsersThree,
  Wrench,
} from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, displayName, timeAgo } from '../lib/format.js';
import { STATUS } from '../lib/statuses.js';
import SearchBox from '../components/SearchBox.jsx';
import GameCard, { GameGridSkeleton } from '../components/GameCard.jsx';
import GameArt from '../components/GameArt.jsx';
import Avatar from '../components/Avatar.jsx';
import { isRecent } from '../components/Badges.jsx';
import { Embers, PixelMatrix } from '../components/Effects.jsx';
import { Empty, Spinner } from '../components/Common.jsx';

export default function Home() {
  const { data: session, isPending } = useSession();
  if (isPending) {
    return (
      <div className="center-page">
        <Spinner />
      </div>
    );
  }
  return session?.user ? <Feed user={session.user} /> : <Landing />;
}

export function SectionHead({ index, kicker, title, link }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">
          <b>{index}</b> <i>/</i> {kicker}
        </span>
        <h2 className="section-title">{title}</h2>
      </div>
      {link}
    </div>
  );
}

// Three drifting rows of capsule art behind the hero.
export function CapsuleWall({ games }) {
  const rows = useMemo(() => {
    const withArt = games.filter((g) => g.capsule_url);
    const pool = withArt.length >= 6 ? withArt : games;
    if (!pool.length) return [];
    return [0, 1, 2].map((r) => {
      const shifted = [...pool.slice(r * 3), ...pool.slice(0, r * 3)];
      const row = [];
      while (row.length < 14) row.push(...shifted);
      return row.slice(0, 14);
    });
  }, [games]);
  return (
    <div className="hero-wall" aria-hidden="true">
      {rows.map((row, i) => (
        <div className="hero-wall-row" key={i}>
          {[...row, ...row].map((g, j) => (
            <GameArt key={`${g.slug}-${j}`} game={g} eager={i === 0 && j < 8} />
          ))}
        </div>
      ))}
    </div>
  );
}

const REALM_COPY = {
  video: 'Guides, builds, completion times, and live patch notes and versions straight from Steam.',
  board: 'Rules, setup and strategy for family classics and campaign crawlers.',
  card: 'How to play, formats, deckbuilding and complete keyword glossaries.',
};

function Realms({ games, counts }) {
  return (
    <div className="realm-grid">
      {Object.entries(CATEGORIES).map(([key, c], i) => {
        const art = games.filter((g) => g.category === key).sort((a, b) => Boolean(b.capsule_url) - Boolean(a.capsule_url)).slice(0, 3);
        return (
          <Link key={key} to={c.path} className="realm" style={{ '--accent': c.color }}>
            <div className="realm-art" aria-hidden="true">
              {art.map((g) => (
                <GameArt key={g.slug} game={g} />
              ))}
            </div>
            <span className="label realm-index">0{i + 1} / Realm</span>
            <h3 className="display">{c.label}</h3>
            <p>{REALM_COPY[key]}</p>
            <span className="realm-cta label" style={{ color: c.color }}>
              {counts?.[key] ?? '—'} entries <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function Landing() {
  const stats = useApi('/games/stats');
  const all = useApi('/games');
  const s = stats.data;
  const games = all.data?.games ?? [];
  const featured = games.filter((g) => g.featured);

  return (
    <>
      <section className="hero">
        <CapsuleWall games={games} />
        <div className="hero-shade" />
        <Embers />
        <div className="container hero-inner">
          <span className="eyebrow">
            <b>00</b> <i>/</i> Video · Board · Card games
          </span>
          <h1 className="display hero-title">
            Every game.
            <span className="hl">One grimoire.</span>
          </h1>
          <p className="hero-sub">
            Rules, keywords, guides and live patch notes for the games you play. Track your library and see what your
            friends are playing right now.
          </p>
          <div className="hero-search">
            <SearchBox size="lg" placeholder="Search a game, rule or keyword…" />
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{s ? s.counts.video + s.counts.board + s.counts.card : '—'}</strong>
              <span className="label">Games</span>
            </div>
            <div className="hero-stat">
              <strong>{s?.pages ?? '—'}</strong>
              <span className="label">Wiki pages</span>
            </div>
            <div className="hero-stat">
              <strong>{s?.terms ?? '—'}</strong>
              <span className="label">Keywords & terms</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <SectionHead index="01" kicker="Choose your realm" title="Browse the wiki" />
          <Realms games={games} counts={s?.counts} />
        </section>

        <section className="section">
          <SectionHead
            index="02"
            kicker="Featured"
            title="Most-read entries"
            link={
              <Link to="/video-games" className="section-link">
                All games <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </Link>
            }
          />
          {all.loading ? (
            <GameGridSkeleton count={6} />
          ) : (
            <div className="capsule-grid">
              {featured.map((g, i) => (
                <GameCard key={g.slug} game={g} style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="section">
        <div className="pixel-edge" style={{ '--c': 'var(--panel)' }} />
        <div className="strip">
          <div className="container">
            <div className="features">
              {[
                [BookBookmark, '01', 'A wiki for every table', 'How-to-play guides, formats, deckbuilding and searchable keyword glossaries.'],
                [Wrench, '02', 'Live patch notes', 'Current versions and update notes pulled from Steam, refreshed automatically.'],
                [Clock, '03', 'How long to beat', 'Main story, extras and completionist times for every finite video game.'],
                [UsersThree, '04', 'Play together', 'Track your library, add friends and follow what they’re playing.'],
              ].map(([Icon, n, title, copy]) => (
                <div className="feature" key={n}>
                  <span className="label label-gold">{n}</span>
                  <Icon size={30} weight="bold" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pixel-edge flip" style={{ '--c': 'var(--panel)' }} />
      </section>

      <div className="container">
        <section className="section cta-band frame">
          <div>
            <span className="eyebrow">
              <b>03</b> <i>/</i> Press start
            </span>
            <h2 className="display">Your library. Your party. Your notes.</h2>
            <p className="text-2" style={{ maxWidth: 480, marginBottom: 28 }}>
              Create a free account to track what you’re playing, get patch notes for your games on your home feed, and
              join the discussion.
            </p>
            <div className="row wrap">
              <Link to="/signup" className="btn btn-gold btn-lg">
                Create account
              </Link>
              <Link to="/login" className="btn btn-lg btn-ghost">
                Sign in
              </Link>
            </div>
          </div>
          <div className="matrix-wrap">
            <PixelMatrix />
            <div className="fig-caption">
              <span className="label">Fig. 01</span>
              <span className="label">12 × 12 · Lit by noise</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export function ActivityText({ item, showActor = true }) {
  const actor = showActor ? (
    <>
      <Link to={`/u/${item.actor.username}`}>{displayName(item.actor)}</Link>{' '}
    </>
  ) : null;
  const game = item.game ? <Link to={`/game/${item.game.slug}`}>{item.game.title}</Link> : null;
  switch (item.type) {
    case 'status':
      return (
        <>
          {actor}
          {STATUS[item.status]?.verb ?? 'updated'} {game}
        </>
      );
    case 'thread':
      return (
        <>
          {actor}started a discussion: <Link to={`/forums/${item.thread?.id}`}>{item.thread?.title}</Link>
          {game && <> in {game}</>}
        </>
      );
    case 'reply':
      return (
        <>
          {actor}replied to <Link to={`/forums/${item.thread?.id}`}>{item.thread?.title}</Link>
        </>
      );
    case 'friend':
      return (
        <>
          {actor}became friends with{' '}
          {item.friend ? <Link to={`/u/${item.friend.username}`}>{displayName(item.friend)}</Link> : 'someone'}
        </>
      );
    default:
      return null;
  }
}

export function ActivityList({ items }) {
  return (
    <div>
      {items.map((a) => (
        <div key={a.id} className="activity-item">
          {a.game ? <GameArt game={a.game} className="activity-thumb" showTitle={false} /> : <Avatar user={a.actor} size={34} />}
          <div className="activity-body">
            <ActivityText item={a} />
            <div className="activity-time">{timeAgo(a.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Feed({ user }) {
  const feed = useApi('/feed');
  const f = feed.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const backdrop = f?.nowPlaying.find((g) => g.hero_url)?.hero_url;

  return (
    <>
      <section className="welcome">
        {backdrop && (
          <div className="backdrop-art" aria-hidden="true">
            <img src={backdrop} alt="" />
          </div>
        )}
        <div className="container welcome-inner">
          <span className="eyebrow">
            <b>00</b> <i>/</i> {greeting}
          </span>
          <h1 className="display">{user.name?.split(' ')[0] || user.username}</h1>
          <div style={{ maxWidth: 640 }}>
            <SearchBox size="lg" />
          </div>
          {f?.pendingRequests > 0 && (
            <Link to="/community" className="callout callout-gold" style={{ marginTop: 20, maxWidth: 640 }}>
              <UserPlus size={18} weight="bold" aria-hidden="true" />
              You have {f.pendingRequests} pending friend request{f.pendingRequests > 1 ? 's' : ''}.
            </Link>
          )}
        </div>
      </section>

      <div className="container page">
        <div className="dashboard">
          <div style={{ minWidth: 0 }}>
            <section>
              <SectionHead
                index="01"
                kicker="In progress"
                title="Currently playing"
                link={
                  <Link to={`/u/${user.username}?tab=library`} className="section-link">
                    Library <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Link>
                }
              />
              {feed.loading ? (
                <div className="skeleton" style={{ height: 300 }} />
              ) : f?.nowPlaying.length ? (
                <div className="capsule-row">
                  {f.nowPlaying.map((g) => (
                    <GameCard key={g.slug} game={g} status={g.status} />
                  ))}
                </div>
              ) : (
                <Empty icon={Play} title="Nothing in progress">
                  Mark a game as Playing or Actively Playing and it shows up here.
                </Empty>
              )}
            </section>

            <section className="section" style={{ marginTop: 56 }}>
              <SectionHead index="02" kicker="History" title="Recently visited" />
              {feed.loading ? (
                <div className="skeleton" style={{ height: 300 }} />
              ) : f?.recentlyViewed.length ? (
                <div className="capsule-row">
                  {f.recentlyViewed.map((g) => (
                    <GameCard key={g.slug} game={g} />
                  ))}
                </div>
              ) : (
                <Empty icon={ClockCounterClockwise} title="No history yet">
                  Games you open appear here so you can jump back into their wiki.
                </Empty>
              )}
            </section>

            <section className="section" style={{ marginTop: 56 }}>
              <SectionHead
                index="03"
                kicker="Your party"
                title="Friend activity"
                link={
                  <Link to="/community" className="section-link">
                    Find friends <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Link>
                }
              />
              <div className="panel frame">
                {feed.loading ? (
                  <Spinner />
                ) : f?.friendActivity.length ? (
                  <ActivityList items={f.friendActivity} />
                ) : (
                  <Empty
                    icon={UsersThree}
                    title="It's quiet in here"
                    action={
                      <Link to="/community" className="btn btn-sm btn-gold">
                        Search for friends
                      </Link>
                    }
                  >
                    Add friends to see what they’re playing and discussing.
                  </Empty>
                )}
              </div>
            </section>
          </div>

          <aside className="stack" style={{ gap: 20 }}>
            <div className="panel">
              <div className="panel-title">
                <h2>
                  <GitCommit size={16} weight="bold" aria-hidden="true" /> Patch notes for your games
                </h2>
              </div>
              {f?.libraryUpdates.length ? (
                f.libraryUpdates.map((u) => (
                  <Link key={u.id} to={`/game/${u.slug}#patch-notes`} className="list-row">
                    <GameArt game={{ ...u, title: u.game_title }} showTitle={false} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small" style={{ fontWeight: 600 }}>
                        {u.game_title}
                      </div>
                      <div className="xs text-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.version ? `v${u.version} · ` : ''}
                        {u.title}
                      </div>
                      <div className="activity-time">
                        {isRecent(u.published_at) && <span className="gold">New · </span>}
                        {timeAgo(u.published_at)}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="small text-2">
                  Add Steam video games to your library and their latest updates will appear here.
                </p>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">
                <h2>
                  <Play size={16} weight="bold" aria-hidden="true" /> Friends are playing
                </h2>
              </div>
              {f?.friendsPlaying.length ? (
                f.friendsPlaying.map((g) => (
                  <Link key={g.slug} to={`/game/${g.slug}`} className="list-row">
                    <GameArt game={g} showTitle={false} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small" style={{ fontWeight: 600 }}>
                        {g.title}
                      </div>
                      <div className="xs text-2">
                        {g.players
                          .slice(0, 2)
                          .map((p) => displayName(p))
                          .join(', ')}
                        {g.players.length > 2 && ` +${g.players.length - 2}`}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="small text-2">When friends start playing games, they’ll show up here.</p>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">
                <h2>
                  <ChatsCircle size={16} weight="bold" aria-hidden="true" /> Latest discussions
                </h2>
              </div>
              {f?.recentThreads.length ? (
                f.recentThreads.map((t) => (
                  <Link key={t.id} to={`/forums/${t.id}`} className="list-row" style={{ display: 'block' }}>
                    <div className="small" style={{ fontWeight: 600 }}>
                      {t.title}
                    </div>
                    <div className="activity-time">
                      {t.game_title || 'General'} · {t.reply_count} replies · {timeAgo(t.last_post_at)}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="small text-2">No discussions yet. Start the first one.</p>
              )}
              <Link to="/forums/new" className="btn btn-sm btn-block" style={{ marginTop: 14 }}>
                Start a discussion
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

