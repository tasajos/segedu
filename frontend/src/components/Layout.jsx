import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import './Layout.css';

const menuByRole = {
  estudiante: [
    { to: '/estudiante', label: 'Inicio', num: '01' },
    { to: '/estudiante/cursos', label: 'Capacitaciones', num: '02' },
    { to: '/estudiante/cursos-especiales', label: 'Cursos especiales', num: '03' },
    { to: '/estudiante/mis-cursos-especiales', label: 'Mis cursos', num: '04' },
    { to: '/estudiante/info', label: 'Datos personales', num: '05' },
    { to: '/estudiante/asistencias', label: 'Asistencias y permisos', num: '06' },
    { to: '/estudiante/tareas', label: 'Mis tareas', num: '07' },
    { to: '/estudiante/grupos', label: 'Grupos de trabajo', num: '08' },
    { to: '/estudiante/unidades', label: 'Unidades instrucción', num: '09' },
    { to: '/estudiante/presentaciones', label: 'Presentaciones', num: '10' }
  ],
  docente: [
    { to: '/docente', label: 'Inicio', num: '01' },
    { to: '/docente/datos-personales', label: 'Datos personales', num: '02' },
    { to: '/docente/pgo', label: 'PGO', num: '03' },
    { to: '/docente/avance', label: 'Avance de materia', num: '04' },
    { to: '/docente/comentarios', label: 'Comentarios', num: '05' },
    { to: '/docente/asistencia', label: 'Lista asistencia', num: '06' },
    { to: '/docente/disciplina', label: 'Mi disciplina', num: '07' },
    { to: '/docente/tareas', label: 'Tareas del curso', num: '08' },
    { to: '/docente/grupos-trabajo', label: 'Grupos de trabajo', num: '09' },
    { to: '/docente/carpeta-pedagogica', label: 'Carpeta pedagogica', num: '10' },
    { to: '/docente/unidades', label: 'Unidades instrucción', num: '10' },
    { to: '/docente/presentaciones', label: 'Presentaciones', num: '11' }
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
    { to: '/jefe/carpetas-pedagogicas', label: 'Carpetas pedagogicas', num: '13' },
    { to: '/jefe/unidades', label: 'Unidades instrucción', num: '14' },
    { to: '/jefe/presentaciones', label: 'Presentaciones', num: '15' },
    { to: '/jefe/cursos-especiales', label: 'Cursos especiales', num: '16' }
  ],
  auditor: [
    { to: '/jefe', label: 'Dashboard', num: '01' },
    { to: '/jefe/pgo', label: 'PGO', num: '02' },
    { to: '/jefe/avances', label: 'Avances', num: '03' },
    { to: '/jefe/comportamiento', label: 'Comportamientos', num: '04' },
    { to: '/jefe/asistencias', label: 'Asistencias est.', num: '05' },
    { to: '/jefe/estudiantes', label: 'Estudiantes', num: '06' },
    { to: '/jefe/horarios', label: 'Horarios', num: '07' },
    { to: '/jefe/disciplina', label: 'Disciplina est.', num: '08' },
    { to: '/jefe/disciplina-docentes', label: 'Disciplina doc.', num: '09' },
    { to: '/jefe/materias', label: 'Materias', num: '10' },
    { to: '/jefe/notificaciones', label: 'Notificaciones', num: '11' },
    { to: '/jefe/actas', label: 'Actas', num: '12' },
    { to: '/jefe/carpetas-pedagogicas', label: 'Carpetas pedagogicas', num: '13' },
    { to: '/jefe/unidades', label: 'Unidades instruccion', num: '14' },
    { to: '/jefe/presentaciones', label: 'Presentaciones', num: '15' },
    { to: '/jefe/cursos-especiales', label: 'Cursos especiales', num: '16' },
    { to: '/auditor/docente', label: 'Vista docente', num: '17' },
    { to: '/auditor/estudiante', label: 'Vista estudiante', num: '18' }
  ],
  instructor: [
    { to: '/instructor', label: 'Mis cursos', num: '01' },
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
  admin: 'Administrador',
  instructor: 'Instructor',
  auditor: 'Auditor'
};

export default function Layout() {
  const { user, logout, docentePendientes, notificationsLoading, reviewPendingNotifications, setAuditPersona } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const auditContext = location.pathname.startsWith('/auditor/docente')
    ? 'docente'
    : location.pathname.startsWith('/auditor/estudiante') ? 'estudiante' : null;
  const auditTeacherMenu = [
    { to: '/jefe', label: 'Volver a vista auditor', num: '←' },
    { to: '/auditor/docente', label: 'Cambiar docente', num: '00' },
    ...menuByRole.docente.map((item) => ({ ...item, to: item.to.replace('/docente', '/auditor/docente').replace('/auditor/docente', item.to === '/docente' ? '/auditor/docente/inicio' : '/auditor/docente') }))
  ];
  const auditStudentMenu = [
    { to: '/jefe', label: 'Volver a vista auditor', num: '←' },
    { to: '/auditor/estudiante', label: 'Cambiar estudiante', num: '00' },
    ...menuByRole.estudiante.map((item) => ({ ...item, to: item.to.replace('/estudiante', '/auditor/estudiante').replace('/auditor/estudiante', item.to === '/estudiante' ? '/auditor/estudiante/inicio' : '/auditor/estudiante') }))
  ];
  const items = user.rol === 'auditor' && auditContext === 'docente'
    ? auditTeacherMenu
    : user.rol === 'auditor' && auditContext === 'estudiante' ? auditStudentMenu : (menuByRole[user.rol] || []);
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
      <aside className="sidebar">
        <div className="brand">
          <img src="/ch_tr.png" className="brand-mark" alt="SEGEDU" />
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
          <div className="topbar-date">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div
          className="content fade-up"
          key={location.pathname}
          onClickCapture={redirectAuditedLink}
          onSubmitCapture={(event) => { if (user.rol === 'auditor' && auditContext) event.preventDefault(); }}
        >
          {user.rol === 'auditor' && <div className="auditor-readonly-banner">Modo auditor: puede consultar toda la información de la carrera seleccionada, pero no realizar modificaciones.</div>}
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
