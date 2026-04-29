import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';

export default function DocenteDatosPersonales() {
  const { user } = useAuth();
  const [form, setForm] = useState({ nombre: '', apellido: '', ci: '', telefono: '' });
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [msg, setMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/auth/profile');
      setForm({ nombre: data.nombre || '', apellido: data.apellido || '', ci: data.ci || '', telefono: data.telefono || '' });
    })();
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await api.put('/docente/info-personal', form);
      setMsg('OK Información actualizada correctamente');
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setPasswordLoading(true); setPasswordMsg('');
    try {
      await api.put('/docente/cambiar-contrasena', passwordForm);
      setPasswordForm({ actual: '', nueva: '', confirmar: '' });
      setPasswordMsg('OK Contraseña actualizada correctamente');
      setTimeout(() => setPasswordMsg(''), 3500);
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally { setPasswordLoading(false); }
  };

  return (
    <>
      <PageHeader
        num="10"
        eyebrow="Ficha del docente"
        title={<>Datos <span className="display-italic">personales</span></>}
        lead="Mantenga su información actualizada. Puede cambiar su contraseña en cualquier momento desde esta sección."
      />

      <div className="grid-2">
        {/* Tarjeta ficha */}
        <div className="ficha-card">
          <div className="ficha-head">
            <div>
              <div className="eyebrow">Docente</div>
              <h2 style={{ marginTop: '.5rem', fontSize: '1.75rem' }}>{form.nombre} {form.apellido}</h2>
            </div>
            <div className="ficha-avatar">{form.nombre?.[0]}{form.apellido?.[0]}</div>
          </div>

          <div className="ficha-body">
            <FichaRow label="Correo institucional" value={user?.email || '—'} />
            <FichaRow label="Carnet de identidad" value={form.ci || 'sin registrar'} />
            <FichaRow label="Teléfono" value={form.telefono || 'sin registrar'} />
          </div>

          <div className="ficha-stamp">
            <div className="stamp-inner">
              <span>Chakuy Software</span>
              <span className="stamp-year">Desarrollado por Carlos Azcarraga Esquivel</span>
            </div>
          </div>
        </div>

        {/* Formularios */}
        <div className="card">
          {/* Editar información */}
          <h3 style={{ marginBottom: '1.5rem' }}>Editar información</h3>
          <form onSubmit={guardar}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-field">
                <label>Nombre</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>Apellido</label>
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
              </div>
            </div>
            <div className="form-field">
              <label>Carnet de identidad (CI)</label>
              <input value={form.ci} onChange={e => setForm({ ...form, ci: e.target.value })} placeholder="1234567" />
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="7xxxxxxx" />
            </div>

            {msg && <Alerta msg={msg} />}

            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>

          <div className="rule-thin" style={{ margin: '1.75rem 0' }} />

          {/* Cambiar contraseña */}
          <h3 style={{ marginBottom: '1.5rem' }}>Cambiar contraseña</h3>
          <form onSubmit={cambiarContrasena}>
            <div className="form-field">
              <label>Contraseña actual</label>
              <input type="password" value={passwordForm.actual}
                onChange={e => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                autoComplete="current-password" required />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-field">
                <label>Nueva contraseña</label>
                <input type="password" value={passwordForm.nueva}
                  onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                  autoComplete="new-password" minLength={6} required />
              </div>
              <div className="form-field">
                <label>Confirmar contraseña</label>
                <input type="password" value={passwordForm.confirmar}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                  autoComplete="new-password" minLength={6} required />
              </div>
            </div>

            {passwordMsg && <Alerta msg={passwordMsg} />}

            <button className="btn btn-secondary" disabled={passwordLoading}>
              {passwordLoading ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .ficha-card {
          background: var(--paper-light);
          border: 1px solid var(--line-strong);
          border-radius: 3px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .ficha-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: repeating-linear-gradient(45deg, var(--ink) 0 8px, var(--paper) 8px 16px);
        }
        .ficha-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--ink);
        }
        .ficha-avatar {
          width: 72px; height: 72px;
          background: var(--ink);
          color: var(--gold);
          display: grid; place-items: center;
          font-family: var(--serif);
          font-size: 1.75rem;
          border-radius: 50%;
          border: 2px solid var(--gold);
        }
        .ficha-body { display: flex; flex-direction: column; }
        .ficha-stamp {
          position: absolute;
          right: 2rem; bottom: 2rem;
          width: 150px; height: 150px;
          border: 2px solid var(--crimson);
          border-radius: 50%;
          display: grid; place-items: center;
          transform: rotate(-8deg);
          opacity: 0.6;
        }
        .stamp-inner {
          width: 124px; height: 124px;
          border: 1px dashed var(--crimson);
          border-radius: 50%;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          font-family: var(--serif);
          color: var(--crimson);
          text-align: center;
          line-height: 1.15;
          padding: .8rem;
        }
        .stamp-inner span:first-child { font-size: .95rem; font-weight: 700; }
        .stamp-year { font-family: var(--mono); font-size: .5rem; letter-spacing: .04em; margin-top: 7px; text-transform: uppercase; }
      `}</style>
    </>
  );
}

const FichaRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '.75rem 0', borderBottom: '1px dashed var(--line)' }}>
    <div style={{ flex: '0 0 40%', fontFamily: 'var(--mono)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>{label}</div>
    <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{value}</div>
  </div>
);

const Alerta = ({ msg }) => {
  const ok = msg.startsWith('OK');
  return (
    <div style={{
      padding: '.75rem 1rem', marginBottom: '1rem', borderRadius: '2px',
      background: ok ? 'rgba(58,90,63,0.08)' : 'rgba(139,42,42,0.08)',
      borderLeft: `3px solid ${ok ? 'var(--forest)' : 'var(--crimson)'}`,
      fontSize: '.85rem', color: ok ? 'var(--forest)' : 'var(--crimson)'
    }}>
      {ok ? `✓ ${msg.replace(/^OK\s*/, '')}` : msg}
    </div>
  );
};
