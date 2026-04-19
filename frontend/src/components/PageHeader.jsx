export default function PageHeader({ num, eyebrow, title, lead, actions }) {
  return (
    <header className="page-header">
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <span className="eyebrow">
          {num && <span style={{ color: 'var(--gold-dark)', marginRight: '0.5rem' }}>{num} —</span>}
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
