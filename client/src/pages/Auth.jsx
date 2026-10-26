import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { signIn, signUp, useSession } from '../lib/auth.js';
import { useApi } from '../lib/api.js';
import { CapsuleWall } from './Home.jsx';
import { Embers } from '../components/Effects.jsx';

function AuthShell({ kicker, title, children }) {
  const all = useApi('/games');
  return (
    <div className="auth-wrap">
      <div className="auth-visual" aria-hidden="true">
        <CapsuleWall games={all.data?.games ?? []} />
        <Embers />
        <div className="auth-visual-copy">
          <span className="eyebrow">
            <b>{kicker}</b> <i>/</i> TheGamingGrimoire
          </span>
          <h2 className="display">{title}</h2>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, onBlur, autoComplete, invalid, describedBy }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input
        id={id}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeSlash size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

function safeNext(params) {
  const next = params.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="alert" role="alert">
      <WarningCircle size={18} weight="bold" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function Login() {
  const { data: session } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session?.user) return <Navigate to={safeNext(params)} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const isEmail = identifier.includes('@');
    const { error: err } = isEmail
      ? await signIn.email({ email: identifier.trim(), password })
      : await signIn.username({ username: identifier.trim(), password });
    setBusy(false);
    if (err) {
      setError(err.status === 401 || err.code?.includes('INVALID') ? 'That username/email and password don’t match.' : err.message);
      return;
    }
    navigate(safeNext(params), { replace: true });
  }

  return (
    <AuthShell kicker="01" title="Continue your campaign.">
      <span className="eyebrow">
        <b>01</b> <i>/</i> Sign in
      </span>
      <h1 className="display">Welcome back</h1>
      <p className="text-2">Track your games and see what your friends are playing.</p>
      <form onSubmit={submit} noValidate>
        <FormError message={error} />
        <div className="field">
          <label className="field-label" htmlFor="login-id">
            Email or username
          </label>
          <input id="login-id" className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required autoFocus />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="login-pw">
            Password
          </label>
          <PasswordInput id="login-pw" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="btn btn-gold btn-lg btn-block" disabled={busy || !identifier || !password}>
          {busy && <span className="spinner" aria-hidden="true" />} Sign in
        </button>
        <p className="small text-2" style={{ textAlign: 'center' }}>
          New here?{' '}
          <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="gold" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/;

export function Signup() {
  const { data: session } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session?.user) return <Navigate to={safeNext(params)} replace />;

  const errors = {
    name: !form.name.trim() ? 'Enter a display name.' : '',
    username: !USERNAME_RE.test(form.username) ? '3–24 characters: letters, numbers, underscores or dots.' : '',
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'Enter a valid email address.' : '',
    password: form.password.length < 8 ? 'Use at least 8 characters.' : '',
  };
  const invalid = Object.values(errors).some(Boolean);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k) => touched[k] && errors[k];

  async function submit(e) {
    e.preventDefault();
    setTouched({ name: true, username: true, email: true, password: true });
    if (invalid) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await signUp.email({
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setBusy(false);
    if (err) {
      const msg = err.message || 'Could not create your account.';
      setError(/username/i.test(msg) && /taken|exist/i.test(msg) ? 'That username is already taken.' : msg);
      return;
    }
    navigate(safeNext(params), { replace: true });
  }

  const fields = [
    ['name', 'Display name', 'text', 'name', 'Shown on your profile and in activity.'],
    ['username', 'Username', 'text', 'username', 'Friends search for you with this.'],
    ['email', 'Email', 'email', 'email', null],
  ];

  return (
    <AuthShell kicker="00" title="Every game. One grimoire.">
      <span className="eyebrow">
        <b>00</b> <i>/</i> New player
      </span>
      <h1 className="display">Join the guild</h1>
      <p className="text-2">Track your games, add friends and join the discussion.</p>
      <form onSubmit={submit} noValidate>
        <FormError message={error} />
        {fields.map(([key, label, type, auto, hint]) => (
          <div className="field" key={key}>
            <label className="field-label" htmlFor={`su-${key}`}>
              {label}
              <span className="req" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id={`su-${key}`}
              className="input"
              type={type}
              value={form[key]}
              onChange={set(key)}
              onBlur={blur(key)}
              autoComplete={auto}
              required
              aria-invalid={show(key) ? true : undefined}
              aria-describedby={`su-${key}-msg`}
            />
            <span id={`su-${key}-msg`} className={show(key) ? 'field-error' : 'hint'}>
              {show(key) || hint}
            </span>
          </div>
        ))}
        <div className="field">
          <label className="field-label" htmlFor="su-password">
            Password
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <PasswordInput
            id="su-password"
            value={form.password}
            onChange={set('password')}
            onBlur={blur('password')}
            autoComplete="new-password"
            invalid={Boolean(show('password'))}
            describedBy="su-password-msg"
          />
          <span id="su-password-msg" className={show('password') ? 'field-error' : 'hint'}>
            {show('password') || 'At least 8 characters.'}
          </span>
        </div>
        <button className="btn btn-gold btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />} Create account
        </button>
        <p className="small text-2" style={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" className="gold" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
