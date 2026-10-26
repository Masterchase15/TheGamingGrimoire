import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { api, useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, displayName, timeAgo } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import { Crumbs, ErrorState, Spinner } from '../components/Common.jsx';
import { useToast } from '../components/Toast.jsx';

function Post({ post, op = false }) {
  return (
    <article className={`post ${op ? 'post-op' : ''}`}>
      <Link to={`/u/${post.author.username}`} aria-hidden="true" tabIndex={-1}>
        <Avatar user={post.author} size={44} />
      </Link>
      <div className="post-body">
        <div className="post-head">
          <Link to={`/u/${post.author.username}`} style={{ fontWeight: 650 }}>
            {displayName(post.author)}
          </Link>
          <span className="label">@{post.author.username}</span>
          <span className="label">· {timeAgo(post.created_at)}</span>
          {op && <span className="chip chip-gold">Original post</span>}
        </div>
        <div className="post-text">{post.body}</div>
      </div>
    </article>
  );
}

export default function Thread() {
  const { id } = useParams();
  const { data: session } = useSession();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(`/forums/threads/${id}`);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

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

  const { thread, posts } = data;

  async function submit(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setFormError('');
    try {
      await api(`/forums/threads/${id}/posts`, { method: 'POST', body: { body: reply } });
      setReply('');
      toast('Reply posted');
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const crumbs = [{ label: 'Forums', to: '/forums' }];
  if (thread.game) {
    crumbs.push({ label: CATEGORIES[thread.game.category].label, to: CATEGORIES[thread.game.category].path });
    crumbs.push({ label: thread.game.title, to: `/game/${thread.game.slug}` });
  }

  return (
    <div className="page container" style={{ maxWidth: 960 }}>
      <Crumbs items={crumbs} />
      <h1 className="display" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', margin: '8px 0 28px' }}>
        {thread.title}
      </h1>
      <div className="stack" style={{ gap: 10 }}>
        <Post post={thread} op />
        {posts.map((p) => (
          <Post key={p.id} post={p} />
        ))}
      </div>

      <section className="section" style={{ marginTop: 40 }} aria-label="Reply">
        {session?.user ? (
          <form onSubmit={submit} className="panel frame stack">
            <label className="field-label" htmlFor="reply">
              Your reply
            </label>
            <textarea id="reply" className="textarea" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={10000} placeholder="Share your thoughts…" />
            {formError && (
              <div className="alert" role="alert">
                {formError}
              </div>
            )}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-gold" disabled={busy || !reply.trim()}>
                {busy ? <span className="spinner" aria-hidden="true" /> : <PaperPlaneRight size={16} weight="bold" aria-hidden="true" />}
                Post reply
              </button>
            </div>
          </form>
        ) : (
          <div className="panel frame row wrap" style={{ justifyContent: 'space-between' }}>
            <span className="text-2">Sign in to join the discussion.</span>
            <Link to={`/login?next=/forums/${id}`} className="btn btn-gold btn-sm">
              Sign in
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
