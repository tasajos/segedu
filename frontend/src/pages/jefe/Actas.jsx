import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';

const EMPTY_DETAIL = {
  materia: null,
  inscritos: [],
  acta: null,
  detalles: [],
  nota_aprobacion: 51,
  modalidades: {},
  reglas: {}
};

const REGULAR = 'regular';

const typeLabel = {
  regular: 'Regular',
  segunda_instancia: 'Segunda instancia',
  examen_mesa: 'Examen de mesa',
  examen_gracia: 'Examen de gracia'
};

const createRow = (found) => ({
  modalidad: found?.modalidad || REGULAR,
  primer_parcial: found?.primer_parcial != null ? String(found.primer_parcial) : '',
  segundo_parcial: found?.segundo_parcial != null ? String(found.segundo_parcial) : '',
  examen_final: found?.examen_final != null ? String(found.examen_final) : '',
  examen_recuperacion: found?.examen_recuperacion != null ? String(found.examen_recuperacion) : ''
});

const toNumber = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getRegularComponentStatus = (value, minimum) => {
  if (value === '') return null;
  return toNumber(value) >= minimum ? 'aprobado' : 'reprobado';
};

const computeRow = (row, reglas) => {
  const modalidad = row.modalidad || REGULAR;

  if (modalidad === REGULAR) {
    const primer = toNumber(row.primer_parcial);
    const segundo = toNumber(row.segundo_parcial);
    const final = toNumber(row.examen_final);
    const total = Number((primer + segundo + final).toFixed(2));
    const minPrimer = reglas?.regular?.primer_parcial_minimo || 18;
    const minSegundo = 18;
    const minFinal = 15;
    const minMateria = reglas?.regular?.nota_minima || 51;
    const aprobado = primer >= minPrimer && total >= minMateria;
    return {
      total,
      faltante: Math.max(0, Number((minMateria - total).toFixed(2))),
      estado: aprobado ? 'aprobado' : 'reprobado',
      componentes: {
        primer_parcial: getRegularComponentStatus(row.primer_parcial, minPrimer),
        segundo_parcial: getRegularComponentStatus(row.segundo_parcial, minSegundo),
        examen_final: getRegularComponentStatus(row.examen_final, minFinal)
      }
    };
  }

  const total = toNumber(row.examen_recuperacion);
  const notaMinima = reglas?.[modalidad]?.nota_minima || 51;
  return {
    total,
    faltante: Math.max(0, Number((notaMinima - total).toFixed(2))),
    estado: total >= notaMinima ? 'aprobado' : 'reprobado',
    componentes: {
      primer_parcial: null,
      segundo_parcial: null,
      examen_final: null
    }
  };
};

