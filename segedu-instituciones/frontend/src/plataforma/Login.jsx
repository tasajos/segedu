import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlataformaAuth } from './PlataformaAuthContext';
import { mensajeError } from './utils';
import '../pages/Login.css';

export default function Login() {
  const { user, login } = usePlataformaAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  const ingresar = async event => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try { await login(email.trim(), password); }
    catch (err) { setError(mensajeError(err)); }
    finally { setLoading(false); }
  };
  return <main className="login-page">
    <aside className="login-hero">
      <div className="login-hero-glow" />
      <div className="hero-brand"><div className="hero-logo-box"><img src="/chakuy.png" alt="Chakuy Software" width="64" height="64" /></div>
        <div><div className="hero-brandname">SEGEDU · Plataforma Chakuy</div><div className="hero-lema">Administración de instituciones</div></div>
      </div>
      <div className="hero-features"><div className="hero-features-title"><span className="hero-features-dot" />Un espacio para cada institución</div>
        <div className="hero-features-list">{[
          ['Instituciones', 'Cree colegios, institutos y universidades con su propia dirección.'],
          ['Accesos', 'Administre el estado de cada institución y sus credenciales.'],
          ['Seguimiento', 'Consulte la configuración y el historial de acciones.']
        ].map(([titulo, texto]) => <div className="hero-feature-card" key={titulo}><div className="hero-feature-text"><div className="hero-feature-role">{titulo}</div><p className="hero-feature-desc">{texto}</p></div></div>)}</div>
      </div>
      <div className="hero-footer"><p className="hero-security-pill">Acceso exclusivo para Chakuy Software</p></div>
    </aside>
    <section className="login-form-wrap"><div className="login-card">
      <div className="login-card-head"><h1 className="login-h1">Bienvenido</h1><p className="login-sub">Ingrese con su cuenta de superadministrador.</p></div>
      <form className="login-form" onSubmit={ingresar}>
        <div className="form-field"><label htmlFor="plataforma-email">Correo</label><input id="plataforma-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} /></div>
        <div className="form-field"><label htmlFor="plataforma-password">Contraseña</label><input id="plataforma-password" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          <button type="button" className="btn btn-ghost btn-sm mt-2" aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Ocultar contraseña' : 'Ver contraseña'}</button></div>
        {error && <p className="login-error-alert" role="alert">{error}</p>}
        <button className="btn btn-primary login-submit" disabled={loading} aria-busy={loading}>{loading ? 'Ingresando…' : 'Ingresar a la plataforma'}</button>
      </form>
    </div></section>
  </main>;
}
