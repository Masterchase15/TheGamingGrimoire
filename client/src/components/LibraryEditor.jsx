import { useState } from 'react';
import { Broadcast, Heart, Trash } from '@phosphor-icons/react';
import Modal from './Modal.jsx';
import { api } from '../lib/api.js';
import { STATUS } from '../lib/statuses.js';
import { useToast } from './Toast.jsx';

// Add/edit a game in the signed-in user's library.
export default function LibraryEditor({ game, entry, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    status: entry?.status ?? game.statuses[0],
    rating: entry?.rating ?? null,
    hours: entry?.hours ?? '',
    notes: entry?.notes ?? '',
    favorite: entry?.favorite ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const { entry: saved } = await api(`/library/${game.id}`, { method: 'PUT', body: form });
      toast(entry ? 'Library entry updated' : `Added ${game.title} to your library`);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${game.title} from your library?`)) return;
    setSaving(true);
    try {
      await api(`/library/${game.id}`, { method: 'DELETE' });
      toast(`Removed ${game.title} from your library`);
      onSaved(null);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={entry ? 'Edit library entry' : 'Add to library'}
      onClose={onClose}
      footer={
        <>
          {entry && (
            <button className="btn btn-danger" onClick={remove} disabled={saving}>
              <Trash size={18} aria-hidden="true" /> Remove
            </button>
          )}
          <span className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" aria-hidden="true" /> : null}
            {entry ? 'Save changes' : 'Add to library'}
          </button>
        </>
      }
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{game.title}</div>
        {game.is_continuous && (
          <div className="callout" style={{ marginTop: 10 }}>
            <Broadcast size={18} aria-hidden="true" />
            <span>
              This game is played continuously, so it uses ongoing statuses — mark whether you&apos;re actively playing
              it rather than when you finished it.
            </span>
          </div>
        )}
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label" style={{ marginBottom: 6 }}>
          Status
        </legend>
        <div className="status-options" role="radiogroup" aria-label="Status">
          {game.statuses.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={form.status === s}
              className="status-option"
              style={{ '--status-c': STATUS[s].color }}
              onClick={() => set('status', s)}
            >
              <i aria-hidden="true" />
              {STATUS[s].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <span className="field-label" id="rating-label">
          Rating <span className="opt">optional</span>
        </span>
        <div className="rating-row" role="group" aria-labelledby="rating-label">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={form.rating === n}
              aria-label={`${n} out of 10`}
              onClick={() => set('rating', form.rating === n ? null : n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="lib-hours">
          Hours played <span className="opt">optional</span>
        </label>
        <input
          id="lib-hours"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={form.hours}
          onChange={(e) => set('hours', e.target.value)}
          style={{ maxWidth: 180 }}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="lib-notes">
          Notes <span className="opt">private</span>
        </label>
        <textarea
          id="lib-notes"
          className="textarea"
          style={{ minHeight: 90 }}
          maxLength={2000}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Deck list ideas, current build, where you left off…"
        />
      </div>

      <button
        type="button"
        className="btn btn-sm"
        aria-pressed={form.favorite}
        onClick={() => set('favorite', !form.favorite)}
        style={{ alignSelf: 'flex-start', color: form.favorite ? '#fb7185' : undefined }}
      >
        <Heart size={16} weight={form.favorite ? 'fill' : 'regular'} aria-hidden="true" />
        {form.favorite ? 'Favorite' : 'Mark as favorite'}
      </button>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
