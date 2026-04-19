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

// Jefe
import JefeDashboard from './pages/jefe/Dashboard';
import JefePGO from './pages/jefe/PGO';
import JefeAvances from './pages/jefe/Avances';
import JefeComportamiento from './pages/jefe/Comportamiento';
import JefeEstudiantes from './pages/jefe/Estudiantes';

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
      </Route>

      {/* Jefe */}
      <Route path="/jefe" element={<Protected roles={['jefe']}><Layout /></Protected>}>
        <Route index element={<JefeDashboard />} />
        <Route path="pgo" element={<JefePGO />} />
        <Route path="avances" element={<JefeAvances />} />
        <Route path="comportamiento" element={<JefeComportamiento />} />
        <Route path="estudiantes" element={<JefeEstudiantes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
