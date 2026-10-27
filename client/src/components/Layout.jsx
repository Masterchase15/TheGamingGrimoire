import { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Books, CaretDown, List, MagnifyingGlass, SignOut, UserCircle, UsersThree, X } from '@phosphor-icons/react';
import { signOut, useSession } from '../lib/auth.js';
import Avatar from './Avatar.jsx';
import SearchBox from './SearchBox.jsx';
import { Spinner } from './Common.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/video-games', label: 'Video' },
  { to: '/board-games', label: 'Board' },
  { to: '/card-games', label: 'Card' },
  { to: '/forums', label: 'Forums' },
  { to: '/community', label: 'Community' },
];

// "Profile" sits right after Home once signed in.
const navLinks = (user) => (user ? [LINKS[0], { to: `/u/${user.username}`, label: 'Profile' }, ...LINKS.slice(1)] : LINKS);

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="TheGamingGrimoire home">
      <img src="/favicon.svg" alt="" width="30" height="30" />
      <span className="brand-word">
        The Gaming <span>Grimoire</span>
      </span>
    </Link>
  );
}

function CommandPalette({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search the grimoire">
        <div className="hazard" />
        <div className="palette-body">
          <SearchBox inline autoFocus onNavigate={onClose} />
        </div>
        <div className="palette-foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> Navigate
          </span>
          <span>
            <span className="kbd">Enter</span> Open
          </span>
          <span>
            <span className="kbd">Esc</span> Close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  async function logout() {
    await signOut();
    setOpen(false);
    navigate('/');
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="btn btn-ghost"
        style={{ paddingInline: 6, '--notch': '0px' }}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar user={user} size={32} />
        <span className="sr-only">Account menu for {user.username}</span>
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div style={{ padding: '10px 12px 12px' }}>
            <div style={{ fontWeight: 650 }}>{user.name}</div>
            <div className="label" style={{ marginTop: 2 }}>
              @{user.username}
            </div>
          </div>
          <div className="menu-sep" />
          <Link role="menuitem" className="menu-item" to={`/u/${user.username}`} onClick={() => setOpen(false)}>
            <UserCircle size={18} aria-hidden="true" /> Profile
          </Link>
          <Link role="menuitem" className="menu-item" to={`/u/${user.username}?tab=library`} onClick={() => setOpen(false)}>
            <Books size={18} aria-hidden="true" /> Library
          </Link>
          <Link role="menuitem" className="menu-item" to="/community" onClick={() => setOpen(false)}>
            <UsersThree size={18} aria-hidden="true" /> Friends
          </Link>
          <div className="menu-sep" />
          <button role="menuitem" className="menu-item danger" onClick={logout}>
            <SignOut size={18} aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <Brand />
            <p className="text-2 small" style={{ marginTop: 16, maxWidth: 340 }}>
              A wiki and community for video games, board games and card games. Rules, keywords, patch notes and the
              people you play with.
            </p>
          </div>
          <div>
            <h4>Wiki</h4>
            <ul>
              <li>
                <Link to="/video-games">Video games</Link>
              </li>
              <li>
                <Link to="/board-games">Board games</Link>
              </li>
              <li>
                <Link to="/card-games">Card games</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Community</h4>
            <ul>
              <li>
                <Link to="/forums">Forums</Link>
              </li>
              <li>
                <Link to="/community">Find friends</Link>
              </li>
              <li>
                <Link to="/signup">Create account</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Data</h4>
            <ul>
              <li>
                <a href="https://store.steampowered.com" target="_blank" rel="noreferrer noopener">
                  Art & patch notes: Steam
                </a>
              </li>
              <li>
                <a href="https://howlongtobeat.com" target="_blank" rel="noreferrer noopener">
                  Play times: HowLongToBeat
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-big display" aria-hidden="true">
          The Gaming Grimoire
        </div>
        <div className="footer-base">
          <span className="label">© {new Date().getFullYear()} TheGamingGrimoire</span>
          <span className="label">Not affiliated with Valve or any publisher</span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const user = session?.user;

  useEffect(() => {
    setMenuOpen(false);
    setPaletteOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl/Cmd+K or "/" opens search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="nav">
        <div className="container nav-inner">
          <Brand />
          <nav className="nav-links" aria-label="Main">
            {navLinks(user).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="search-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search (Ctrl+K)">
              <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
              <span className="text">Search the grimoire</span>
              <span className="kbd">Ctrl K</span>
            </button>
            {!isPending &&
              (user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    Sign in
                  </Link>
                  <Link to="/signup" className="btn btn-gold btn-sm">
                    Join
                  </Link>
                </>
              ))}
            <button
              className="btn btn-ghost btn-icon nav-burger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile">
          {navLinks(user).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {l.label === 'Video' || l.label === 'Board' || l.label === 'Card' ? `${l.label} games` : l.label}
            </NavLink>
          ))}
        </nav>
      )}

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Suspense
          fallback={
            <div className="center-page">
              <Spinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
