import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Books,
  ChatsCircle,
  ClockCounterClockwise,
  GitCommit,
  Heart,
  List,
  MagnifyingGlass,
  Play,
  Pulse,
  SquaresFour,
  Star,
  UserPlus,
  UsersThree,
} from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, displayName, hours, timeAgo } from '../lib/format.js';
import { FINITE_STATUSES, ONGOING_STATUSES, STATUS } from '../lib/statuses.js';
import Avatar from '../components/Avatar.jsx';
import FriendButton from '../components/FriendButton.jsx';
import GameArt from '../components/GameArt.jsx';
import GameCard from '../components/GameCard.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { ProfileReviewCard } from '../components/Reviews.jsx';
import { CategoryChip, LiveChip, StatusBadge, isRecent } from '../components/Badges.jsx';
import { Empty, ErrorState, Spinner } from '../components/Common.jsx';
import { ActivityList, SectionHead } from './Home.jsx';

const TABS = ['overview', 'library', 'reviews'];

export default function Profile() {
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const { data: session } = useSession();
  // Known before the profile loads, so the dashboard feed can load in parallel.
  const viewingSelf = session?.user?.username?.toLowerCase() === username.toLowerCase();
  const profile = useApi(`/users/${username}`);
  const library = useApi(`/users/${username}/library`);
  const feed = useApi(viewingSelf ? '/feed' : null);
  const reviews = useApi(tab === 'reviews' ? `/users/${username}/reviews` : null);

  if (profile.loading && !profile.data) {
    return (
      <div className="center-page">
        <Spinner />
      </div>
    );
  }
  if (profile.error) {
    return (
      <div className="page container">
        <ErrorState error={profile.error} />
      </div>
    );
  }

  const { user, relationship, statusCounts, nowPlaying, activity, friendCount, reviewCount } = profile.data;
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const isSelf = relationship.state === 'self';
  const f = isSelf ? feed.data : null;
  const backdrop = (f?.nowPlaying ?? nowPlaying).find((g) => g.hero_url)?.hero_url;
  const favorites = library.data?.entries.filter((e) => e.favorite) ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const setTab = (t) => setParams(t === 'overview' ? {} : { tab: t });

  return (
    <>
      <section className="profile-hero">
        {backdrop && (
          <div className="backdrop-art" aria-hidden="true">
            <img src={backdrop} alt="" />
          </div>
        )}
        <div className="container profile-inner">
          <div className="profile-id">
            <Avatar user={user} size={88} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="eyebrow">
                <b>@{user.username}</b> <i>/</i>{' '}
                {isSelf
                  ? greeting
                  : `Joined ${new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}
              </span>
              <h1 className="display profile-name">{displayName(user)}</h1>
              {user.bio && <p className="text-2">{user.bio}</p>}
            </div>
            {!isSelf && relationship.state !== 'anonymous' && (
              <FriendButton
                username={user.username}
                relationship={relationship}
                onChange={(rel) => profile.setData((d) => ({ ...d, relationship: rel }))}
              />
            )}
          </div>

          <StatBar statusCounts={statusCounts} total={total} reviewCount={reviewCount} friendCount={friendCount} />

          {isSelf && (
            <div className="profile-search">
              <SearchBox size="lg" />
              {f?.pendingRequests > 0 && (
                <Link to="/community" className="callout callout-gold" style={{ marginTop: 16 }}>
                  <UserPlus size={18} weight="bold" aria-hidden="true" />
                  You have {f.pendingRequests} pending friend request{f.pendingRequests > 1 ? 's' : ''}.
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="container page">
        <div className="tabs" role="tablist">
          <button role="tab" className="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>
            <Pulse size={16} weight="bold" aria-hidden="true" /> Overview
          </button>
          <button role="tab" className="tab" aria-selected={tab === 'library'} onClick={() => setTab('library')}>
            <Books size={16} weight="bold" aria-hidden="true" /> Library <span className="count">{total}</span>
          </button>
          <button role="tab" className="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')}>
            <Star size={16} weight="bold" aria-hidden="true" /> Reviews <span className="count">{reviewCount}</span>
          </button>
        </div>

        {tab === 'overview' ? (
          isSelf ? (
            <Dashboard user={user} feed={feed} favorites={favorites} favoritesLoading={library.loading} />
          ) : (
            <PublicOverview nowPlaying={nowPlaying} activity={activity} favorites={favorites} favoritesLoading={library.loading} />
          )
        ) : tab === 'library' ? (
          <Library entries={library.data?.entries} loading={library.loading} isSelf={isSelf} />
        ) : (
          <ReviewsTab reviews={reviews} isSelf={isSelf} name={displayName(user)} />
        )}
      </div>
    </>
  );
}

// One horizontal row of library totals. Ongoing statuses fold into their closest finite match.
function StatBar({ statusCounts: c, total, reviewCount, friendCount }) {
  const n = (...keys) => keys.reduce((sum, k) => sum + (c[k] ?? 0), 0);
  const stats = [
    [total, 'Games', 'var(--text)'],
    [n('playing', 'active'), 'Playing', STATUS.playing.color],
    [n('completed'), 'Completed', STATUS.completed.color],
    [n('want_to_play'), 'Plan to play', STATUS.want_to_play.color],
    [n('on_hold', 'on_break'), 'On hold', STATUS.on_hold.color],
    [n('dropped', 'not_playing'), 'Dropped', STATUS.dropped.color],
    [reviewCount, reviewCount === 1 ? 'Review' : 'Reviews', 'var(--gold)'],
    [friendCount, friendCount === 1 ? 'Friend' : 'Friends', 'var(--text-3)'],
  ];
  return (
    <div className="profile-statbar">
      {stats.map(([value, label, color]) => (
        <div key={label} className="profile-stat" style={{ '--stat-c': color }}>
          <strong>{value}</strong>
          <span className="label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Favorites({ favorites, loading, isSelf }) {
  if (loading && !favorites.length) return <div className="skeleton" style={{ height: 300 }} />;
  if (!favorites.length) {
    return (
      <Empty icon={Heart} title="No favorites yet">
        {isSelf ? 'Mark a game as a favorite in its library entry and it shows up here.' : null}
      </Empty>
    );
  }
  return (
    <div className="capsule-row">
      {favorites.map((g) => (
        <GameCard key={g.slug} game={g} status={g.status} />
      ))}
    </div>
  );
}

// The signed-in user's own overview: what used to be the home feed.
function Dashboard({ user, feed, favorites, favoritesLoading }) {
  const f = feed.data;
  const pending = feed.loading && !f;
  return (
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
          {pending ? (
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
          {pending ? (
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
            {pending ? (
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

        <section className="section" style={{ marginTop: 56 }}>
          <SectionHead index="04" kicker="Hall of fame" title="Favorite games" />
          <Favorites favorites={favorites} loading={favoritesLoading} isSelf />
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
            <p className="small text-2">Add Steam video games to your library and their latest updates will appear here.</p>
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
  );
}

function PublicOverview({ nowPlaying, activity, favorites, favoritesLoading }) {
  return (
    <div className="dashboard">
      <div style={{ minWidth: 0 }}>
        <section>
          <SectionHead index="01" kicker="In progress" title="Currently playing" />
          {nowPlaying.length ? (
            <div className="capsule-row">
              {nowPlaying.map((g) => (
                <GameCard key={g.slug} game={g} status={g.status} />
              ))}
            </div>
          ) : (
            <Empty icon={Play} title="Not playing anything right now" />
          )}
        </section>
        <section className="section" style={{ marginTop: 56 }}>
          <SectionHead index="02" kicker="Hall of fame" title="Favorite games" />
          <Favorites favorites={favorites} loading={favoritesLoading} />
        </section>
      </div>
      <aside className="panel frame" style={{ alignSelf: 'start' }}>
        <div className="panel-title">
          <h2>
            <Pulse size={16} weight="bold" aria-hidden="true" /> Recent activity
          </h2>
        </div>
        {activity.length ? <ActivityList items={activity} /> : <p className="small text-2">No activity yet.</p>}
      </aside>
    </div>
  );
}

function ReviewsTab({ reviews, isSelf, name }) {
  const list = reviews.data?.reviews;
  if (reviews.loading && !list) return <Spinner />;
  if (reviews.error) return <ErrorState error={reviews.error} onRetry={reviews.reload} />;
  if (!list?.length) {
    return (
      <Empty
        icon={Star}
        title={isSelf ? 'You haven’t reviewed anything yet' : `${name} hasn’t posted any reviews`}
        action={
          isSelf && (
            <Link to="/video-games" className="btn btn-gold btn-sm">
              Find a game to review
            </Link>
          )
        }
      >
        {isSelf ? 'Open any game and choose “Write a review” to score it out of 10.' : null}
      </Empty>
    );
  }
  return (
    <div className="review-list">
      {list.map((r) => (
        <ProfileReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}

const ALL_STATUSES = [...new Set([...FINITE_STATUSES, ...ONGOING_STATUSES])];

function Library({ entries, loading, isSelf }) {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem('tgg-library-view') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem('tgg-library-view', v);
    } catch {}
  };

  const counts = useMemo(() => {
    const c = {};
    for (const e of entries ?? []) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [entries]);

  if (loading && !entries) return <Spinner />;
  if (!entries?.length) {
    return (
      <Empty
        icon={Books}
        title={isSelf ? 'Your library is empty' : 'This library is empty'}
        action={
          isSelf && (
            <Link to="/video-games" className="btn btn-gold btn-sm">
              Browse games
            </Link>
          )
        }
      >
        {isSelf ? 'Open any game and choose “Add to library” to start tracking it.' : null}
      </Empty>
    );
  }

  const needle = q.trim().toLowerCase();
  const visible = entries.filter(
    (e) => (!status || e.status === status) && (!category || e.category === category) && (!needle || e.title.toLowerCase().includes(needle))
  );

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <div className="search-field">
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <input
              className="search-input"
              type="search"
              placeholder="Find a game in this library…"
              aria-label="Find a game in this library"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <option key={k} value={k}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="view-toggle" role="group" aria-label="View">
          <button aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => changeView('grid')}>
            <SquaresFour size={18} weight="bold" />
          </button>
          <button aria-pressed={view === 'list'} aria-label="List view" onClick={() => changeView('list')}>
            <List size={18} weight="bold" />
          </button>
        </div>
      </div>
      <div className="chip-row" role="group" aria-label="Filter by status">
        <button className="filter-chip" aria-pressed={!status} onClick={() => setStatus('')}>
          All · {entries.length}
        </button>
        {ALL_STATUSES.filter((s) => counts[s]).map((s) => (
          <button key={s} className="filter-chip" aria-pressed={status === s} onClick={() => setStatus(status === s ? '' : s)}>
            <span style={{ width: 7, height: 7, background: STATUS[s].color }} aria-hidden="true" />
            {STATUS[s].label} · {counts[s]}
          </button>
        ))}
      </div>

      {!visible.length ? (
        <Empty icon={MagnifyingGlass} title="No games match these filters" />
      ) : view === 'grid' ? (
        <div className="capsule-grid">
          {visible.map((e) => (
            <GameCard key={e.slug} game={e} status={e.status} />
          ))}
        </div>
      ) : (
        <div className="lib-list">
          {visible.map((e) => (
            <div key={e.slug} className="lib-row">
              <Link to={`/game/${e.slug}`} aria-hidden="true" tabIndex={-1}>
                <GameArt game={e} showTitle={false} />
              </Link>
              <div style={{ minWidth: 0 }}>
                <Link to={`/game/${e.slug}`} style={{ fontWeight: 650 }}>
                  {e.favorite && (
                    <Heart size={14} weight="fill" color="var(--ember)" style={{ display: 'inline', marginRight: 6, verticalAlign: '-1px' }} aria-label="Favorite" />
                  )}
                  {e.title}
                </Link>
                <div className="lib-row-meta">
                  <StatusBadge status={e.status} />
                  <CategoryChip category={e.category} />
                  {e.is_continuous && <LiveChip />}
                  {e.current_version && <span className="chip chip-gold">v{e.current_version}</span>}
                </div>
                {isSelf && e.notes && (
                  <p className="xs text-2" style={{ marginTop: 8 }}>
                    {e.notes}
                  </p>
                )}
              </div>
              <div className="lib-row-side">
                {e.rating && (
                  <span className="row" style={{ gap: 4 }} title="Rating">
                    <Star size={14} weight="fill" color="var(--gold)" aria-hidden="true" /> {e.rating}/10
                  </span>
                )}
                {e.hours != null && <span title="Hours played">{hours(e.hours)}</span>}
                <Link to={`/game/${e.slug}`} className="btn btn-sm btn-ghost" aria-label={`Open ${e.title} wiki`}>
                  <BookOpen size={14} weight="bold" aria-hidden="true" /> Wiki
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
