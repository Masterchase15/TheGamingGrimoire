import { useState } from 'react';
import { Check, Clock, UserMinus, UserPlus } from '@phosphor-icons/react';
import { api } from '../lib/api.js';
import { useToast } from './Toast.jsx';

// Friend action for another user, driven by the relationship state from the API.
export default function FriendButton({ username, relationship, onChange, size }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const cls = size === 'sm' ? 'btn-sm' : '';

  async function act(fn, message) {
    setBusy(true);
    try {
      const res = await fn();
      onChange?.({ state: res.state, id: res.id ?? relationship.id });
      if (message) toast(message);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  switch (relationship?.state) {
    case 'none':
      return (
        <button
          className={`btn btn-gold ${cls}`}
          disabled={busy}
          onClick={() => act(() => api('/friends/request', { method: 'POST', body: { username } }), 'Friend request sent')}
        >
          <UserPlus size={16} aria-hidden="true" /> Add friend
        </button>
      );
    case 'outgoing':
      return (
        <button
          className={`btn ${cls}`}
          disabled={busy}
          onClick={() => act(() => api(`/friends/${relationship.id}`, { method: 'DELETE' }), 'Request cancelled')}
          title="Cancel request"
        >
          <Clock size={16} aria-hidden="true" /> Request sent
        </button>
      );
    case 'incoming':
      return (
        <div className="row" style={{ gap: 8 }}>
          <button
            className={`btn btn-gold ${cls}`}
            disabled={busy}
            onClick={() => act(() => api(`/friends/${relationship.id}/accept`, { method: 'POST' }), 'You are now friends')}
          >
            <Check size={16} aria-hidden="true" /> Accept
          </button>
          <button
            className={`btn btn-ghost ${cls}`}
            disabled={busy}
            onClick={() => act(() => api(`/friends/${relationship.id}`, { method: 'DELETE' }), 'Request declined')}
          >
            Decline
          </button>
        </div>
      );
    case 'friends':
      return (
        <button
          className={`btn ${cls}`}
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Remove @${username} from your friends?`)) {
              act(() => api(`/friends/${relationship.id}`, { method: 'DELETE' }), 'Friend removed');
            }
          }}
        >
          <UserMinus size={16} aria-hidden="true" /> Friends
        </button>
      );
    default:
      return null;
  }
}
