import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, UserPlus, UsersThree } from '@phosphor-icons/react';
import { api, useApi, useDebounced } from '../lib/api.js';
import { displayName } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import FriendButton from '../components/FriendButton.jsx';
import { Empty, Spinner } from '../components/Common.jsx';
import { SectionHead } from './Home.jsx';

function UserRow({ user, action }) {
  return (
    <div className="user-row">
      <Link to={`/u/${user.username}`} className="row" style={{ flex: 1, minWidth: 0 }}>
        <Avatar user={user} size={44} />
        <div style={{ minWidth: 0 }}>
          <div className="user-row-name">{displayName(user)}</div>
          <div className="user-row-handle">
            @{user.username}
            {user.game_count != null && ` · ${user.game_count} games`}
          </div>
        </div>
      </Link>
      {action}
    </div>
  );
}

export default function Community() {
  const friends = useApi('/friends');
  const [q, setQ] = useState('');
  const debounced = useDebounced(q.trim(), 250);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!debounced) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    api(`/users/search?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => setResults(r.users))
      .catch(() => {})
      .finally(() => setSearching(false));
    return () => ctrl.abort();
  }, [debounced]);

  // Each search result's relationship, derived from the friends payload.
  function relationshipFor(userId) {
    const f = friends.data;
    if (!f) return { state: 'none' };
    const find = (list) => list.find((x) => x.user.id === userId);
    const friend = find(f.friends);
    if (friend) return { state: 'friends', id: friend.friendshipId };
    const incoming = find(f.incoming);
    if (incoming) return { state: 'incoming', id: incoming.friendshipId };
    const outgoing = find(f.outgoing);
    if (outgoing) return { state: 'outgoing', id: outgoing.friendshipId };
    return { state: 'none' };
  }

  const f = friends.data;

  return (
    <>
      <header className="page-head" style={{ '--accent': 'var(--video)' }}>
        <div className="container">
          <span className="eyebrow">
            <b>05</b> <i>/</i> Community
          </span>
          <h1 className="display page-title">Your party</h1>
          <p className="page-sub">Find other players, add them as friends, and follow what they’re playing.</p>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: 'var(--s8)' }}>
        <div className="dashboard">
          <div className="stack" style={{ gap: 40, minWidth: 0 }}>
            <section className="panel frame">
              <div className="panel-title">
                <h2>
                  <MagnifyingGlass size={16} weight="bold" aria-hidden="true" /> Find players
                </h2>
              </div>
              <div className="search">
                <div className="search-field">
                  <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search by username or name…"
                    aria-label="Search players"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="stack" style={{ gap: 8, marginTop: 16 }} aria-live="polite">
                {searching && <Spinner />}
                {results?.length === 0 && <p className="small text-2">No players found for “{debounced}”.</p>}
                {results?.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    action={<FriendButton size="sm" username={u.username} relationship={relationshipFor(u.id)} onChange={friends.reload} />}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionHead index="01" kicker={`${f?.friends.length ?? 0} total`} title="Friends" />
              {friends.loading && !f ? (
                <Spinner />
              ) : f?.friends.length ? (
                <div className="stack" style={{ gap: 8 }}>
                  {f.friends.map((x) => (
                    <UserRow key={x.friendshipId} user={x.user} />
                  ))}
                </div>
              ) : (
                <Empty icon={UsersThree} title="No friends yet">
                  Search for players above to send your first friend request.
                </Empty>
              )}
            </section>
          </div>

          <aside className="stack" style={{ gap: 20 }}>
            <div className="panel">
              <div className="panel-title">
                <h2>
                  <UserPlus size={16} weight="bold" aria-hidden="true" /> Friend requests
                </h2>
                {f?.incoming.length > 0 && <span className="chip chip-solid">{f.incoming.length}</span>}
              </div>
              {f?.incoming.length ? (
                <div className="stack" style={{ gap: 12 }}>
                  {f.incoming.map((x) => (
                    <div key={x.friendshipId} className="stack" style={{ gap: 8 }}>
                      <UserRow user={x.user} />
                      <FriendButton size="sm" username={x.user.username} relationship={{ state: 'incoming', id: x.friendshipId }} onChange={friends.reload} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="small text-2">No pending requests.</p>
              )}
            </div>
            {f?.outgoing.length > 0 && (
              <div className="panel">
                <div className="panel-title">
                  <h2>Sent requests</h2>
                </div>
                <div className="stack" style={{ gap: 8 }}>
                  {f.outgoing.map((x) => (
                    <UserRow
                      key={x.friendshipId}
                      user={x.user}
                      action={<FriendButton size="sm" username={x.user.username} relationship={{ state: 'outgoing', id: x.friendshipId }} onChange={friends.reload} />}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
