import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const ESTADOS = {
  borrador: { cls: 'chip-ink', txt: 'Borrador' },
  enviado: { cls: 'chip-gold', txt: 'Enviado' },
  revision: { cls: 'chip-gold', txt: 'En revision' },
  aprobado: { cls: 'chip-forest', txt: 'Aprobado' },
  rechazado: { cls: 'chip-crimson', txt: 'Rechazado' }
};

const DECISIONES = [
  {
    val: 'aprobado',
    label: 'Aprobar',
    hint: 'Confirma el documento y deja la planificacion aprobada.',
    color: 'var(--forest)',
    soft: 'rgba(24, 160, 88, 0.10)',
    shadow: 'rgba(24, 160, 88, 0.22)',
    tag: 'OK'
  },
  {
    val: 'revision',
    label: 'Solicitar cambios',
    hint: 'Devuelve el PGO con observaciones para correccion.',
    color: 'var(--gold-dark)',
    soft: 'rgba(212, 145, 16, 0.10)',
    shadow: 'rgba(212, 145, 16, 0.24)',
    tag: 'RC'
  },
  {
    val: 'rechazado',
    label: 'Rechazar',
    hint: 'Marca el documento como no aprobado en esta revision.',
    color: 'var(--crimson)',
    soft: 'rgba(214, 68, 68, 0.10)',
    shadow: 'rgba(214, 68, 68, 0.22)',
    tag: 'NO'
  }
];

const getEstadoMeta = (estado) => DECISIONES.find((item) => item.val === estado) || DECISIONES[0];

