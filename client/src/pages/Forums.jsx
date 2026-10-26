import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChatsCircle, Plus } from '@phosphor-icons/react';
import { useApi } from '../lib/api.js';
import { displayName, timeAgo } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import GameArt from '../components/GameArt.jsx';
import { CategoryChip } from '../components/Badges.jsx';
import { Empty, ErrorState, Spinner } from '../components/Common.jsx';

export function ThreadList({ query = '', hideGame = false, emptyText = 'No discussions yet' }) {
  const { data, error, loading, reload } = useApi(`/forums/threads${query}`);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.threads.length) return <Empty icon={ChatsCircle} title={emptyText} />;
  return (
    <div className="thread-list">
      {data.threads.map((t) => (
        <Link key={t.id} to={`/forums/${t.id}`} className="thread-row">
          {!hideGame && t.game ? <GameArt game={t.game} showTitle={false} /> : <Avatar user={t.author} size={42} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="thread-title">{t.title}</div>
            {t.excerpt && <p className="thread-excerpt">{t.excerpt}</p>}
            <div className="thread-meta">
              {!hideGame && (t.game ? <CategoryChip category={t.game.category} /> : <span className="chip">General</span>)}
              {!hideGame && t.game && <span style={{ color: 'var(--text-2)' }}>{t.game.title}</span>}
              <span>by {displayName(t.author)}</span>
              <span>active {timeAgo(t.last_post_at)}</span>
            </div>
          </div>
          <div className="thread-replies">
            <strong>{t.reply_count}</strong>
            <span className="label">{t.reply_count === 1 ? 'Reply' : 'Replies'}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Forums() {
  const [filter, setFilter] = useState('');
  return (
    <>
      <header className="page-head" style={{ '--accent': 'var(--ember)' }}>
        <div className="container row wrap" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <span className="eyebrow">
              <b>04</b> <i>/</i> Community
            </span>
            <h1 className="display page-title">Forums</h1>
            <p className="page-sub">Talk strategy, share decks, ask questions and find people to play with.</p>
          </div>
          <Link to="/forums/new" className="btn btn-gold btn-lg">
            <Plus size={18} weight="bold" aria-hidden="true" /> New thread
          </Link>
        </div>
      </header>
      <div className="container" style={{ paddingBottom: 'var(--s8)' }}>
        <div className="chip-row" role="group" aria-label="Filter threads">
          <button className="filter-chip" aria-pressed={filter === ''} onClick={() => setFilter('')}>
            All threads
          </button>
          <button className="filter-chip" aria-pressed={filter === 'general'} onClick={() => setFilter('general')}>
            General
          </button>
        </div>
        <ThreadList query={filter ? `?game=${filter}` : ''} emptyText="No discussions yet — start the first one" />
      </div>
    </>
  );
}
