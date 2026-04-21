import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

// Estudiante
import EstudianteInicio from './pages/estudiante/Inicio';
import EstudianteCursos from './pages/estudiante/Cursos';
import EstudianteInfoPersonal from './pages/estudiante/InfoPersonal';
import EstudianteAsistencias from './pages/estudiante/Asistencias';

// Docente
import DocenteInicio from './pages/docente/Inicio';
import DocentePGO from './pages/docente/PGO';
import DocenteAvance from './pages/docente/Avance';
import DocenteComentarios from './pages/docente/Comentarios';
import DocenteAsistencia from './pages/docente/Asistencia';
import DocenteDisciplina from './pages/docente/MiDisciplina';

// Jefe
import JefeDashboard from './pages/jefe/Dashboard';
import JefePGO from './pages/jefe/PGO';
import JefeAvances from './pages/jefe/Avances';
import JefeComportamiento from './pages/jefe/Comportamiento';
import JefeAsistencias from './pages/jefe/Asistencias';
import JefeEstudiantes from './pages/jefe/Estudiantes';
import JefeHorarios from './pages/jefe/Horarios';
import JefeDisciplina from './pages/jefe/Disciplina';
import JefeDisciplinaDocentes from './pages/jefe/DisciplinaDocentes';
import JefeMaterias from './pages/jefe/Materias';
import JefeMateriaEstudiantes from './pages/jefe/MateriaEstudiantes';
import JefeMateriaForm from './pages/jefe/MateriaForm';
import JefeNotificaciones from './pages/jefe/Notificaciones';
import JefeActas from './pages/jefe/Actas';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminCarreras from './pages/admin/Carreras';
import AdminMaterias from './pages/admin/Materias';
import AdminMateriaForm from './pages/admin/MateriaForm';

const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'estudiante') return <Navigate to="/estudiante" replace />;
  if (user.rol === 'docente') return <Navigate to="/docente" replace />;
  if (user.rol === 'jefe') return <Navigate to="/jefe" replace />;
  if (user.rol === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Estudiante */}
      <Route path="/estudiante" element={<Protected roles={['estudiante']}><Layout /></Protected>}>
        <Route index element={<EstudianteInicio />} />
        <Route path="cursos" element={<EstudianteCursos />} />
        <Route path="info" element={<EstudianteInfoPersonal />} />
        <Route path="asistencias" element={<EstudianteAsistencias />} />
      </Route>

      {/* Docente */}
      <Route path="/docente" element={<Protected roles={['docente']}><Layout /></Protected>}>
        <Route index element={<DocenteInicio />} />
        <Route path="pgo" element={<DocentePGO />} />
        <Route path="avance" element={<DocenteAvance />} />
        <Route path="comentarios" element={<DocenteComentarios />} />
        <Route path="asistencia" element={<DocenteAsistencia />} />
        <Route path="disciplina" element={<DocenteDisciplina />} />
      </Route>

      {/* Jefe */}
      <Route path="/jefe" element={<Protected roles={['jefe']}><Layout /></Protected>}>
        <Route index element={<JefeDashboard />} />
        <Route path="pgo" element={<JefePGO />} />
        <Route path="avances" element={<JefeAvances />} />
        <Route path="comportamiento" element={<JefeComportamiento />} />
        <Route path="asistencias" element={<JefeAsistencias />} />
        <Route path="estudiantes" element={<JefeEstudiantes />} />
        <Route path="horarios" element={<JefeHorarios />} />
        <Route path="disciplina" element={<JefeDisciplina />} />
        <Route path="disciplina-docentes" element={<JefeDisciplinaDocentes />} />
        <Route path="materias" element={<JefeMaterias />} />
        <Route path="notificaciones" element={<JefeNotificaciones />} />
        <Route path="actas" element={<JefeActas />} />
        <Route path="materias/:id/estudiantes" element={<JefeMateriaEstudiantes />} />
        <Route path="materias/nueva" element={<JefeMateriaForm role="jefe" />} />
        <Route path="materias/:id/editar" element={<JefeMateriaForm role="jefe" />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<Protected roles={['admin']}><Layout /></Protected>}>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="carreras" element={<AdminCarreras />} />
        <Route path="materias" element={<AdminMaterias />} />
        <Route path="materias/nueva" element={<AdminMateriaForm role="admin" />} />
        <Route path="materias/:id/editar" element={<AdminMateriaForm role="admin" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
