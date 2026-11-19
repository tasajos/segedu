import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import { useInstitucion, LogoInstitucion } from '../context/InstitucionContext';
import './Layout.css';

// Íconos SVG consistentes y modernos (24x24)
const ICONOS = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  asistencia: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 14l2 2 4-4',
  personas: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.8M16 3.2a3.5 3.5 0 0 1 0 6.6',
  alerta: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  notas: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  plan: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',
  avance: 'M18 20V10M12 20V4M6 20v-6',
  carpeta: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  pantalla: 'M2 3h20v14H2zM8 21h8M12 17v4',
  libro: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  reloj: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  campana: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  tarea: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  grupo: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  mensaje: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  cuenta: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  edificio: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1',
  diploma: 'M12 15l-2 5l4-2l4 2l-2-5M2 9a10 10 0 1 0 20 0a10 10 0 1 0 -20 0'
};

export const Icono = ({ nombre }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONOS[nombre] || ICONOS.inicio} />
  </svg>
);

const construirMenu = (t) => ({
  estudiante: [
    { items: [{ to: '/estudiante', label: 'Inicio', icon: 'inicio' }] },
    { titulo: 'Mis clases', items: [
      { to: '/estudiante/asistencias', label: 'Asistencias y permisos', icon: 'asistencia' },
      { to: '/estudiante/tareas', label: 'Mis tareas', icon: 'tarea' },
      { to: '/estudiante/grupos', label: 'Grupos de trabajo', icon: 'grupo' },
      { to: '/estudiante/presentaciones', label: 'Presentaciones', icon: 'pantalla' }
    ] },
    { titulo: 'Mi cuenta', items: [
      { to: '/estudiante/cursos', label: 'Capacitaciones', icon: 'diploma' },
      { to: '/estudiante/info', label: 'Datos personales', icon: 'cuenta' }
    ] }
  ],
  docente: [
    { items: [{ to: '/docente', label: 'Inicio', icon: 'inicio' }] },
    { titulo: 'Mis clases', items: [
      { to: '/docente/asistencia', label: 'Lista de asistencia', icon: 'asistencia' },
      { to: '/docente/avance', label: 'Avance de clases', icon: 'avance' },
      { to: '/docente/tareas', label: 'Tareas', icon: 'tarea' },
      { to: '/docente/grupos-trabajo', label: 'Grupos de trabajo', icon: 'grupo' },
      { to: '/docente/comentarios', label: `Comentarios a ${t('estudiantes').toLowerCase()}`, icon: 'mensaje' }
    ] },
    { titulo: 'Planificación', items: [
      { to: '/docente/pgo', label: t('plan'), icon: 'plan' },
      { to: '/docente/carpeta-pedagogica', label: 'Carpeta pedagógica', icon: 'carpeta' },
      { to: '/docente/presentaciones', label: 'Presentaciones', icon: 'pantalla' }
    ] },
    { titulo: 'Mi cuenta', items: [
      { to: '/docente/datos-personales', label: 'Datos personales', icon: 'cuenta' },
      { to: '/docente/disciplina', label: 'Mi registro disciplinario', icon: 'escudo' }
    ] }
  ],
  jefe: [
    { items: [{ to: '/jefe', label: 'Inicio', icon: 'inicio' }] },
    { titulo: 'Seguimiento', items: [
      { to: '/jefe/asistencias', label: 'Asistencias y permisos', icon: 'asistencia' },
      { to: '/jefe/estudiantes', label: t('estudiantes'), icon: 'personas' },
      { to: '/jefe/comportamiento', label: 'Alertas de riesgo', icon: 'alerta' },
      { to: '/jefe/actas', label: 'Actas de notas', icon: 'notas' }
    ] },
    { titulo: 'Planificación', items: [
      { to: '/jefe/pgo', label: `Revisar ${t('plan').toLowerCase() === 'pgo' ? 'PGO' : 'planes'}`, icon: 'plan' },
      { to: '/jefe/avances', label: 'Validar avances', icon: 'avance' },
      { to: '/jefe/carpetas-pedagogicas', label: 'Carpetas pedagógicas', icon: 'carpeta' }
    ] },
    { titulo: 'Organización', items: [
      { to: '/jefe/materias', label: t('asignaturas'), icon: 'libro' },
      { to: '/jefe/horarios', label: 'Horarios', icon: 'reloj' }
    ] },
    { titulo: 'Convivencia', items: [
      { to: '/jefe/disciplina', label: `Disciplina de ${t('estudiantes').toLowerCase()}`, icon: 'escudo' },
      { to: '/jefe/disciplina-docentes', label: `Disciplina de ${t('docentes').toLowerCase()}`, icon: 'escudo' },
      { to: '/jefe/notificaciones', label: 'Avisos', icon: 'campana' }
    ] }
  ],
  admin: [
    { items: [{ to: '/admin', label: 'Inicio', icon: 'inicio' }] },
    { titulo: 'Configuración', items: [
      { to: '/admin/institucion', label: 'Mi institución', icon: 'edificio' },
      { to: '/admin/usuarios', label: 'Usuarios', icon: 'personas' },
      { to: '/admin/carreras', label: t('programas'), icon: 'diploma' },
      { to: '/admin/materias', label: t('asignaturas'), icon: 'libro' }
    ] }
  ]
});

