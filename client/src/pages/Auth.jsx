import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { requestPasswordReset, resetPassword, sendVerificationEmail, signIn, signUp, useSession } from '../lib/auth.js';
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

function FormNotice({ children }) {
  if (!children) return null;
  return (
    <div className="callout callout-gold" role="status">
      <CheckCircle size={18} weight="bold" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function ResendVerification({ email }) {
  const [state, setState] = useState({ busy: false, sent: false, error: '' });

  async function resend() {
    setState({ busy: true, sent: false, error: '' });
    const { error } = await sendVerificationEmail({ email });
    setState({ busy: false, sent: !error, error: error ? (error.status === 429 ? 'Too many requests. Try again in a few minutes.' : error.message) : '' });
  }

  return (
    <>
      <FormError message={state.error} />
      <FormNotice>{state.sent && 'A new link is on its way.'}</FormNotice>
      <button type="button" className="btn btn-ghost btn-block" onClick={resend} disabled={state.busy}>
        {state.busy && <span className="spinner" aria-hidden="true" />} Resend email
      </button>
    </>
  );
}

export function Login() {
  const { data: session } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (session?.user) return <Navigate to={safeNext(params)} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const isEmail = identifier.includes('@');
    const { error: err } = isEmail
      ? await signIn.email({ email: identifier.trim(), password })
      : await signIn.username({ username: identifier.trim(), password });
    setBusy(false);
    if (err?.code === 'EMAIL_NOT_VERIFIED') {
      setNotice('Verify your email to sign in. We just sent a new link to your inbox.');
      return;
    }
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
        <FormNotice>{notice}</FormNotice>
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
          <Link to="/forgot-password" className="small gold" style={{ alignSelf: 'flex-end', fontWeight: 600 }}>
            Forgot password?
          </Link>
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
  const [sentTo, setSentTo] = useState('');

  if (session?.user) return <Navigate to={safeNext(params)} replace />;

  if (sentTo) {
    return (
      <AuthShell kicker="00" title="Every game. One grimoire.">
        <span className="eyebrow">
          <b>00</b> <i>/</i> One last step
        </span>
        <h1 className="display">Check your inbox</h1>
        <p className="text-2">
          We sent a link to <b>{sentTo}</b>. Open it to verify your email and finish creating your account.
        </p>
        <ResendVerification email={sentTo} />
      </AuthShell>
    );
  }

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
    const { data, error: err } = await signUp.email({
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
    // No token means the account is waiting on email verification.
    if (data?.token) navigate(safeNext(params), { replace: true });
    else setSentTo(form.email.trim());
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

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await requestPasswordReset({ email: email.trim() });
    setBusy(false);
    if (err) {
      setError(err.status === 429 ? 'Too many requests. Try again in a few minutes.' : err.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell kicker="02" title="Lost your key? Forge a new one.">
      <span className="eyebrow">
        <b>02</b> <i>/</i> Account recovery
      </span>
      <h1 className="display">Forgot password</h1>
      {sent ? (
        <>
          <p className="text-2">
            If <b>{email.trim()}</b> has an account, a reset link is on its way. It expires in 1 hour.
          </p>
          <Link to="/login" className="btn btn-gold btn-lg btn-block">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <p className="text-2">Enter your account’s email and we’ll send you a link to choose a new password.</p>
          <form onSubmit={submit} noValidate>
            <FormError message={error} />
            <div className="field">
              <label className="field-label" htmlFor="fp-email">
                Email
              </label>
              <input id="fp-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
            </div>
            <button className="btn btn-gold btn-lg btn-block" disabled={busy || !email}>
              {busy && <span className="spinner" aria-hidden="true" />} Send reset link
            </button>
            <p className="small text-2" style={{ textAlign: 'center' }}>
              Remembered it?{' '}
              <Link to="/login" className="gold" style={{ fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(!token || Boolean(params.get('error')));
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const tooShort = password.length < 8;

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (tooShort) return;
    setBusy(true);
    setError('');
    const { error: err } = await resetPassword({ newPassword: password, token });
    setBusy(false);
    if (err?.code === 'INVALID_TOKEN') {
      setLinkInvalid(true);
      return;
    }
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell kicker="02" title="Lost your key? Forge a new one.">
      <span className="eyebrow">
        <b>02</b> <i>/</i> Account recovery
      </span>
      {linkInvalid ? (
        <>
          <h1 className="display">Link expired</h1>
          <p className="text-2">This reset link is invalid or has expired. Links work once and last 1 hour.</p>
          <Link to="/forgot-password" className="btn btn-gold btn-lg btn-block">
            Request a new link
          </Link>
        </>
      ) : done ? (
        <>
          <h1 className="display">Password updated</h1>
          <p className="text-2">You can now sign in with your new password. Any other devices have been signed out.</p>
          <Link to="/login" className="btn btn-gold btn-lg btn-block">
            Sign in
          </Link>
        </>
      ) : (
        <>
          <h1 className="display">Choose a new password</h1>
          <form onSubmit={submit} noValidate>
            <FormError message={error} />
            <div className="field">
              <label className="field-label" htmlFor="rp-password">
                New password
              </label>
              <PasswordInput
                id="rp-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                autoComplete="new-password"
                invalid={touched && tooShort}
                describedBy="rp-password-msg"
              />
              <span id="rp-password-msg" className={touched && tooShort ? 'field-error' : 'hint'}>
                {touched && tooShort ? 'Use at least 8 characters.' : 'At least 8 characters.'}
              </span>
            </div>
            <button className="btn btn-gold btn-lg btn-block" disabled={busy}>
              {busy && <span className="spinner" aria-hidden="true" />} Update password
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState('');
  const error = params.get('error');

  return (
    <AuthShell kicker="00" title="Every game. One grimoire.">
      <span className="eyebrow">
        <b>00</b> <i>/</i> Email verification
      </span>
      {error ? (
        <>
          <h1 className="display">Link expired</h1>
          <p className="text-2">This verification link is invalid or has expired. Enter your email and we’ll send a new one.</p>
          <div className="field">
            <label className="field-label" htmlFor="ve-email">
              Email
            </label>
            <input id="ve-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <ResendVerification email={email.trim()} />
        </>
      ) : (
        <>
          <h1 className="display">Email verified</h1>
          <p className="text-2">Your account is ready. Welcome to the guild.</p>
          <Link to={session?.user || isPending ? '/' : '/login'} className="btn btn-gold btn-lg btn-block">
            {session?.user || isPending ? 'Start exploring' : 'Sign in'}
          </Link>
        </>
      )}
    </AuthShell>
  );
}
