import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const demos = [
  { rol: 'Estudiante', email: 'estudiante@uni.edu', color: 'gold' },
  { rol: 'Docente',    email: 'docente@uni.edu',    color: 'forest' },
  { rol: 'Jefatura',  email: 'jefe@uni.edu',        color: 'crimson' }
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.rol}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <aside className="login-hero">
        <div className="hero-top">
          <div className="hero-brand">
            <div className="hero-mark">S</div>
            <span className="hero-brandname">SEGEDU</span>
          </div>
          <span className="hero-year">2026</span>
        </div>

        <div className="hero-body">
          <div className="hero-eyebrow">Sistema de seguimiento universitario</div>
          <h1 className="hero-title">
            Gestión académica<br/>
            <span className="italic">inteligente</span><br/>
            y centralizada.
          </h1>
          <p className="hero-quote">
            Seguimiento completo de estudiantes, docentes y programas académicos en una sola plataforma.
          </p>
        </div>

        <div className="hero-foot">
          <div className="hero-stat">
            <div className="hero-stat-num">3</div>
            <div className="hero-stat-label">Perfiles</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">100%</div>
            <div className="hero-stat-label">En línea</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">2026</div>
            <div className="hero-stat-label">Versión</div>
          </div>
        </div>
      </aside>

      {/* Panel formulario */}
      <section className="login-form-wrap">
        <div className="login-form">
          <div className="login-form-head">
            <div className="eyebrow">Acceso al sistema</div>
            <h2 className="login-h2">Iniciar sesión</h2>
            <p className="login-sub">Ingrese sus credenciales institucionales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Correo institucional</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@uni.edu"
                required autoFocus
              />
            </div>

            <div className="form-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="form-error">⚠ {error}</div>}

            <button className="btn btn-primary login-submit btn-lg" disabled={loading}>
              {loading
                ? <span className="loading-dots"><span/><span/><span/></span>
                : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="login-divider"><span>Cuentas de demostración</span></div>

          <div className="login-demos">
            {demos.map(d => (
              <button key={d.email} type="button"
                className={`demo-chip demo-${d.color}`}
                onClick={() => setEmail(d.email)}>
                <span className="demo-label">{d.rol}</span>
                <span className="demo-email">{d.email}</span>
              </button>
            ))}
          </div>

          <div className="login-foot">
            Contraseña demo: <code>password123</code>
          </div>
        </div>
      </section>
    </div>
  );
}