export default function JefePGO() {
  const [pgoList, setPgoList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ estado: 'aprobado', observaciones: '' });

  const cargar = async () => {
    const { data } = await api.get('/jefe/pgo');
    setPgoList(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirRevision = (pgo) => {
    setSelected(pgo);
    setForm({ estado: pgo.estado, observaciones: pgo.observaciones || '' });
  };

  const cerrarRevision = () => setSelected(null);

  const revisar = async (e) => {
    e.preventDefault();
    await api.put(`/jefe/pgo/${selected.id}`, form);
    cerrarRevision();
    cargar();
  };

  const eliminar = async (pgo) => {
    const ok = window.confirm(`¿Desea eliminar el PGO "${pgo.titulo}"?`);
    if (!ok) return;
    if (selected?.id === pgo.id) cerrarRevision();
    await api.delete(`/jefe/pgo/${pgo.id}`);
    cargar();
  };

  const decisionActiva = getEstadoMeta(form.estado);

  return (
    <>
      <PageHeader
        num="02"
        eyebrow="Revision documental"
        title={<>Planes <span className="display-italic">globales operativos</span></>}
        lead="Revise, apruebe o solicite correcciones de los PGO enviados por el cuerpo docente."
      />

      <div className="section-head">
        <h2>PGO recibidos</h2>
        <span className="count">{pgoList.length} documentos</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Periodo</th>
            <th>Enviado</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pgoList.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                Sin PGO pendientes
              </td>
            </tr>
          )}
          {pgoList.map((pgo, index) => {
            const estado = ESTADOS[pgo.estado] || ESTADOS.enviado;

            return (
              <tr key={pgo.id}>
                <td className="num">{String(index + 1).padStart(3, '0')}</td>
                <td>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{pgo.materia_nombre}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                    {pgo.materia_codigo}
                  </div>
                </td>
                <td>{pgo.docente_nombre} {pgo.docente_apellido}</td>
                <td className="text-mono" style={{ fontSize: '.8rem' }}>{pgo.periodo}</td>
                <td className="text-mono" style={{ fontSize: '.8rem', color: 'var(--ink-light)' }}>
                  {new Date(pgo.fecha_envio).toLocaleDateString()}
                </td>
                <td><span className={`chip ${estado.cls}`}>{estado.txt}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '.5rem' }}>
                    {pgo.archivo_url && (
                      <a href={pgo.archivo_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                        Ver
                      </a>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => abrirRevision(pgo)}>
                      Revisar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminar(pgo)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal open={!!selected} onClose={cerrarRevision} title="Revisar PGO">
        {selected && (
          <>
            <div
              style={{
                padding: '1rem 1.1rem',
                background: 'linear-gradient(180deg, rgba(246, 248, 252, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%)',
                borderRadius: '18px',
                marginBottom: '1.25rem',
                border: '1px solid var(--line)',
                boxShadow: '0 18px 40px -34px rgba(15, 23, 42, 0.45)'
              }}
            >
              <div className="eyebrow">{selected.materia_codigo} · {selected.periodo}</div>
              <h3 style={{ marginTop: '.35rem' }}>{selected.titulo}</h3>
              <div className="text-muted" style={{ fontSize: '.85rem' }}>
                Por {selected.docente_nombre} {selected.docente_apellido}
              </div>
              {selected.descripcion && (
                <p style={{ marginTop: '.6rem', fontSize: '.85rem', lineHeight: 1.6 }}>{selected.descripcion}</p>
              )}
            </div>

            <form onSubmit={revisar}>
              <div className="form-field">
                <label>Decision *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '.75rem' }}>
                  {DECISIONES.map((op) => {
                    const isActive = form.estado === op.val;
                    return (
                      <label
                        key={op.val}
                        style={{
                          padding: '1rem',
                          border: `1.5px solid ${isActive ? op.color : 'var(--line-strong)'}`,
                          background: isActive
                            ? op.soft
                            : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,248,252,0.96) 100%)',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          color: isActive ? op.color : 'var(--ink)',
                          transition: 'all .2s ease',
                          minHeight: '138px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '.9rem',
                          boxShadow: isActive
                            ? `0 18px 36px -28px ${op.shadow}`
                            : '0 14px 28px -30px rgba(15, 23, 42, 0.36)'
                        }}
                      >
                        <input
                          type="radio"
                          value={op.val}
                          checked={isActive}
                          onChange={(e) => setForm({ ...form, estado: e.target.value })}
                          style={{ display: 'none' }}
                        />

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.75rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '2.15rem',
                              height: '2.15rem',
                              padding: '0 .65rem',
                              borderRadius: '999px',
                              background: isActive ? op.color : 'var(--paper-dark)',
                              color: isActive ? '#fff' : 'var(--ink-light)',
                              fontSize: '.72rem',
                              letterSpacing: '.16em',
                              textTransform: 'uppercase',
                              fontWeight: 700
                            }}
                          >
                            {op.tag}
                          </span>
                          <span
                            style={{
                              width: '1.15rem',
                              height: '1.15rem',
                              borderRadius: '999px',
                              border: `1.5px solid ${isActive ? op.color : 'var(--line-strong)'}`,
                              background: isActive ? op.color : 'transparent',
                              boxShadow: isActive ? `0 0 0 4px ${op.soft}` : 'none',
                              flexShrink: 0
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: '.98rem', marginBottom: '.35rem', fontWeight: 600 }}>
                            {op.label}
                          </div>
                          <div
                            style={{
                              fontSize: '.78rem',
                              lineHeight: 1.6,
                              color: isActive ? op.color : 'var(--ink-light)',
                              fontWeight: 400
                            }}
                          >
                            {op.hint}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  marginBottom: '1rem',
                  padding: '.85rem 1rem',
                  borderRadius: '14px',
                  border: `1px solid ${decisionActiva.color}`,
                  background: decisionActiva.soft,
                  color: decisionActiva.color,
                  fontSize: '.82rem',
                  lineHeight: 1.6
                }}
              >
                <strong style={{ display: 'block', marginBottom: '.2rem' }}>Decision seleccionada: {decisionActiva.label}</strong>
                {decisionActiva.hint}
              </div>

              <div className="form-field">
                <label>Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows="4"
                  placeholder="Escriba comentarios para el docente si hace falta."
                />
              </div>

              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={cerrarRevision}>
                  Cancelar
                </button>
                <button className="btn btn-primary">Guardar revision</button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
