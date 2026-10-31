import { ArrowSquareOut, BookBookmark, CaretDown, DownloadSimple } from '@phosphor-icons/react';

/** Every rulebook a game has, by name. */
export function RulebookLinks({ rulebooks }) {
  return (
    <div className="rulebook-list">
      {rulebooks.map((r) => (
        <div key={r.name} className="rulebook-row">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="rulebook-open">
            <BookBookmark size={18} weight="bold" aria-hidden="true" />
            <span>{r.name}</span>
            <ArrowSquareOut size={14} aria-hidden="true" />
          </a>
          <a href={r.url} download className="btn btn-ghost btn-sm" aria-label={`Download ${r.name} PDF`}>
            <DownloadSimple size={14} weight="bold" aria-hidden="true" /> PDF
          </a>
        </div>
      ))}
    </div>
  );
}

/** The short version of the rules, for people who don't want to read the whole book. */
export function RulebookTldr({ tldr }) {
  return (
    <div className="tldr-grid">
      {tldr.map((s) => (
        <div key={s.heading} className="tldr-card">
          <h3>{s.heading}</h3>
          <ul>
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The FAQ lives on another site, so this section just sends people there. */
export function FaqLink({ url, title }) {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="text-2">Common questions about {title} are answered on {new URL(url).hostname.replace(/^www\./, '')}.</p>
      <div className="row wrap">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
          Read the FAQ <ArrowSquareOut size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

/** Questions written for the site, for anything the linked FAQ doesn't cover. */
export function UniqueFaq({ faq }) {
  return (
    <div className="faq-list">
      {faq.map((f) => (
        <details key={f.q} className="faq-item">
          <summary>
            <span>{f.q}</span>
            <CaretDown size={14} weight="bold" aria-hidden="true" />
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
