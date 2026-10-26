import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, Books, Heart, List, MagnifyingGlass, Play, Pulse, SquaresFour, Star } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { CATEGORIES, displayName, hours } from '../lib/format.js';
import { FINITE_STATUSES, ONGOING_STATUSES, STATUS } from '../lib/statuses.js';
import Avatar from '../components/Avatar.jsx';
import FriendButton from '../components/FriendButton.jsx';
import GameArt from '../components/GameArt.jsx';
import GameCard from '../components/GameCard.jsx';
import { CategoryChip, LiveChip, StatusBadge } from '../components/Badges.jsx';
import { Empty, ErrorState, Spinner } from '../components/Common.jsx';
import { ActivityList } from './Home.jsx';

export default function Profile() {
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'library' ? 'library' : 'overview';
  const profile = useApi(`/users/${username}`);
  const library = useApi(`/users/${username}/library`);

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

  const { user, relationship, statusCounts, nowPlaying, activity, friendCount } = profile.data;
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const isSelf = relationship.state === 'self';
  const backdrop = nowPlaying.find((g) => g.hero_url)?.hero_url;

  return (
    <>
      <section className="profile-hero">
        {backdrop && (
          <div className="backdrop-art" aria-hidden="true">
            <img src={backdrop} alt="" />
          </div>
        )}
        <div className="container profile-inner">
          <Avatar user={user} size={96} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <span className="eyebrow">
              <b>@{user.username}</b> <i>/</i> Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </span>
            <h1 className="display profile-name">{displayName(user)}</h1>
            {user.bio && <p className="text-2">{user.bio}</p>}
            <div className="profile-stats">
              {[
                [total, 'Games'],
                [(statusCounts.playing ?? 0) + (statusCounts.active ?? 0), 'Playing'],
                [statusCounts.completed ?? 0, 'Completed'],
                [friendCount, friendCount === 1 ? 'Friend' : 'Friends'],
              ].map(([n, l]) => (
                <div key={l}>
                  <strong>{n}</strong>
                  <span className="label">{l}</span>
                </div>
              ))}
            </div>
          </div>
          {!isSelf && relationship.state !== 'anonymous' && (
            <FriendButton
              username={user.username}
              relationship={relationship}
              onChange={(rel) => profile.setData((d) => ({ ...d, relationship: rel }))}
            />
          )}
        </div>
      </section>

      <div className="container page">
        <div className="tabs" role="tablist">
          <button role="tab" className="tab" aria-selected={tab === 'overview'} onClick={() => setParams({})}>
            <Pulse size={16} weight="bold" aria-hidden="true" /> Overview
          </button>
          <button role="tab" className="tab" aria-selected={tab === 'library'} onClick={() => setParams({ tab: 'library' })}>
            <Books size={16} weight="bold" aria-hidden="true" /> Library <span className="count">{total}</span>
          </button>
        </div>

        {tab === 'overview' ? (
          <div className="dashboard">
            <div style={{ minWidth: 0 }}>
              <div className="section-head">
                <div>
                  <span className="eyebrow">
                    <b>01</b> <i>/</i> In progress
                  </span>
                  <h2 className="section-title">Currently playing</h2>
                </div>
              </div>
              {nowPlaying.length ? (
                <div className="capsule-row">
                  {nowPlaying.map((g) => (
                    <GameCard key={g.slug} game={g} status={g.status} />
                  ))}
                </div>
              ) : (
                <Empty icon={Play} title="Not playing anything right now" />
              )}
            </div>
            <aside className="panel frame">
              <div className="panel-title">
                <h2>
                  <Pulse size={16} weight="bold" aria-hidden="true" /> Recent activity
                </h2>
              </div>
              {activity.length ? <ActivityList items={activity} /> : <p className="small text-2">No activity yet.</p>}
            </aside>
          </div>
        ) : (
          <Library entries={library.data?.entries} loading={library.loading} isSelf={isSelf} />
        )}
      </div>
    </>
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
