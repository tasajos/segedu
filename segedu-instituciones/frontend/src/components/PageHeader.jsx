export default function PageHeader({ eyebrow, title, lead, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-top">
        <div className="page-header-content">
          {eyebrow && (
            <div className="page-header-badge">
              <span className="eyebrow">{eyebrow}</span>
            </div>
          )}
          <h1 className="page-header-title">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      <div className="page-header-divider" />
    </header>
  );
}
