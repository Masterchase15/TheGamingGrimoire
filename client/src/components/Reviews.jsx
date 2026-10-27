import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NotePencil, Star, Trash } from '@phosphor-icons/react';
import { api, useApi } from '../lib/api.js';
import { displayName, timeAgo } from '../lib/format.js';
import Avatar from './Avatar.jsx';
import GameArt from './GameArt.jsx';
import { useToast } from './Toast.jsx';
import { Spinner } from './Common.jsx';

// Score out of 10, tinted from ember (low) to gold (high).
export function ScoreBadge({ score, size = 'md' }) {
  const tier = score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';
  return (
    <span className={`score score-${size} score-${tier}`} aria-label={`${score} out of 10`}>
      <strong>{Number.isInteger(score) ? score : score.toFixed(1)}</strong>
      <span aria-hidden="true">/10</span>
    </span>
  );
}

function ScorePicker({ value, onChange }) {
  return (
    <div className="rating-row" role="group" aria-labelledby="review-score-label">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" aria-pressed={value === n} aria-label={`${n} out of 10`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ slug, mine, onSaved, onCancel }) {
  const toast = useToast();
  const [score, setScore] = useState(mine?.score ?? null);
  const [body, setBody] = useState(mine?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(e) {
    e.preventDefault();
    if (!score) return setError('Pick a score from 1 to 10.');
    setSaving(true);
    setError('');
    try {
      const { review } = await api(`/games/${slug}/reviews`, { method: 'PUT', body: { score, body } });
      toast(mine ? 'Review updated' : 'Review posted');
      onSaved(review);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="review-form panel frame" onSubmit={save}>
      <div className="field">
        <span className="field-label" id="review-score-label">
          Your score <span className="req">*</span>
        </span>
        <ScorePicker value={score} onChange={setScore} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="review-body">
          Review <span className="opt">optional</span>
        </label>
        <textarea
          id="review-body"
          className="textarea"
          style={{ minHeight: 110 }}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What worked, what didn’t, who you’d recommend it to…"
        />
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn btn-gold btn-sm" disabled={saving}>
          {saving && <span className="spinner" aria-hidden="true" />}
          {mine ? 'Save review' : 'Post review'}
        </button>
      </div>
    </form>
  );
}

function ReviewBody({ text }) {
  if (!text) return null;
  return (
    <div className="review-body">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** A review as shown on a game page: author first. */
export function ReviewCard({ review, actions, mine = false }) {
  return (
    <article className={`review-card ${mine ? 'mine' : ''}`}>
      <div className="review-head">
        <Link to={`/u/${review.author.username}`} className="row" style={{ gap: 10, minWidth: 0 }}>
          <Avatar user={review.author} size={34} />
          <span style={{ fontWeight: 650 }}>{displayName(review.author)}</span>
        </Link>
        <span className="activity-time" style={{ marginTop: 0 }}>
          {timeAgo(review.updated_at)}
        </span>
        <span className="spacer" />
        <ScoreBadge score={review.score} />
      </div>
      <ReviewBody text={review.body} />
      {actions}
    </article>
  );
}

/** A review as shown on a profile: game first. */
export function ProfileReviewCard({ review }) {
  return (
    <article className="review-card review-card-game">
      <Link to={`/game/${review.slug}#reviews`} aria-hidden="true" tabIndex={-1}>
        <GameArt game={review} showTitle={false} />
      </Link>
      <div style={{ minWidth: 0 }}>
        <div className="review-head">
          <Link to={`/game/${review.slug}#reviews`} className="review-game-title">
            {review.title}
          </Link>
          <span className="spacer" />
          <ScoreBadge score={review.score} />
        </div>
        <div className="activity-time">
          {review.release_year ? `${review.release_year} · ` : ''}Reviewed {timeAgo(review.updated_at)}
        </div>
        <ReviewBody text={review.body} />
      </div>
    </article>
  );
}

/** The reviews section on a game page: average, the viewer's own review, and everyone else's. */
export function GameReviews({ game, signedIn, onChange }) {
  const navigate = useNavigate();
  const toast = useToast();
  const req = useApi(`/games/${game.slug}/reviews`);
  const [editing, setEditing] = useState(false);
  const data = req.data;
  const mine = data?.mine;
  const others = data?.reviews.filter((r) => r.id !== mine?.id) ?? [];

  useEffect(() => {
    if (data) onChange?.({ count: data.count, average: data.average });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove() {
    if (!window.confirm(`Delete your review of ${game.title}?`)) return;
    try {
      await api(`/games/${game.slug}/reviews`, { method: 'DELETE' });
      toast('Review deleted');
      req.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (req.loading && !data) return <Spinner />;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="review-summary">
        {data?.count ? (
          <>
            <ScoreBadge score={data.average} size="lg" />
            <div>
              <div style={{ fontWeight: 650 }}>Grimoire score</div>
              <div className="small text-2">
                Average of {data.count} {data.count === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontWeight: 650 }}>No reviews yet</div>
            <div className="small text-2">Be the first to score {game.title} out of 10.</div>
          </div>
        )}
        <span className="spacer" />
        {!signedIn ? (
          <button className="btn btn-gold btn-sm" onClick={() => navigate(`/login?next=/game/${game.slug}%23reviews`)}>
            <Star size={16} weight="bold" aria-hidden="true" /> Sign in to review
          </button>
        ) : (
          !mine &&
          !editing && (
            <button className="btn btn-gold btn-sm" onClick={() => setEditing(true)}>
              <Star size={16} weight="bold" aria-hidden="true" /> Write a review
            </button>
          )
        )}
      </div>

      {editing ? (
        <ReviewForm
          slug={game.slug}
          mine={mine}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            req.reload();
          }}
        />
      ) : (
        mine && (
          <div>
            <span className="label label-gold">Your review</span>
            <ReviewCard
              mine
              review={mine}
              actions={
                <div className="row" style={{ marginTop: 12, gap: 8 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)}>
                    <NotePencil size={14} weight="bold" aria-hidden="true" /> Edit
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={remove}>
                    <Trash size={14} weight="bold" aria-hidden="true" /> Delete
                  </button>
                </div>
              }
            />
          </div>
        )
      )}

      {others.length > 0 && (
        <div className="review-list">
          {others.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
