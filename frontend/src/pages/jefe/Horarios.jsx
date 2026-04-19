import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const EMPTY = { materia_id: '', docente_id: '', dia_semana: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', aula: '', periodo: '2026-I' };

export default function JefeHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [asigForm, setAsigForm] = useState({ materia_id: '', docente_id: '' });
  const [saving, setSaving] = useState(false);
  const [filtroDia, setFiltroDia] = useState('');

  const cargar = () => Promise.all([
    api.get('/jefe/horarios').then(r => setHorarios(r.data)),
    api.get('/jefe/materias').then(r => setMaterias(r.data)),
    api.get('/jefe/docentes').then(r => setDocentes(r.data))
  ]);

  useEffect(() => { cargar(); }, []);

  const crearHorario = async () => {
    if (!form.materia_id || !form.docente_id) return;
    setSaving(true);
    try {
      await api.post('/jefe/horarios', form);
      setModal(false);
      cargar();
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    await api.delete(`/jefe/horarios/${id}`);
    cargar();
  };

  const asignarDocente = async () => {
    if (!asigForm.materia_id) return;
    setSaving(true);
    try {
      await api.post('/jefe/asignar-docente', asigForm);
      setModalAsignar(false);
      cargar();
    } finally {
      setSaving(false);
    }
  };

  const filtrados = filtroDia ? horarios.filter(h => h.dia_semana === filtroDia) : horarios;
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        num="06"
        eyebrow="Planificación académica"
        title={<>Horarios y <span className="display-italic">asignaciones</span></>}
        lead="Asigne docentes a materias y configure los horarios de clases del período académico."
      />

      <div className="flex gap-4 mb-6" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="flex gap-3">
          <select value={filtroDia} onChange={e => setFiltroDia(e.target.value)} style={{
            padding: '.65rem 1rem', border: '1px solid var(--line-strong)',
            borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--mono)', fontSize: '.85rem'
          }}>
            <option value="">Todos los días</option>
            {DIAS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => { setAsigForm({ materia_id: '', docente_id: '' }); setModalAsignar(true); }}>
            Asignar docente a materia
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
            + Nuevo horario
          </button>
        </div>
      </div>

      {/* Materias sin docente */}
      {materias.filter(m => !m.docente_nombre).length > 0 && (
        <div style={{
          padding: '1rem 1.25rem', background: '#fff8e1', border: '1px solid var(--gold)',
          borderRadius: '2px', marginBottom: '1.5rem', fontSize: '.9rem'
        }}>
          <strong>Materias sin docente asignado:</strong>{' '}
          {materias.filter(m => !m.docente_nombre).map(m => m.nombre).join(', ')}
        </div>
      )}

      {/* Tabla horarios */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Día</th>
            <th>Hora</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Aula</th>
            <th>Período</th>
            <th style={{ textAlign: 'right' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Sin horarios registrados</td></tr>
          )}
          {filtrados.map(h => (
            <tr key={h.id}>
              <td><span className="chip chip-ink">{h.dia_semana}</span></td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>
                {h.hora_inicio?.slice(0,5)} – {h.hora_fin?.slice(0,5)}
              </td>
              <td>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{h.materia_nombre}</div>
                <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>{h.materia_codigo}</div>
              </td>
              <td style={{ fontSize: '.9rem' }}>{h.docente_nombre} {h.docente_apellido}</td>
              <td style={{ fontSize: '.85rem' }}>{h.aula || '—'}</td>
              <td className="text-mono" style={{ fontSize: '.75rem' }}>{h.periodo || '—'}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-danger btn-sm" onClick={() => eliminar(h.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Listado de materias con docentes */}
      <div style={{ marginTop: '2rem' }}>
        <div className="section-head">
          <h2>Materias y docentes asignados</h2>
          <span className="count">{materias.length} materias</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.75rem', marginTop: '1rem' }}>
          {materias.map(m => (
            <div key={m.id} style={{
              padding: '1rem 1.25rem', background: 'var(--paper-dark)',
              borderRadius: '2px', borderLeft: `3px solid ${m.docente_nombre ? 'var(--forest)' : 'var(--crimson)'}`
            }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600 }}>{m.nombre}</div>
              <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                {m.codigo} · Sem. {m.semestre} · {m.creditos} cred.
              </div>
              <div style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
                {m.docente_nombre
                  ? <span style={{ color: 'var(--forest)' }}>► {m.docente_nombre} {m.docente_apellido}</span>
                  : <span style={{ color: 'var(--crimson)', fontStyle: 'italic' }}>Sin docente asignado</span>
                }
              </div>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.3rem' }}>
                {m.total_estudiantes} estudiantes inscritos
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nuevo horario */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo horario de clase">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Materia *</label>
            <select className="form-input" value={form.materia_id} onChange={e => f('materia_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Docente *</label>
            <select className="form-input" value={form.docente_id} onChange={e => f('docente_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Día</label>
            <select className="form-input" value={form.dia_semana} onChange={e => f('dia_semana', e.target.value)}>
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Aula</label>
            <input className="form-input" value={form.aula} onChange={e => f('aula', e.target.value)} placeholder="Ej: Aula 101"/>
          </div>
          <div>
            <label className="form-label">Hora inicio</label>
            <input className="form-input" type="time" value={form.hora_inicio} onChange={e => f('hora_inicio', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Hora fin</label>
            <input className="form-input" type="time" value={form.hora_fin} onChange={e => f('hora_fin', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Período</label>
            <input className="form-input" value={form.periodo} onChange={e => f('periodo', e.target.value)} placeholder="Ej: 2026-I"/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={crearHorario} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar horario'}
          </button>
        </div>
      </Modal>

      {/* Modal asignar docente */}
      <Modal open={modalAsignar} onClose={() => setModalAsignar(false)} title="Asignar docente a materia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Materia *</label>
            <select className="form-input" value={asigForm.materia_id}
              onChange={e => setAsigForm(p => ({ ...p, materia_id: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} — actual: {m.docente_nombre || 'ninguno'}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Docente</label>
            <select className="form-input" value={asigForm.docente_id}
              onChange={e => setAsigForm(p => ({ ...p, docente_id: e.target.value }))}>
              <option value="">— Sin docente —</option>
              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido} — {d.especialidad || 'General'}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModalAsignar(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={asignarDocente} disabled={saving}>
            {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </div>
      </Modal>
    </>
  );
}
