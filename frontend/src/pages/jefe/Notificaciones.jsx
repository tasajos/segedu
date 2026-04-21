import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const EMPTY_FORM = {
  tipo: 'informativa',
  titulo: '',
  mensaje: ''
};

const CHIP_CLASS = {
  informativa: 'chip-ink',
  emergencia: 'chip-crimson',
  institucional: 'chip-gold'
};

const TYPE_LABEL = {
  informativa: 'Informativa',
  emergencia: 'Emergencia',
  institucional: 'Institucional'
};

export default function JefeNotificaciones() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jefe/notificaciones');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const submit = async () => {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setError('Debe completar titulo y mensaje.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/jefe/notificaciones', form);
      setForm(EMPTY_FORM);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la notificacion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        num="11"
        eyebrow="Comunicacion oficial"
        title={<>Centro de <span className="display-italic">notificaciones</span></>}
        lead="Envie avisos informativos, de emergencia o institucionales. Los docentes deben revisarlos al iniciar sesion antes de continuar."
      />

      <div className="grid-2">
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-head">
            <h2>Nueva notificacion</h2>
            <span className="count">obligatoria para docentes</span>
          </div>

          <div style={{ display: 'grid', gap: '.9rem', marginTop: '1rem' }}>
            <div>
              <label className="form-label">Tipo</label>
              <select className="form-input" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                <option value="informativa">Informativa</option>
                <option value="emergencia">Emergencia</option>
                <option value="institucional">Institucional</option>
              </select>
            </div>

            <div>
              <label className="form-label">Titulo</label>
              <input className="form-input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Asunto principal de la notificacion" />
            </div>

            <div>
              <label className="form-label">Mensaje</label>
              <textarea className="form-input" rows="7" value={form.mensaje} onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))} placeholder="Detalle de la notificacion..." />
            </div>

            {error && (
              <div style={{ padding: '.85rem 1rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: '2px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar notificacion'}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-head">
            <h2>Notificaciones emitidas</h2>
            <span className="count">{items.length} registros</span>
          </div>

          {loading ? (
            <div className="loading-dots" style={{ marginTop: '2rem' }}><span /><span /><span /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem', maxHeight: '560px', overflowY: 'auto' }}>
              {items.map((item) => (
                <div key={item.id} style={{ padding: '1rem', background: 'var(--paper-dark)', borderRadius: '2px', borderLeft: `4px solid ${item.tipo === 'emergencia' ? 'var(--crimson)' : item.tipo === 'institucional' ? 'var(--gold)' : 'var(--ink)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                    <strong style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>{item.titulo}</strong>
                    <span className={`chip ${CHIP_CLASS[item.tipo] || 'chip-ink'}`}>{TYPE_LABEL[item.tipo] || item.tipo}</span>
                  </div>
                  <div style={{ fontSize: '.9rem', marginTop: '.55rem', whiteSpace: 'pre-wrap' }}>{item.mensaje}</div>
                  <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.7rem' }}>
                    {new Date(item.created_at).toLocaleString('es-ES')} · {item.creado_nombre} {item.creado_apellido}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                  Aun no hay notificaciones enviadas
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
