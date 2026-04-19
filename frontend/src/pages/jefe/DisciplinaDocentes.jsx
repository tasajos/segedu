import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const TIPOS = ['falta', 'sancion', 'permiso'];
const TIPO_COLOR = { falta: 'var(--crimson)', sancion: '#7b2d8b', permiso: 'var(--gold)' };
const TIPO_CHIP = { falta: 'chip-crimson', sancion: 'chip-ink', permiso: 'chip-gold' };

const EMPTY = { tipo: 'falta', docente_id: '', materia_id: '', fecha: new Date().toISOString().slice(0, 10), descripcion: '' };

export default function JefeDisciplinaDocentes() {
  const [registros, setRegistros] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDoc, setFiltroDoc] = useState('');

  const cargar = async () => {
    const params = {};
    if (filtroTipo) params.tipo = filtroTipo;
    if (filtroDoc) params.docente_id = filtroDoc;
    const [r, d, m] = await Promise.all([
      api.get('/jefe/disciplina-docentes', { params }),
      api.get('/jefe/docentes'),
      api.get('/jefe/materias')
    ]);
    setRegistros(r.data);
    setDocentes(d.data);
    setMaterias(m.data);
  };

  useEffect(() => { cargar(); }, [filtroTipo, filtroDoc]);

  const guardar = async () => {
    if (!form.docente_id || !form.descripcion) return;
    setSaving(true);
    try {
      await api.post('/jefe/disciplina-docentes', form);
      setModal(false);
      cargar();
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await api.delete(`/jefe/disciplina-docentes/${id}`);
    cargar();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        num="08"
        eyebrow="Registro disciplinario"
        title={<>Disciplina de <span className="display-italic">docentes</span></>}
        lead="Registre y consulte faltas, sanciones y permisos del cuerpo docente."
      />

      <div className="flex gap-4 mb-6" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="flex gap-3">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{
            padding: '.65rem 1rem', border: '1px solid var(--line-strong)',
            borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--mono)', fontSize: '.85rem'
          }}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filtroDoc} onChange={e => setFiltroDoc(e.target.value)} style={{
            padding: '.65rem 1rem', border: '1px solid var(--line-strong)',
            borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--sans)', fontSize: '.85rem'
          }}>
            <option value="">Todos los docentes</option>
            {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          + Nuevo registro
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {TIPOS.map(tipo => {
          const count = registros.filter(r => r.tipo === tipo).length;
          return (
            <div key={tipo} style={{
              padding: '1rem 1.25rem', background: 'var(--paper-dark)',
              borderRadius: '2px', borderTop: `4px solid ${TIPO_COLOR[tipo]}`
            }}>
              <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{count}</div>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.3rem' }}>
                {tipo}s registradas
              </div>
            </div>
          );
        })}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Docente</th>
            <th>Materia</th>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Registrado por</th>
            <th style={{ textAlign: 'right' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {registros.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Sin registros</td></tr>
          )}
          {registros.map(r => (
            <tr key={r.id}>
              <td><span className={`chip ${TIPO_CHIP[r.tipo]}`}>{r.tipo}</span></td>
              <td style={{ fontFamily: 'var(--serif)', fontSize: '.9rem' }}>{r.docente_nombre} {r.docente_apellido}</td>
              <td style={{ fontSize: '.85rem' }}>{r.materia_nombre || '—'}</td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{new Date(r.fecha).toLocaleDateString('es-ES')}</td>
              <td style={{ fontSize: '.85rem', maxWidth: '260px' }}>{r.descripcion}</td>
              <td style={{ fontSize: '.8rem', color: 'var(--ink-light)' }}>{r.registrado_nombre} {r.registrado_apellido}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-danger btn-sm" onClick={() => eliminar(r.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo registro disciplinario — docente">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Tipo *</label>
            <select className="form-input" value={form.tipo} onChange={e => f('tipo', e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Fecha *</label>
            <input className="form-input" type="date" value={form.fecha} onChange={e => f('fecha', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Docente *</label>
            <select className="form-input" value={form.docente_id} onChange={e => f('docente_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido} — {d.especialidad || 'General'}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Materia (opcional)</label>
            <select className="form-input" value={form.materia_id} onChange={e => f('materia_id', e.target.value)}>
              <option value="">— General / sin materia —</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción *</label>
            <textarea className="form-input" rows={3} value={form.descripcion}
              onChange={e => f('descripcion', e.target.value)}
              placeholder="Detalle de la falta, sanción o permiso…"
              style={{ resize: 'vertical' }}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </Modal>
    </>
  );
}
