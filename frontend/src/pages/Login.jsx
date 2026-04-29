import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
            <img src="/ch_tr.png" className="hero-mark" alt="SEGEDU" />
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

          <div className="login-credit">
            Desarrollado por <strong>Carlos Andrés Azcarraga Esquivel</strong> · Chakuy Software
          </div>
        </div>
      </section>
    </div>
  );
}
