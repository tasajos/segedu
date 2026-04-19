import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const menuByRole = {
  estudiante: [
    { to: '/estudiante', label: 'Resumen', num: '01' },
    { to: '/estudiante/cursos', label: 'Capacitación', num: '02' },
    { to: '/estudiante/info', label: 'Datos personales', num: '03' },
    { to: '/estudiante/asistencias', label: 'Asistencias', num: '04' }
  ],
  docente: [
    { to: '/docente', label: 'Resumen', num: '01' },
    { to: '/docente/pgo', label: 'PGO', num: '02' },
    { to: '/docente/avance', label: 'Avance de materia', num: '03' },
    { to: '/docente/comentarios', label: 'Comentarios', num: '04' }
  ],
  jefe: [
    { to: '/jefe', label: 'Dashboard', num: '01' },
    { to: '/jefe/pgo', label: 'Revisión de PGO', num: '02' },
    { to: '/jefe/avances', label: 'Validar avances', num: '03' },
    { to: '/jefe/comportamiento', label: 'Comportamientos', num: '04' },
    { to: '/jefe/estudiantes', label: 'Estudiantes', num: '05' }
  ]
};

const roleLabel = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  jefe: 'Jefatura de carrera'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = menuByRole[user.rol] || [];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-title">Academia</div>
            <div className="brand-sub">Est. MMXXVI</div>
          </div>
        </div>

        <div className="user-card">
          <div className="user-avatar">
            {user.nombre?.[0]}{user.apellido?.[0]}
          </div>
          <div className="user-meta">
            <div className="user-name">{user.nombre} {user.apellido}</div>
            <div className="user-role">{roleLabel[user.rol]}</div>
          </div>
        </div>

        <div className="sidebar-rule" />

        <nav className="nav">
          <div className="nav-heading">Índice</div>
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === `/${user.rol}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-num">{it.num}</span>
              <span className="nav-label">{it.label}</span>
              <span className="nav-indicator" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-rule" />
          <button className="logout-btn" onClick={logout}>
            <span>Cerrar sesión</span>
            <span>↗</span>
          </button>
          <div className="footer-note">
            Sistema de seguimiento<br/>
            académico · 2026
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span className="text-mono">{user.rol.toUpperCase()}</span>
            <span className="breadcrumb-sep">/</span>
            <span>{location.pathname}</span>
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
