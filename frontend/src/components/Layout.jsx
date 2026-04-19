import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const menuByRole = {
  estudiante: [
    { to: '/estudiante',              label: 'Inicio',            num: '01' },
    { to: '/estudiante/cursos',       label: 'Capacitaciones',    num: '02' },
    { to: '/estudiante/info',         label: 'Datos personales',  num: '03' },
    { to: '/estudiante/asistencias',  label: 'Mi expediente',     num: '04' }
  ],
  docente: [
    { to: '/docente',              label: 'Inicio',            num: '01' },
    { to: '/docente/pgo',          label: 'PGO',               num: '02' },
    { to: '/docente/avance',       label: 'Avance de materia', num: '03' },
    { to: '/docente/comentarios',  label: 'Comentarios',       num: '04' },
    { to: '/docente/asistencia',   label: 'Lista asistencia',  num: '05' },
    { to: '/docente/disciplina',   label: 'Mi disciplina',     num: '06' }
  ],
  jefe: [
    { to: '/jefe',                      label: 'Dashboard',           num: '01' },
    { to: '/jefe/pgo',                  label: 'Revisión PGO',        num: '02' },
    { to: '/jefe/avances',              label: 'Validar avances',     num: '03' },
    { to: '/jefe/comportamiento',       label: 'Comportamientos',     num: '04' },
    { to: '/jefe/estudiantes',          label: 'Estudiantes',         num: '05' },
    { to: '/jefe/horarios',             label: 'Horarios',            num: '06' },
    { to: '/jefe/disciplina',           label: 'Disciplina est.',     num: '07' },
    { to: '/jefe/disciplina-docentes',  label: 'Disciplina doc.',     num: '08' },
    { to: '/jefe/materias',             label: 'Materias',            num: '09' }
  ],
  admin: [
    { to: '/admin',            label: 'Dashboard',       num: '01' },
    { to: '/admin/usuarios',   label: 'Usuarios',        num: '02' },
    { to: '/admin/carreras',   label: 'Carreras',        num: '03' },
    { to: '/admin/materias',   label: 'Materias',        num: '04' }
  ]
};

const roleLabel = {
  estudiante: 'Estudiante',
  docente:    'Docente',
  jefe:       'Jefe de carrera',
  admin:      'Administrador'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = menuByRole[user.rol] || [];

  const pageName = items.find(i => location.pathname === i.to || location.pathname.startsWith(i.to + '/'))?.label || '';

  return (
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
          <div className="nav-heading">Menú principal</div>
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === `/${user.rol}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-num">{it.num}</span>
              <span className="nav-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-rule" />
          <button className="logout-btn" onClick={logout}>
            <span>Cerrar sesión</span>
            <span>↗</span>
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
  );
}
