import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, useApi } from '../lib/api.js';
import { CATEGORIES } from '../lib/format.js';
import { Crumbs } from '../components/Common.jsx';

export default function NewThread() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const games = useApi('/games?sort=title');
  const [form, setForm] = useState({ gameSlug: params.get('game') ?? '', title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { id } = await api('/forums/threads', { method: 'POST', body: form });
      navigate(`/forums/${id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const grouped = Object.keys(CATEGORIES).map((c) => [c, (games.data?.games ?? []).filter((g) => g.category === c)]);

  return (
    <div className="page container" style={{ maxWidth: 860 }}>
      <Crumbs items={[{ label: 'Forums', to: '/forums' }, { label: 'New thread' }]} />
      <span className="eyebrow">
        <b>+</b> <i>/</i> New thread
      </span>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', margin: '14px 0 28px' }}>
        Start a discussion
      </h1>
      <form onSubmit={submit} className="panel frame stack" style={{ gap: 24 }}>
        <div className="field">
          <label className="field-label" htmlFor="nt-game">
            Game
          </label>
          <select id="nt-game" className="select" value={form.gameSlug} onChange={set('gameSlug')}>
            <option value="">General discussion (no specific game)</option>
            {grouped.map(([c, list]) => (
              <optgroup key={c} label={CATEGORIES[c].label}>
                {list.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="nt-title">
            Title<span className="req" aria-hidden="true">*</span>
          </label>
          <input id="nt-title" className="input" value={form.title} onChange={set('title')} maxLength={140} required />
          <span className="hint">{form.title.length}/140</span>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="nt-body">
            Post<span className="req" aria-hidden="true">*</span>
          </label>
          <textarea id="nt-body" className="textarea" style={{ minHeight: 220 }} value={form.body} onChange={set('body')} maxLength={10000} required />
        </div>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn btn-gold" disabled={busy || !form.title.trim() || !form.body.trim()}>
            {busy && <span className="spinner" aria-hidden="true" />} Post thread
          </button>
        </div>
      </form>
    </div>
  );
}
