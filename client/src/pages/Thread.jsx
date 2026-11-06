import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { NotePencil, PaperPlaneRight, Trash } from '@phosphor-icons/react';
import { api, useApi } from '../lib/api.js';
import { useSession } from '../lib/auth.js';
import { CATEGORIES, displayName, timeAgo } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import { Crumbs, ErrorState, Spinner } from '../components/Common.jsx';
import { useToast } from '../components/Toast.jsx';

// One post in a thread. Its author gets Edit / Delete; editing the opening post also edits the thread title.
function Post({ post, op = false, title, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEdit() {
    setDraftTitle(title ?? '');
    setDraft(post.body);
    setError('');
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(op ? { title: draftTitle, body: draft } : { body: draft });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  const unchanged = draft.trim() === post.body && (!op || draftTitle.trim() === title);

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
          {post.edited_at && (
            <span className="label" title={new Date(post.edited_at).toLocaleString()}>
              · edited {timeAgo(post.edited_at)}
            </span>
          )}
          {op && <span className="chip chip-gold">Original post</span>}
        </div>
        {editing ? (
          <form onSubmit={save} className="stack" style={{ gap: 10 }}>
            {op && (
              <>
                <label className="field-label" htmlFor={`edit-title-${post.id}`}>
                  Title
                </label>
                <input
                  id={`edit-title-${post.id}`}
                  className="input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={140}
                />
              </>
            )}
            <label className="field-label" htmlFor={`edit-body-${post.id}`}>
              {op ? 'Post' : 'Reply'}
            </label>
            <textarea
              id={`edit-body-${post.id}`}
              className="textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={10000}
              autoFocus
            />
            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
              <button className="btn btn-sm btn-gold" disabled={busy || !draft.trim() || (op && !draftTitle.trim()) || unchanged}>
                {busy && <span className="spinner" aria-hidden="true" />}
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="post-text">{post.body}</div>
            {post.mine && onSave && (
              <div className="post-actions">
                <button className="btn btn-sm btn-ghost" onClick={startEdit} disabled={busy}>
                  <NotePencil size={14} weight="bold" aria-hidden="true" /> Edit
                </button>
                <button className="btn btn-sm btn-ghost" onClick={remove} disabled={busy}>
                  <Trash size={14} weight="bold" aria-hidden="true" /> {op ? 'Delete thread' : 'Delete'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default function Thread() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  // Only signed-in authors see the controls (`mine` is computed for the session that loaded the page).
  const canEdit = Boolean(session?.user);

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

  async function saveThread(changes) {
    await api(`/forums/threads/${id}`, { method: 'PATCH', body: changes });
    toast('Thread updated');
    reload();
  }

  async function deleteThread() {
    const count = posts.length;
    const extra = count ? ` Its ${count} ${count === 1 ? 'reply' : 'replies'} will be deleted too.` : '';
    if (!window.confirm(`Delete “${thread.title}”?${extra} This can’t be undone.`)) return;
    try {
      const res = await api(`/forums/threads/${id}`, { method: 'DELETE' });
      toast('Thread deleted');
      navigate(res.gameSlug ? `/game/${res.gameSlug}#discussions` : '/forums', { replace: true });
    } catch (err) {
      toast(err.message);
    }
  }

  async function saveReply(postId, changes) {
    await api(`/forums/threads/${id}/posts/${postId}`, { method: 'PATCH', body: changes });
    toast('Reply updated');
    reload();
  }

  async function deleteReply(postId) {
    if (!window.confirm('Delete your reply? This can’t be undone.')) return;
    try {
      await api(`/forums/threads/${id}/posts/${postId}`, { method: 'DELETE' });
      toast('Reply deleted');
      reload();
    } catch (err) {
      toast(err.message);
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
        <Post
          post={thread}
          op
          title={thread.title}
          onSave={canEdit ? saveThread : null}
          onDelete={deleteThread}
        />
        {posts.map((p) => (
          <Post
            key={p.id}
            post={p}
            onSave={canEdit ? (changes) => saveReply(p.id, changes) : null}
            onDelete={() => deleteReply(p.id)}
          />
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
