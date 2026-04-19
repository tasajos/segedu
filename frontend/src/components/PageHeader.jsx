export default function PageHeader({ num, eyebrow, title, lead, actions }) {
  return (
    <header className="page-header">
      <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
        <span className="eyebrow">
          {num && (
            <span style={{
              background: 'var(--blue-600)', color: 'white',
              borderRadius: '4px', padding: '1px 7px',
              fontSize: '.65rem', fontWeight: 700, marginRight: '.5rem'
            }}>{num}</span>
          )}
          {eyebrow}
        </span>
        {actions}
      </div>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      <div className="page-header-divider" />
    </header>
  );
}
