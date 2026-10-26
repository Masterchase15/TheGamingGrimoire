import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page center-page" style={{ textAlign: 'center' }}>
      <div>
        <span className="eyebrow">
          <b>404</b> <i>/</i> Page not found
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(3rem, 12vw, 9rem)', margin: '20px 0' }}>
          Lost <span className="gold">map</span>
        </h1>
        <p className="text-2" style={{ marginBottom: 28 }}>
          This page isn’t in the grimoire. The link may be broken, or the page may have moved.
        </p>
        <Link to="/" className="btn btn-gold btn-lg">
          Return home
        </Link>
      </div>
    </div>
  );
}
