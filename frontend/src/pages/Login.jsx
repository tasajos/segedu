import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const demos = [
  { rol: 'Estudiante', email: 'estudiante@uni.edu', color: 'gold' },
  { rol: 'Docente', email: 'docente@uni.edu', color: 'forest' },
  { rol: 'Jefe', email: 'jefe@uni.edu', color: 'crimson' }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.rol}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo — escenario editorial */}
      <aside className="login-hero">
        <div className="hero-top">
          <div className="hero-brand">
            <div className="hero-mark">A</div>
            <span className="hero-brandname">Academia</span>
          </div>
          <span className="hero-year">MMXXVI</span>
        </div>

        <div className="hero-body">
          <div className="hero-eyebrow">Vol. I · Ed. 2026 — Cochabamba</div>
          <h1 className="hero-title">
            El acto de<br/>
            <span className="italic">enseñar,</span><br/>
            <span className="italic">aprender,</span><br/>
            <span className="underline-gold">observar.</span>
          </h1>
          <p className="hero-quote">
            «La universidad no es el edificio ni el título;<br/>
            es el rigor con que medimos el avance.»
          </p>
        </div>

        <div className="hero-foot">
          <div className="hero-stat">
            <div className="hero-stat-num">01</div>
            <div className="hero-stat-label">Estudiantes</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">02</div>
            <div className="hero-stat-label">Docentes</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">03</div>
            <div className="hero-stat-label">Jefatura</div>
          </div>
        </div>

        <div className="hero-ornament" aria-hidden>
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4"/>
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3"/>
            <circle cx="100" cy="100" r="4" fill="currentColor"/>
          </svg>
        </div>
      </aside>

      {/* Panel derecho — formulario */}
      <section className="login-form-wrap">
        <div className="login-form">
          <div className="login-form-head">
            <div className="eyebrow">Ingreso al sistema</div>
            <h2 className="login-h2">Bienvenido<span className="text-gold">.</span></h2>
            <p className="login-sub">Introduzca sus credenciales para continuar al panel académico.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Correo institucional</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@uni.edu"
                required
                autoFocus
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

            <button className="btn btn-primary login-submit" disabled={loading}>
              {loading ? <span className="loading-dots"><span/><span/><span/></span> : (<><span>Entrar</span><span>→</span></>)}
            </button>
          </form>

          <div className="login-divider">
            <span>accesos de demostración</span>
          </div>

          <div className="login-demos">
            {demos.map(d => (
              <button
                key={d.email}
                type="button"
                className={`demo-chip demo-${d.color}`}
                onClick={() => setEmail(d.email)}
              >
                <span className="demo-label">{d.rol}</span>
                <span className="demo-email">{d.email}</span>
              </button>
            ))}
          </div>

          <div className="login-foot">
            Contraseña común en demo: <code>password123</code>
          </div>
        </div>
      </section>
    </div>
  );
}
