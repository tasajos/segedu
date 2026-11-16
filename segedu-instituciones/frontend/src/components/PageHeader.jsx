// "num" se acepta por compatibilidad con las pantallas existentes, pero ya no
// se muestra: las secciones no son una secuencia numerada.
export default function PageHeader({ eyebrow, title, lead, actions }) {
  return (
    <header className="page-header">
      <div className="flex items-center justify-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
        {actions}
      </div>
      {lead && <p className="lead">{lead}</p>}
      <div className="page-header-divider" />
    </header>
  );
}