const aplanar = (grupos) => grupos.flatMap((g) => g.items);

export default function Layout() {
  const { user, logout, docentePendientes, notificationsLoading, reviewPendingNotifications, setAuditPersona } = useAuth();
  const { institucion, t } = useInstitucion();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menus = construirMenu(t);
  menus.auditor = [
    ...menus.jefe,
    { titulo: 'Ver como', items: [
      { to: '/auditor/docente', label: `Vista de ${t('docente').toLowerCase()}`, icon: 'cuenta' },
      { to: '/auditor/estudiante', label: `Vista de ${t('estudiante').toLowerCase()}`, icon: 'cuenta' }
    ] }
  ];
  const roleLabel = {
    estudiante: t('estudiante'), docente: t('docente'), jefe: t('jefe'),
    admin: 'Administrador', auditor: 'Auditor'
  };
  const reubicar = (grupos, rol) => grupos.map((g) => ({
    ...g,
    items: g.items.map((item) => ({ ...item, to: item.to === `/${rol}` ? `/auditor/${rol}/inicio` : item.to.replace(`/${rol}`, `/auditor/${rol}`) }))
  }));
  const auditContext = location.pathname.startsWith('/auditor/docente')
    ? 'docente'
    : location.pathname.startsWith('/auditor/estudiante') ? 'estudiante' : null;
  const volver = (rol, etiqueta) => ({ items: [
    { to: '/jefe', label: 'Volver a la vista de auditor', icon: 'inicio' },
    { to: `/auditor/${rol}`, label: etiqueta, icon: 'personas' }
  ] });
  const grupos = user.rol === 'auditor' && auditContext === 'docente'
    ? [volver('docente', `Cambiar ${t('docente').toLowerCase()}`), ...reubicar(menus.docente, 'docente')]
    : user.rol === 'auditor' && auditContext === 'estudiante'
      ? [volver('estudiante', `Cambiar ${t('estudiante').toLowerCase()}`), ...reubicar(menus.estudiante, 'estudiante')]
      : (menus[user.rol] || []);
  const items = aplanar(grupos);
  useEffect(() => { setMenuAbierto(false); }, [location.pathname]);
  const [auditorCareers, setAuditorCareers] = useState([]);
  const [activeCareer, setActiveCareer] = useState('');
  const [changingCareer, setChangingCareer] = useState(false);
  const [auditorPeople, setAuditorPeople] = useState([]);
  const [activePerson, setActivePerson] = useState('');

  useEffect(() => {
    if (user.rol !== 'auditor') return;
    api.get('/auditor/carreras').then(({ data }) => {
      setAuditorCareers(data.carreras || []);
      setActiveCareer(String(data.carrera_activa_id || ''));
    });
  }, [user.rol]);

  useEffect(() => {
    if (user.rol !== 'auditor' || !auditContext) return;
    api.get(`/auditor/${auditContext === 'docente' ? 'docentes' : 'estudiantes'}`).then(({ data }) => {
      setAuditorPeople(data.personas || []);
      setActivePerson(String(data.active_id || ''));
      const selected = (data.personas || []).find((person) => Number(person.id) === Number(data.active_id));
      setAuditPersona(selected ? { ...selected, carrera: data.carrera?.nombre } : null);
    });
    return () => setAuditPersona(null);
  }, [user.rol, auditContext, setAuditPersona]);

  const changeAuditorCareer = async (careerId) => {
    setChangingCareer(true);
    try {
      await api.post('/auditor/carrera-activa', { carrera_id: careerId });
      setActiveCareer(String(careerId));
      window.location.reload();
    } finally {
      setChangingCareer(false);
    }
  };

  const changeAuditedPerson = async (personId) => {
    await api.post(`/auditor/${auditContext}-activo`, { [`${auditContext}_id`]: personId });
    setActivePerson(String(personId));
    window.location.reload();
  };

  const redirectAuditedLink = (event) => {
    if (user.rol !== 'auditor' || !auditContext) return;
    const button = event.target.closest('button');
    if (button && /guardar|crear|editar|eliminar|registrar|subir|enviar|calificar|inscribir|solicitar|agregar|quitar|remover|validar|aprobar|rechazar|cambiar contrase/i.test(button.textContent || '')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const anchor = event.target.closest('a');
    if (!anchor) return;
    const target = anchor.getAttribute('href') || '';
    const prefix = `/${auditContext}`;
    if (!target.startsWith(prefix)) return;
    event.preventDefault();
    const suffix = target.slice(prefix.length) || '/inicio';
    navigate(`/auditor/${auditContext}${suffix}`);
  };

  const pageName = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))?.label || '';
  const hasMandatoryNotifications = user.rol === 'docente' && docentePendientes.length > 0;

  const tipoChip = {
    informativa: 'chip-ink',
    emergencia: 'chip-crimson',
    institucional: 'chip-gold'
  };

  return (
    <>
    <div className={`app-shell ${user.rol === 'auditor' ? 'auditor-mode' : ''}`}>
      <aside className={`sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div className="brand">
          <LogoInstitucion size={42} />
          <div className="brand-text">
            <div className="brand-title-wrap">
              <span className="brand-title">{institucion.sigla || 'SEGEDU'}</span>
              <span className="brand-badge">PRO</span>
            </div>
            <div className="brand-sub" title={institucion.nombre}>{institucion.nombre}</div>
          </div>
        </div>

        <nav className="nav" aria-label="Menú principal">
          {grupos.map((grupo, i) => (
            <div className="nav-group" key={grupo.titulo || i}>
              {grupo.titulo && <div className="nav-heading">{grupo.titulo}</div>}
              {grupo.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${user.rol}` || item.to === '/jefe'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icono nombre={item.icon} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar-wrap">
              <div className="user-avatar">{user.nombre?.[0] || 'U'}{user.apellido?.[0] || ''}</div>
              <span className="user-online-dot" title="En línea" />
            </div>
            <div className="user-meta">
              <div className="user-name" title={`${user.nombre} ${user.apellido}`}>{user.nombre} {user.apellido}</div>
              <div className="user-role-badge">{roleLabel[user.rol]}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión actual">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      {menuAbierto && <button className="sidebar-velo" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-toggle" aria-label="Abrir menú" onClick={() => setMenuAbierto(true)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          
          <div className="breadcrumb">
            <span className="breadcrumb-rol">{roleLabel[user.rol]}</span>
            {pageName && (
              <>
                <span className="breadcrumb-sep" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
                <span className="breadcrumb-current">{pageName}</span>
              </>
            )}
          </div>

          {user.rol === 'auditor' && (
            <div className="auditor-career-picker">
              <span>Solo lectura</span>
              <select value={activeCareer} disabled={changingCareer} onChange={(event) => changeAuditorCareer(event.target.value)}>
                {auditorCareers.map((career) => <option key={career.id} value={career.id}>{career.nombre} ({career.codigo})</option>)}
              </select>
            </div>
          )}
          {user.rol === 'auditor' && auditContext && (
            <div className="auditor-career-picker auditor-person-picker">
              <span>{auditContext}</span>
              <select value={activePerson} onChange={(event) => changeAuditedPerson(event.target.value)}>
                {auditorPeople.map((person) => <option key={person.id} value={person.id}>{person.apellido} {person.nombre}</option>)}
              </select>
            </div>
          )}

          <div className="topbar-right">
            <div className="topbar-status">
              <span className="status-ping" />
              <span className="status-text">En línea</span>
            </div>
            <div className="topbar-date">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </header>

        <div
          className="content"
          key={location.pathname}
          onClickCapture={redirectAuditedLink}
          onSubmitCapture={(event) => { if (user.rol === 'auditor' && auditContext) event.preventDefault(); }}
        >
          {user.rol === 'auditor' && <div className="auditor-readonly-banner">Modo auditor: puede consultar toda la información seleccionada, pero no realizar modificaciones.</div>}
          <Outlet />
        </div>
      </main>
    </div>
    <Modal open={hasMandatoryNotifications} onClose={() => {}} title="Notificaciones pendientes" maxWidth="860px">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ fontSize: '.92rem', color: 'var(--ink-light)' }}>
          Debe revisar estas notificaciones antes de continuar en el sistema.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {docentePendientes.map((item) => (
            <div key={item.id} style={{ padding: '1rem 1.1rem', background: 'var(--paper-dark)', borderRadius: '10px', borderLeft: `4px solid ${item.tipo === 'emergencia' ? 'var(--crimson)' : item.tipo === 'institucional' ? 'var(--gold)' : 'var(--ink)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <strong style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>{item.titulo}</strong>
                <span className={`chip ${tipoChip[item.tipo] || 'chip-ink'}`}>{item.tipo}</span>
              </div>
              <div style={{ fontSize: '.88rem', marginTop: '.55rem', whiteSpace: 'pre-wrap' }}>{item.mensaje}</div>
              <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.7rem' }}>
                {item.carrera_nombre} · {new Date(item.created_at).toLocaleString('es-ES')} · {item.creado_nombre} {item.creado_apellido}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={reviewPendingNotifications} disabled={notificationsLoading}>
            {notificationsLoading ? 'Procesando...' : 'He revisado las notificaciones'}
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}
