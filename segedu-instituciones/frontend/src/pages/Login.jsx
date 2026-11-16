import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInstitucion, LogoInstitucion } from '../context/InstitucionContext';
import './Login.css';

// Lo que ve cada persona al entrar. Se muestra como una lista de asistencia
// para que el login ya hable el idioma del aula.
const filas = (t) => [
  { quien: t('jefe'), que: 'Ve quién está faltando y qué clases van atrasadas' },
  { quien: t('docente'), que: 'Pasa lista, registra avances y entrega su plan' },
  { quien: t('estudiante'), que: 'Revisa sus asistencias, tareas y permisos' }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { institucion, t } = useInstitucion();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.rol === 'auditor' ? '/jefe' : `/${user.rol}`);
    } catch (err) {
      setError(err.response?.data?.error || 'El correo o la contraseña no coinciden. Revise e intente otra vez.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="hero-brand">
          <LogoInstitucion size={52} />
          <div>
            <div className="hero-brandname">{institucion.nombre}</div>
            <div className="hero-lema">{institucion.lema}</div>
          </div>
        </div>

        <div className="hero-lista" aria-hidden="true">
          <div className="lista-titulo">Hoy en {institucion.sigla || 'la institución'}</div>
          {filas(t).map((fila) => (
            <div className="lista-fila" key={fila.quien}>
              <span className="lista-check">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <div>
                <div className="lista-quien">{fila.quien}</div>
                <div className="lista-que">{fila.que}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-pie">SEGEDU Instituciones, por Chakuy Software</div>
      </aside>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-h1">Iniciar sesión</h1>
          <p className="login-sub">Use el correo y la contraseña que le entregó su institución.</p>

          <div className="form-field">
            <label htmlFor="login-email">Correo</label>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@institucion.edu" autoComplete="username" required autoFocus />
          </div>

          <div className="form-field">
            <label htmlFor="login-pass">Contraseña</label>
            <input id="login-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="btn btn-primary login-submit btn-lg" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="login-ayuda">¿Olvidó su contraseña? Pida a la administración que la restablezca.</p>
        </form>
      </section>
    </div>
  );
}
