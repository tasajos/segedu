import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import './Layout.css';

const menuByRole = {
  estudiante: [
    { to: '/estudiante', label: 'Inicio', num: '01' },
    { to: '/estudiante/cursos', label: 'Capacitaciones', num: '02' },
    { to: '/estudiante/info', label: 'Datos personales', num: '03' },
    { to: '/estudiante/asistencias', label: 'Asistencias y permisos', num: '04' },
    { to: '/estudiante/tareas', label: 'Mis tareas', num: '05' },
    { to: '/estudiante/grupos', label: 'Grupos de trabajo', num: '06' },
    { to: '/estudiante/unidades', label: 'Unidades instrucción', num: '07' },
    { to: '/estudiante/presentaciones', label: 'Presentaciones', num: '08' }
  ],
  docente: [
    { to: '/docente', label: 'Inicio', num: '01' },
    { to: '/docente/pgo', label: 'PGO', num: '02' },
    { to: '/docente/avance', label: 'Avance de materia', num: '03' },
    { to: '/docente/comentarios', label: 'Comentarios', num: '04' },
    { to: '/docente/asistencia', label: 'Lista asistencia', num: '05' },
    { to: '/docente/disciplina', label: 'Mi disciplina', num: '06' },
    { to: '/docente/tareas', label: 'Tareas del curso', num: '07' },
    { to: '/docente/unidades', label: 'Unidades instrucción', num: '08' },
    { to: '/docente/presentaciones', label: 'Presentaciones', num: '09' }
  ],
  jefe: [
    { to: '/jefe', label: 'Dashboard', num: '01' },
    { to: '/jefe/pgo', label: 'Revision PGO', num: '02' },
    { to: '/jefe/avances', label: 'Validar avances', num: '03' },
    { to: '/jefe/comportamiento', label: 'Comportamientos', num: '04' },
    { to: '/jefe/asistencias', label: 'Asistencias est.', num: '05' },
    { to: '/jefe/estudiantes', label: 'Estudiantes', num: '06' },
    { to: '/jefe/horarios', label: 'Horarios', num: '07' },
    { to: '/jefe/disciplina', label: 'Disciplina est.', num: '08' },
    { to: '/jefe/disciplina-docentes', label: 'Disciplina doc.', num: '09' },
    { to: '/jefe/materias', label: 'Materias', num: '10' },
    { to: '/jefe/notificaciones', label: 'Notificaciones', num: '11' },
    { to: '/jefe/actas', label: 'Actas', num: '12' },
    { to: '/jefe/unidades', label: 'Unidades instrucción', num: '13' },
    { to: '/jefe/presentaciones', label: 'Presentaciones', num: '14' }
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', num: '01' },
    { to: '/admin/usuarios', label: 'Usuarios', num: '02' },
    { to: '/admin/carreras', label: 'Carreras', num: '03' },
    { to: '/admin/materias', label: 'Materias', num: '04' }
  ]
};

const roleLabel = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  jefe: 'Jefe de carrera',
  admin: 'Administrador'
};

export default function Layout() {
  const { user, logout, docentePendientes, notificationsLoading, reviewPendingNotifications } = useAuth();
  const location = useLocation();
  const items = menuByRole[user.rol] || [];

  const pageName = items.find((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))?.label || '';
  const hasMandatoryNotifications = user.rol === 'docente' && docentePendientes.length > 0;

  const tipoChip = {
    informativa: 'chip-ink',
    emergencia: 'chip-crimson',
    institucional: 'chip-gold'
  };

  return (
    <>
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-title">SEGEDU</div>
            <div className="brand-sub">Seguimiento Universitario</div>
          </div>
        </div>

        <div className="user-card">
          <div className="user-avatar">{user.nombre?.[0]}{user.apellido?.[0]}</div>
          <div>
            <div className="user-name">{user.nombre} {user.apellido}</div>
            <div className="user-role">{roleLabel[user.rol]}</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-heading">Menu principal</div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${user.rol}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-num">{item.num}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-rule" />
          <button className="logout-btn" onClick={logout}>
            <span>Cerrar sesion</span>
            <span>↑</span>
          </button>
          <div className="footer-note">SEGEDU · v2.0 · 2026</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span style={{ color: 'var(--blue-600)', fontWeight: 700 }}>
              {roleLabel[user.rol]}
            </span>
            <span className="breadcrumb-sep">/</span>
            <span>{pageName}</span>
          </div>
          <div className="topbar-date">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="content fade-up" key={location.pathname}>
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
            <div key={item.id} style={{ padding: '1rem 1.1rem', background: 'var(--paper-dark)', borderRadius: '2px', borderLeft: `4px solid ${item.tipo === 'emergencia' ? 'var(--crimson)' : item.tipo === 'institucional' ? 'var(--gold)' : 'var(--ink)'}` }}>
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
