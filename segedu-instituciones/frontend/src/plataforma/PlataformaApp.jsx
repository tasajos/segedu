import { useEffect } from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { PlataformaAuthProvider, usePlataformaAuth } from './PlataformaAuthContext';
import Login from './Login';
import Instituciones from './Instituciones';

function Layout() {
  const { user, logout } = usePlataformaAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <div className="plataforma-app">
    <header className="plataforma-topbar">
      <Link to="/" className="plataforma-brand"><img src="/chakuy.png" alt="Chakuy" width="46" height="46" /><span>SEGEDU <small>Plataforma Chakuy</small></span></Link>
      <div className="plataforma-session"><span>{user.nombre}</span><button className="btn btn-secondary btn-sm" onClick={logout}>Cerrar sesión</button></div>
    </header>
    <main className="plataforma-main"><Outlet /></main>
  </div>;
}

function Sesion() {
  const { loading, error, reintentar, logout } = usePlataformaAuth();
  if (loading) return <main className="contexto-page"><div className="loading-state" role="status">Cargando sesión de plataforma…</div></main>;
  if (error) return <main className="contexto-page"><div className="error-state" role="alert"><p>{error}</p><div className="plataforma-actions mt-4">
    <button className="btn btn-primary" onClick={reintentar}>Reintentar</button><button className="btn btn-secondary" onClick={logout}>Volver al login</button>
  </div></div></main>;
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Layout />}>
      <Route index element={<Instituciones />} />
      <Route path="instituciones/:id" element={<Instituciones detalle />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function PlataformaApp() {
  useEffect(() => { document.title = 'SEGEDU · Plataforma Chakuy'; }, []);
  return <PlataformaAuthProvider><Sesion /></PlataformaAuthProvider>;
}
