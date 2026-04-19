import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';

export default function EstudianteInfoPersonal() {
  const { user } = useAuth();
  const [form, setForm] = useState({ nombre: '', apellido: '', ci: '', telefono: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      await api.put('/estudiante/info-personal', form);
      setMsg('✓ Información actualizada correctamente');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Ficha del estudiante"
        title={<>Datos <span className="display-italic">personales</span></>}
        lead="Mantenga esta información actualizada para garantizar correcta comunicación institucional."
      />

      <div className="grid-2">
        {/* Tarjeta de ficha */}
        <div className="ficha-card">
          <div className="ficha-head">
            <div>
              <div className="eyebrow">Ficha № {user.codigo_estudiante || '—'}</div>
              <h2 style={{ marginTop: '.5rem', fontSize: '1.75rem' }}>{form.nombre} {form.apellido}</h2>
            </div>
            <div className="ficha-avatar">{form.nombre?.[0]}{form.apellido?.[0]}</div>
          </div>

          <div className="ficha-body">
            <FichaRow label="Carrera" value={user.carrera || '—'} />
            <FichaRow label="Semestre actual" value={user.semestre || '—'} />
            <FichaRow label="Correo institucional" value={user.email} />
            <FichaRow label="Carnet de identidad" value={form.ci || 'sin registrar'} />
            <FichaRow label="Teléfono" value={form.telefono || 'sin registrar'} />
          </div>

          <div className="ficha-stamp">
            <div className="stamp-inner">
              <span>Academia</span>
              <span className="stamp-year">MMXXVI</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Editar información</h3>
          <form onSubmit={guardar}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-field">
                <label>Nombre</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required/>
              </div>
              <div className="form-field">
                <label>Apellido</label>
                <input value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} required/>
              </div>
            </div>
            <div className="form-field">
              <label>Carnet de identidad (CI)</label>
              <input value={form.ci} onChange={e => setForm({...form, ci: e.target.value})} placeholder="1234567"/>
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="7xxxxxxx"/>
            </div>

            {msg && (
              <div style={{
                padding: '.75rem 1rem', marginBottom: '1rem', borderRadius: '2px',
                background: msg.startsWith('✓') ? 'rgba(58,90,63,0.08)' : 'rgba(139,42,42,0.08)',
                borderLeft: `3px solid ${msg.startsWith('✓') ? 'var(--forest)' : 'var(--crimson)'}`,
                fontSize: '.85rem', color: msg.startsWith('✓') ? 'var(--forest)' : 'var(--crimson)'
              }}>{msg}</div>
            )}

            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
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
          width: 110px; height: 110px;
          border: 2px solid var(--crimson);
          border-radius: 50%;
          display: grid; place-items: center;
          transform: rotate(-8deg);
          opacity: 0.6;
        }
        .stamp-inner {
          width: 90px; height: 90px;
          border: 1px dashed var(--crimson);
          border-radius: 50%;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          font-family: var(--serif);
          color: var(--crimson);
          text-align: center;
          line-height: 1;
        }
        .stamp-inner span:first-child { font-size: .95rem; font-weight: 500; }
        .stamp-year { font-family: var(--mono); font-size: .65rem; letter-spacing: .15em; margin-top: 4px; }
      `}</style>
    </>
  );
}

const FichaRow = ({ label, value }) => (
  <div className="ficha-row" style={{ display: 'flex', padding: '.75rem 0', borderBottom: '1px dashed var(--line)' }}>
    <div style={{ flex: '0 0 40%', fontFamily: 'var(--mono)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>{label}</div>
    <div style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{value}</div>
  </div>
);
