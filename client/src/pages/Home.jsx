import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookBookmark, Clock, UsersThree, Wrench } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, displayName, timeAgo } from '../lib/format.js';
import { STATUS } from '../lib/statuses.js';
import SearchBox from '../components/SearchBox.jsx';
import GameCard, { GameGridSkeleton } from '../components/GameCard.jsx';
import GameArt from '../components/GameArt.jsx';
import Avatar from '../components/Avatar.jsx';
import { Embers, PixelMatrix } from '../components/Effects.jsx';

// The public landing page. Signed-in users get their dashboard on their profile instead.
export default function Home() {
  const { data: session } = useSession();
  return <Landing user={session?.user} />;
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

function Landing({ user }) {
  const stats = useApi('/games/stats');
  const all = useApi('/games');
  const s = stats.data;
  const games = all.data?.games ?? [];
  const featured = games.filter((g) => g.featured);

  return (
    <>
      <section className="hero">
        {/* Background layers are clipped here so the search suggestions can overflow the hero. */}
        <div className="hero-bg">
          <CapsuleWall games={games} />
          <div className="hero-shade" />
          <Embers />
        </div>
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
            {user ? (
              <>
                <p className="text-2" style={{ maxWidth: 480, marginBottom: 28 }}>
                  Your profile has what you’re playing, patch notes for your games, your reviews and what your friends
                  are up to.
                </p>
                <div className="row wrap">
                  <Link to={`/u/${user.username}`} className="btn btn-gold btn-lg">
                    Go to your profile
                  </Link>
                  <Link to="/video-games" className="btn btn-lg btn-ghost">
                    Browse games
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-2" style={{ maxWidth: 480, marginBottom: 28 }}>
                  Create a free account to track what you’re playing, get patch notes for your games on your profile,
                  review games and join the discussion.
                </p>
                <div className="row wrap">
                  <Link to="/signup" className="btn btn-gold btn-lg">
                    Create account
                  </Link>
                  <Link to="/login" className="btn btn-lg btn-ghost">
                    Sign in
                  </Link>
                </div>
              </>
            )}
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
    case 'review':
      return (
        <>
          {actor}reviewed {game}
          {item.meta?.score != null && <span className="score-inline">{item.meta.score}/10</span>}
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
