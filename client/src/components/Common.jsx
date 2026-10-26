import { Children, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaretRight, Ghost, WarningCircle } from '@phosphor-icons/react';

export function Empty({ icon: Icon = Ghost, title, children, action }) {
  return (
    <div className="empty">
      <Icon size={36} weight="thin" aria-hidden="true" />
      {title && <p className="empty-title">{title}</p>}
      {children && <p className="small">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <Empty
      icon={WarningCircle}
      title={error?.status === 404 ? 'Not found' : "Couldn't load this"}
      action={
        onRetry && (
          <button className="btn btn-sm" onClick={onRetry}>
            Try again
          </button>
        )
      }
    >
      {error?.message}
    </Empty>
  );
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function Crumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {items.map((item, i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          {i > 0 && <CaretRight size={12} aria-hidden="true" />}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// Markdown renderer for wiki articles. Tables get a scroll wrapper on small screens.
export function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
          img: ({ node, alt, ...props }) => <img alt={alt || ''} loading="lazy" decoding="async" {...props} />,
          a: ({ node, href, ...props }) =>
            href?.startsWith('/') ? (
              <Link to={href} {...props} />
            ) : (
              <a href={href} target="_blank" rel="noreferrer noopener" {...props} />
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

// Highlights occurrences of `query` inside plain text.
export function Highlight({ text, query }) {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${safe})`, 'ig'));
  return Children.toArray(
    parts.map((part, i) => (i % 2 === 1 ? <mark>{part}</mark> : part))
  ).filter((p) => isValidElement(p) || p);
}