export default function JefeActas() {
  const [tab, setTab] = useState('carga');
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [detalle, setDetalle] = useState(EMPTY_DETAIL);
  const [indicadores, setIndicadores] = useState({ resumen: { aprobados: 0, reprobados: 0 }, porMateria: [], reprobadosMasDos: [], nota_aprobacion: 51, modalidades: {} });
  const [notas, setNotas] = useState({});
  const [periodo, setPeriodo] = useState('2026-I');
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detalleReprobados, setDetalleReprobados] = useState(null);

  const cargarMaterias = async () => {
    const { data } = await api.get('/jefe/materias');
    setMaterias(data);
    if (data.length && !materiaId) setMateriaId(String(data[0].id));
  };

  const cargarDetalle = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/jefe/actas/${id}`);
      setDetalle(data);
      setPeriodo(data.acta?.periodo || '2026-I');
      setObservaciones(data.acta?.observaciones || '');
      const nextNotas = {};
      data.inscritos.forEach((student) => {
        const found = data.detalles.find((item) => Number(item.estudiante_id) === Number(student.id));
        nextNotas[student.id] = createRow(found);
      });
      setNotas(nextNotas);
      setArchivo(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarIndicadores = async () => {
    const { data } = await api.get('/jefe/actas/indicadores');
    setIndicadores(data);
  };

  useEffect(() => {
    cargarMaterias();
    cargarIndicadores();
  }, []);

  useEffect(() => {
    if (materiaId) cargarDetalle(materiaId);
  }, [materiaId]);

  const resumenActual = useMemo(() => {
    return detalle.inscritos.reduce((acc, student) => {
      const row = notas[student.id] || createRow();
      const hasValue = row.modalidad === REGULAR
        ? row.primer_parcial !== '' || row.segundo_parcial !== '' || row.examen_final !== ''
        : row.examen_recuperacion !== '';
      if (!hasValue) return acc;
      const computed = computeRow(row, detalle.reglas);
      if (computed.estado === 'aprobado') acc.aprobados += 1;
      else acc.reprobados += 1;
      return acc;
    }, { aprobados: 0, reprobados: 0 });
  }, [detalle, notas]);

  const updateRow = (studentId, field, value) => {
    setNotas((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || createRow()),
        [field]: value
      }
    }));
  };

  const changeModalidad = (studentId, modalidad) => {
    setNotas((prev) => ({
      ...prev,
      [studentId]: {
        modalidad,
        primer_parcial: '',
        segundo_parcial: '',
        examen_final: '',
        examen_recuperacion: ''
      }
    }));
  };

  const guardar = async () => {
    if (!materiaId || !detalle.inscritos.length) return;
    setSaving(true);
    try {
      const body = new FormData();
      body.append('materia_id', materiaId);
      body.append('periodo', periodo);
      body.append('observaciones', observaciones);
      body.append('notas', JSON.stringify(
        detalle.inscritos.map((student) => {
          const row = notas[student.id] || createRow();
          return {
            estudiante_id: student.id,
            modalidad: row.modalidad,
            primer_parcial: toNumber(row.primer_parcial),
            segundo_parcial: toNumber(row.segundo_parcial),
            examen_final: toNumber(row.examen_final),
            examen_recuperacion: toNumber(row.examen_recuperacion)
          };
        })
      ));
      if (archivo) body.append('archivo', archivo);

      await api.post('/jefe/actas', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await Promise.all([cargarDetalle(materiaId), cargarIndicadores()]);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el acta');
    } finally {
      setSaving(false);
    }
  };

  const abrirDetalleReprobados = (materia, tipo) => {
    const map = {
      primer_parcial: {
        titulo: 'Reprobados 1er parcial',
        estudiantes: materia.reprobados_primer_parcial_detalle || []
      },
      segundo_parcial: {
        titulo: 'Reprobados 2do parcial',
        estudiantes: materia.reprobados_segundo_parcial_detalle || []
      },
      final: {
        titulo: 'Reprobados examen final',
        estudiantes: materia.reprobados_final_detalle || []
      },
      total: {
        titulo: 'Reprobados totales',
        estudiantes: materia.reprobados_total_detalle || []
      }
    };

    setDetalleReprobados({
      materia,
      ...(map[tipo] || { titulo: 'Detalle de reprobados', estudiantes: [] })
    });
  };

  const renderReprobadoChip = (materia, value, tipo) => {
    const total = Number(value || 0);
    if (!total) return <span className="chip chip-crimson">0</span>;

    return (
      <button
        type="button"
        className="chip chip-crimson"
        onClick={() => abrirDetalleReprobados(materia, tipo)}
        style={{ border: 'none', cursor: 'pointer' }}
        title="Ver quienes son"
      >
        {total}
      </button>
    );
  };

  return (
    <>
      <PageHeader
        num="12"
        eyebrow="Rendimiento academico"
        title={<>Actas de <span className="display-italic">notas</span></>}
        lead="Cargue parciales, final o modalidades especiales y analice aprobados, reprobados y riesgo academico."
      />

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${tab === 'carga' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('carga')}>
          Carga de acta
        </button>
        <button className={`btn ${tab === 'indicadores' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('indicadores')}>
          Indicadores
        </button>
      </div>

      {tab === 'carga' && (
        <>
          <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1.4fr .8fr .8fr', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="form-label">Materia</label>
              <select className="form-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.codigo}) - Grupo {m.grupo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Periodo</label>
              <input className="form-input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Regla base</label>
              <div className="form-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-light)' }}>
                Regular aprueba con 51
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : (
            <>
              <div className="grid-4 mb-6">
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="text-serif" style={{ fontSize: '2rem' }}>{detalle.inscritos.length}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Inscritos</div>
                </div>
                <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--forest)' }}>
                  <div className="text-serif" style={{ fontSize: '2rem' }}>{resumenActual.aprobados}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Aprobados</div>
                </div>
                <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--crimson)' }}>
                  <div className="text-serif" style={{ fontSize: '2rem' }}>{resumenActual.reprobados}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Reprobados</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="text-serif" style={{ fontSize: '1.2rem' }}>{detalle.materia?.docente_nombre || 'Sin docente'}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Docente asignado</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'grid', gap: '.9rem' }}>
                <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>
                  Regular: 1er parcial /35 con minimo 18, 2do parcial /35, examen final /30. Modalidades especiales: segunda instancia /51, mesa /51, gracia /100.
                </div>
                <div>
                  <label className="form-label">Acta escaneada / archivo</label>
                  <input type="file" className="form-input" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
                  {detalle.acta?.archivo_url && (
                    <div style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
                      Archivo actual: <a href={detalle.acta.archivo_url} target="_blank" rel="noreferrer">ver acta</a>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows="4" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones generales del acta..." />
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Estudiante</th>
                    <th>Codigo</th>
                    <th>Modalidad</th>
                    <th>1er parcial</th>
                    <th>Estado 1P</th>
                    <th>2do parcial</th>
                    <th>Estado 2P</th>
                    <th>Final</th>
                    <th>Estado final</th>
                    <th>Recuperacion</th>
                    <th>Total</th>
                    <th>Falta para aprobar</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.inscritos.map((student, index) => {
                    const row = notas[student.id] || createRow();
                    const computed = computeRow(row, detalle.reglas);
                    const maxRec = detalle.reglas?.[row.modalidad]?.maximo || detalle.modalidades?.[row.modalidad]?.maxTotal || 100;
                    return (
                      <tr key={student.id}>
                        <td className="num">{String(index + 1).padStart(2, '0')}</td>
                        <td>{student.apellido} {student.nombre}</td>
                        <td className="text-mono" style={{ fontSize: '.8rem' }}>{student.codigo_estudiante}</td>
                        <td>
                          <select className="form-input" value={row.modalidad} onChange={(e) => changeModalidad(student.id, e.target.value)} style={{ minWidth: '170px' }}>
                            {Object.keys(detalle.modalidades || typeLabel).map((key) => (
                              <option key={key} value={key}>{typeLabel[key] || key}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {row.modalidad === REGULAR ? (
                            <input className="form-input" type="number" min="0" max="35" step="0.01" value={row.primer_parcial} onChange={(e) => updateRow(student.id, 'primer_parcial', e.target.value)} style={{ minWidth: '90px' }} />
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad === REGULAR && computed.componentes.primer_parcial ? (
                            <span className={`chip ${computed.componentes.primer_parcial === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                              {computed.componentes.primer_parcial}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad === REGULAR ? (
                            <input className="form-input" type="number" min="0" max="35" step="0.01" value={row.segundo_parcial} onChange={(e) => updateRow(student.id, 'segundo_parcial', e.target.value)} style={{ minWidth: '90px' }} />
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad === REGULAR && computed.componentes.segundo_parcial ? (
                            <span className={`chip ${computed.componentes.segundo_parcial === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                              {computed.componentes.segundo_parcial}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad === REGULAR ? (
                            <input className="form-input" type="number" min="0" max="30" step="0.01" value={row.examen_final} onChange={(e) => updateRow(student.id, 'examen_final', e.target.value)} style={{ minWidth: '90px' }} />
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad === REGULAR && computed.componentes.examen_final ? (
                            <span className={`chip ${computed.componentes.examen_final === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                              {computed.componentes.examen_final}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {row.modalidad !== REGULAR ? (
                            <input className="form-input" type="number" min="0" max={maxRec} step="0.01" value={row.examen_recuperacion} onChange={(e) => updateRow(student.id, 'examen_recuperacion', e.target.value)} style={{ minWidth: '110px' }} />
                          ) : '-'}
                        </td>
                        <td className="text-mono">{computed.total}</td>
                        <td className="text-mono" style={{ color: computed.faltante > 0 ? 'var(--crimson)' : 'var(--forest)' }}>
                          {computed.faltante}
                        </td>
                        <td>
                          <span className={`chip ${computed.estado === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                            {computed.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar acta'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'indicadores' && (
        <>
          <div className="grid-2 mb-6">
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--forest)' }}>
              <div className="text-serif" style={{ fontSize: '2rem' }}>{indicadores.resumen?.aprobados || 0}</div>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Total aprobados</div>
            </div>
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--crimson)' }}>
              <div className="text-serif" style={{ fontSize: '2rem' }}>{indicadores.resumen?.reprobados || 0}</div>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Total reprobados</div>
            </div>
          </div>

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Aprobados por parcial y materia</h2>
            <span className="count">{indicadores.porMateria.length} materias</span>
          </div>
          <table className="data-table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Codigo</th>
                <th>Grupo</th>
                <th>Docente</th>
                <th>Aprob. 1P</th>
                <th>Reprob. 1P</th>
                <th>Aprob. 2P</th>
                <th>Reprob. 2P</th>
                <th>Aprob. Final</th>
                <th>Reprob. Final</th>
                <th>Aprobados</th>
                <th>Reprobados</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.porMateria.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td className="text-mono" style={{ fontSize: '.8rem' }}>{item.codigo}</td>
                  <td><span className="chip chip-ink">G{item.grupo}</span></td>
                  <td style={{ fontSize: '.88rem' }}>{item.docente_nombre ? `${item.docente_nombre} ${item.docente_apellido}` : 'Sin docente'}</td>
                  <td><span className="chip chip-forest">{item.aprobados_primer_parcial}</span></td>
                  <td>{renderReprobadoChip(item, item.reprobados_primer_parcial, 'primer_parcial')}</td>
                  <td><span className="chip chip-forest">{item.aprobados_segundo_parcial}</span></td>
                  <td>{renderReprobadoChip(item, item.reprobados_segundo_parcial, 'segundo_parcial')}</td>
                  <td><span className="chip chip-forest">{item.aprobados_final}</span></td>
                  <td>{renderReprobadoChip(item, item.reprobados_final, 'final')}</td>
                  <td><span className="chip chip-forest">{item.aprobados}</span></td>
                  <td>{renderReprobadoChip(item, item.reprobados, 'total')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Estudiantes reprobados en mas de 2 materias</h2>
            <span className="count">{indicadores.reprobadosMasDos.length} estudiantes</span>
          </div>
          {indicadores.reprobadosMasDos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              No hay estudiantes con mas de 2 materias reprobadas
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Codigo</th>
                  <th>Total reprobadas</th>
                  <th>Materias</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.reprobadosMasDos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.apellido} {item.nombre}</td>
                    <td className="text-mono" style={{ fontSize: '.8rem' }}>{item.codigo_estudiante}</td>
                    <td><span className="chip chip-crimson">{item.materias_reprobadas}</span></td>
                    <td style={{ fontSize: '.88rem' }}>{item.materias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <Modal
        open={Boolean(detalleReprobados)}
        onClose={() => setDetalleReprobados(null)}
        title={detalleReprobados ? `${detalleReprobados.titulo} - ${detalleReprobados.materia.nombre} (${detalleReprobados.materia.codigo})` : 'Detalle de reprobados'}
        maxWidth="860px"
      >
        {detalleReprobados && detalleReprobados.estudiantes.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Codigo</th>
                <th>Modalidad</th>
                <th>1P</th>
                <th>2P</th>
                <th>Final</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {detalleReprobados.estudiantes.map((estudiante) => (
                <tr key={`${estudiante.estudiante_id}-${estudiante.modalidad}-${estudiante.codigo_estudiante}`}>
                  <td>{estudiante.nombre_completo}</td>
                  <td className="text-mono" style={{ fontSize: '.82rem' }}>{estudiante.codigo_estudiante}</td>
                  <td>{typeLabel[estudiante.modalidad] || estudiante.modalidad}</td>
                  <td>{estudiante.primer_parcial ?? '-'}</td>
                  <td>{estudiante.segundo_parcial ?? '-'}</td>
                  <td>{estudiante.examen_final ?? '-'}</td>
                  <td className="text-mono">{estudiante.nota_final ?? '-'}</td>
                  <td>
                    <span className={`chip ${estudiante.estado === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                      {estudiante.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ink-light)' }}>
            No hay estudiantes reprobados en este indicador.
          </div>
        )}
      </Modal>
    </>
  );
}
