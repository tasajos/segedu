import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { exportAttendanceExcel, exportAttendancePdf } from '../../services/attendanceExport';

const TIPO_COLOR = { falta: 'var(--crimson)', sancion: '#7b2d8b', permiso: 'var(--gold)' };

export default function JefeEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [indicadores, setIndicadores] = useState({ resumen: { falta: 0, permiso: 0, tarde: 0 }, topAsistencia: [], topFaltas: [] });
  const [semestre, setSemestre] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('asistencias');
  const [materiaNueva, setMateriaNueva] = useState('');
  const [savingMateria, setSavingMateria] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [modoPromocion, setModoPromocion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [promoviendo, setPromoviendo] = useState(false);
  const [mensajePromocion, setMensajePromocion] = useState('');

  const cargar = async () => {
    const [estudiantesResp, indicadoresResp] = await Promise.all([
      api.get('/jefe/estudiantes', { params: semestre ? { semestre } : {} }),
      api.get('/jefe/estudiantes-indicadores')
    ]);
    setEstudiantes(estudiantesResp.data);
    setIndicadores(indicadoresResp.data);
  };

  useEffect(() => {
    cargar();
  }, [semestre]);

  const cargarDetalle = async (id) => {
    const { data } = await api.get(`/jefe/estudiantes/${id}`);
    setDetalle(data);
    return data;
  };

  const verDetalle = async (id) => {
    await cargarDetalle(id);
    setMateriaNueva('');
    setTab('asistencias');
  };

  const asignarMateria = async () => {
    if (!detalle?.estudiante?.id || !materiaSeleccionada) return;

    try {
      setSavingMateria(true);
      await api.post('/jefe/inscripciones', {
        estudiante_id: detalle.estudiante.id,
        materia_id: materiaSeleccionada
      });

      const actualizado = await cargarDetalle(detalle.estudiante.id);
      const siguiente = (actualizado.materiasDisponibles || []).find((m) => !Number(m.inscrito));
      setMateriaNueva(siguiente ? String(siguiente.id) : '');
      setTab('materias');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al asignar la materia');
    } finally {
      setSavingMateria(false);
    }
  };

  const retirarMateria = async (materiaId) => {
    if (!detalle?.estudiante?.id) return;

    try {
      setSavingMateria(true);
      await api.delete(`/jefe/inscripciones/${detalle.estudiante.id}/${materiaId}`);
      await cargarDetalle(detalle.estudiante.id);
      setMateriaNueva(String(materiaId));
      setTab('materias');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al retirar la materia');
    } finally {
      setSavingMateria(false);
    }
  };

  const abrirAsistenciasIndicador = async (row, estado) => {
    setAttendanceLoading(true);
    setAttendanceModal({
      estudiante: row,
      estado,
      resumen: { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 },
      registros: []
    });

    try {
      const { data } = await api.get(`/jefe/estudiantes/${row.id}/asistencias`, {
        params: estado ? { estado } : {}
      });
      setAttendanceModal(data);
    } catch (err) {
      setAttendanceModal((prev) => ({
        ...prev,
        error: err.response?.data?.error || 'No se pudo cargar el detalle de asistencias'
      }));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const attendanceExportMetadata = () => {
    const estudiante = attendanceModal?.estudiante;
    const estado = attendanceModal?.estado === 'todos' ? 'asistencias' : attendanceModal?.estado;
    return {
      materia: `Estudiante: ${estudiante?.apellido || ''} ${estudiante?.nombre || ''} (${estudiante?.codigo_estudiante || ''})`,
      docente: 'Jefatura de carrera',
      rango: `Detalle de ${estado || 'asistencias'}`,
      emitido: new Date().toLocaleString('es-ES'),
      resumen: attendanceModal?.resumen || { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 }
    };
  };

  const descargarAsistenciasPdf = async () => {
    if (!attendanceModal?.registros?.length) return;
    await exportAttendancePdf({
      fileName: `asistencias-${attendanceModal.estudiante.codigo_estudiante}-${attendanceModal.estado}.pdf`,
      records: attendanceModal.registros,
      metadata: attendanceExportMetadata()
    });
  };

  const descargarAsistenciasExcel = async () => {
    if (!attendanceModal?.registros?.length) return;
    await exportAttendanceExcel({
      fileName: `asistencias-${attendanceModal.estudiante.codigo_estudiante}-${attendanceModal.estado}.xlsx`,
      records: attendanceModal.registros,
      metadata: attendanceExportMetadata()
    });
  };

  const filtrados = estudiantes.filter((e) => {
    const t = search.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(t) ||
      e.apellido.toLowerCase().includes(t) ||
      e.codigo_estudiante?.toLowerCase().includes(t)
    );
  });

  const estaHabilitado = (estudiante) => estudiante.activo == null || Number(estudiante.activo) === 1;
  const seleccionables = filtrados.filter(estaHabilitado);
  const idsSeleccionables = seleccionables.map((e) => e.id);
  const todosSeleccionados = idsSeleccionables.length > 0
    && idsSeleccionables.every((id) => seleccionados.includes(id));

  const alternarSeleccion = (id) => {
    setSeleccionados((actuales) => actuales.includes(id)
      ? actuales.filter((item) => item !== id)
      : [...actuales, id]);
  };

  const alternarTodos = () => {
    setSeleccionados((actuales) => todosSeleccionados
      ? actuales.filter((id) => !idsSeleccionables.includes(id))
      : [...new Set([...actuales, ...idsSeleccionables])]);
  };

  const cambiarModoPromocion = () => {
    setModoPromocion((actual) => !actual);
    setSeleccionados([]);
    setMensajePromocion('');
  };

  const promover = async () => {
    if (!seleccionados.length) return;
    try {
      setPromoviendo(true);
      setMensajePromocion('');
      const { data } = await api.put('/jefe/estudiantes/promocion', { estudiante_ids: seleccionados });
      setSeleccionados([]);
      await cargar();
      setMensajePromocion(data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al promover estudiantes');
    } finally {
      setPromoviendo(false);
    }
  };

  const semestres = [...new Set(estudiantes.map((e) => e.semestre))].sort((a, b) => a - b);
  const materiasNoInscritas = (detalle?.materiasDisponibles || []).filter((m) => !Number(m.inscrito));
  const materiaSeleccionada = materiaNueva || (materiasNoInscritas[0] ? String(materiasNoInscritas[0].id) : '');

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Directorio academico"
        title={<>Ficha de <span className="display-italic">estudiantes</span></>}
        lead="Consulte el expediente completo de cada estudiante: asistencias, capacitaciones, disciplina y observaciones."
      />

      <div className="grid-4 mb-6">
        <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--crimson)' }}>
          <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{indicadores.resumen?.falta || 0}</div>
          <div className="text-mono" style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-light)', marginTop: '.35rem' }}>
            Faltas acumuladas
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--gold)' }}>
          <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{indicadores.resumen?.permiso || 0}</div>
          <div className="text-mono" style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-light)', marginTop: '.35rem' }}>
            Permisos acumulados
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--blue-600)' }}>
          <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{indicadores.resumen?.tarde || 0}</div>
          <div className="text-mono" style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-light)', marginTop: '.35rem' }}>
            Tardes acumuladas
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', borderTop: '4px solid var(--forest)' }}>
          <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{indicadores.topAsistencia?.[0]?.total_presentes || 0}</div>
          <div className="text-mono" style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-light)', marginTop: '.35rem' }}>
            Mayor asistencia
          </div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.35rem' }}>
            {indicadores.topAsistencia?.[0] ? `${indicadores.topAsistencia[0].nombre} ${indicadores.topAsistencia[0].apellido}` : 'Sin datos'}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card" style={{ padding: '1rem' }}>
          <div className="section-head">
            <h2>Indicador de faltas</h2>
            <span className="count">top 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {(indicadores.topFaltas || []).map((row, index) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '.75rem', alignItems: 'center' }}>
                <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{row.nombre} {row.apellido}</div>
                  <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{row.codigo_estudiante}</div>
                </div>
                <button
                  type="button"
                  className="chip chip-crimson"
                  style={{ border: '1px solid var(--danger-border)', cursor: 'pointer' }}
                  onClick={() => abrirAsistenciasIndicador(row, 'falta')}
                  title="Ver detalle de faltas"
                >
                  {row.total_faltas}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div className="section-head">
            <h2>Indicador de asistencia</h2>
            <span className="count">top 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {(indicadores.topAsistencia || []).map((row, index) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '.75rem', alignItems: 'center' }}>
                <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{row.nombre} {row.apellido}</div>
                  <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{row.codigo_estudiante}</div>
                </div>
                <button
                  type="button"
                  className="chip chip-forest"
                  style={{ border: '1px solid var(--success-border)', cursor: 'pointer' }}
                  onClick={() => abrirAsistenciasIndicador(row, 'presente')}
                  title="Ver detalle de asistencias"
                >
                  {row.total_presentes}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '.75rem 1rem',
            border: '1px solid var(--line-strong)',
            borderRadius: '2px',
            background: 'var(--paper-light)',
            fontFamily: 'var(--sans)'
          }}
        />
        <select
          value={semestre}
          onChange={(e) => setSemestre(e.target.value)}
          style={{
            padding: '.75rem 1rem',
            border: '1px solid var(--line-strong)',
            borderRadius: '2px',
            background: 'var(--paper-light)',
            fontFamily: 'var(--mono)',
            fontSize: '.85rem'
          }}
        >
          <option value="">Todos los semestres</option>
          {semestres.map((s) => <option key={s} value={s}>Semestre {s}</option>)}
        </select>
        <button type="button" className="btn btn-secondary" onClick={cambiarModoPromocion} disabled={promoviendo}>
          {modoPromocion ? 'Cancelar promoción' : 'Promoción'}
        </button>
      </div>

      {modoPromocion && (
        <div className="card mb-6" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <strong>Promover al siguiente semestre</strong>
            <div style={{ color: 'var(--ink-light)', fontSize: '.85rem', marginTop: '.2rem' }}>
              Cada estudiante seleccionado avanzará un semestre: SEM 1 a SEM 2, SEM 2 a SEM 3 y así consecutivamente.
            </div>
            {mensajePromocion && <div style={{ color: 'var(--forest)', marginTop: '.4rem' }}>{mensajePromocion}</div>}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={alternarTodos} disabled={!idsSeleccionables.length || promoviendo}>
            {todosSeleccionados ? 'Quitar todos' : 'Todos'}
          </button>
          <button type="button" className="btn btn-primary" onClick={promover} disabled={!seleccionados.length || promoviendo}>
            {promoviendo ? 'Promoviendo...' : `Promover (${seleccionados.length})`}
          </button>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {modoPromocion && <th style={{ width: '44px' }}>Sel.</th>}
            <th>No</th>
            <th>Codigo</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Carrera</th>
            <th>Semestre</th>
            <th style={{ textAlign: 'right' }}>Accion</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={modoPromocion ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                Sin resultados
              </td>
            </tr>
          )}
          {filtrados.map((e, i) => (
            <tr key={e.id}>
              {modoPromocion && (
                <td>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(e.id)}
                    onChange={() => alternarSeleccion(e.id)}
                    disabled={!estaHabilitado(e) || promoviendo}
                    aria-label={`Seleccionar a ${e.nombre} ${e.apellido}`}
                    title={estaHabilitado(e) ? 'Seleccionar para promoción' : 'Estudiante deshabilitado'}
                  />
                </td>
              )}
              <td className="num">{String(i + 1).padStart(3, '0')}</td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{e.codigo_estudiante}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--ink)',
                      color: 'var(--gold)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--serif)',
                      fontSize: '.8rem'
                    }}
                  >
                    {e.nombre[0]}{e.apellido[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>
                    {e.nombre} {e.apellido}
                  </span>
                </div>
              </td>
              <td style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>{e.email}</td>
              <td style={{ fontSize: '.85rem' }}>{e.carrera_nombre || '-'}</td>
              <td><span className="chip chip-ink">SEM {e.semestre}</span></td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-primary btn-sm" onClick={() => verDetalle(e.id)}>Ver ficha</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Expediente del estudiante" maxWidth="820px">
        {detalle && (
          <>
            <div
              style={{
                padding: '1.5rem',
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderRadius: '2px',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'repeating-linear-gradient(45deg, var(--gold) 0 6px, transparent 6px 12px)'
                }}
              />
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: 'var(--ink)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--serif)',
                    fontSize: '1.5rem'
                  }}
                >
                  {detalle.estudiante.nombre[0]}{detalle.estudiante.apellido[0]}
                </div>
                <div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold)', letterSpacing: '.15em' }}>
                    {detalle.estudiante.codigo_estudiante}
                  </div>
                  <h2 style={{ color: 'var(--paper)', fontSize: '1.75rem', marginTop: '.25rem' }}>
                    {detalle.estudiante.nombre} {detalle.estudiante.apellido}
                  </h2>
                  <div style={{ fontSize: '.85rem', opacity: 0.8 }}>
                    {detalle.estudiante.carrera_nombre} - Semestre {detalle.estudiante.semestre}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', fontSize: '.8rem' }}>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: 0.6, letterSpacing: '.1em' }}>CI</div>{detalle.estudiante.ci || '-'}</div>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: 0.6, letterSpacing: '.1em' }}>TEL</div>{detalle.estudiante.telefono || '-'}</div>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: 0.6, letterSpacing: '.1em' }}>EMAIL</div>{detalle.estudiante.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--line)' }}>
              {[
                { key: 'asistencias', label: 'Asistencias' },
                { key: 'notas', label: 'Notas' },
                { key: 'disciplina', label: 'Disciplina' },
                { key: 'materias', label: 'Materias' },
                { key: 'comentarios', label: 'Observaciones' },
                { key: 'cursos', label: 'Capacitaciones' }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: '.5rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--mono)',
                    fontSize: '.78rem',
                    cursor: 'pointer',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
                    marginBottom: '-2px',
                    color: tab === t.key ? 'var(--ink)' : 'var(--ink-light)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'asistencias' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
                  {['presente', 'falta', 'permiso', 'tarde'].map((est) => {
                    const v = detalle.asistencias.find((a) => a.estado === est)?.total || 0;
                    return (
                      <div key={est} className="card" style={{ padding: '.75rem', textAlign: 'center' }}>
                        <div className="text-serif" style={{ fontSize: '1.75rem' }}>{v}</div>
                        <div className="text-mono" style={{ fontSize: '.6rem', color: 'var(--ink-light)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{est}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {detalle.asistenciasDetalle?.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '.5rem .75rem',
                        borderBottom: '1px solid var(--line)',
                        fontSize: '.85rem'
                      }}
                    >
                      <span>{a.materia_nombre}</span>
                      <span className="text-mono" style={{ fontSize: '.75rem' }}>{new Date(a.fecha).toLocaleDateString('es-ES')}</span>
                      <span className={`chip ${a.estado === 'presente' ? 'chip-forest' : a.estado === 'falta' ? 'chip-crimson' : 'chip-gold'}`}>{a.estado}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'notas' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.6rem', marginBottom: '1rem' }}>
                  <div className="card" style={{ padding: '.85rem', borderTop: '4px solid var(--ink)' }}>
                    <div className="text-serif" style={{ fontSize: '1.8rem' }}>{detalle.resumenNotas?.total_materias || 0}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>MATERIAS CON NOTA</div>
                  </div>
                  <div className="card" style={{ padding: '.85rem', borderTop: '4px solid var(--forest)' }}>
                    <div className="text-serif" style={{ fontSize: '1.8rem' }}>{detalle.resumenNotas?.aprobadas || 0}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>APROBADAS</div>
                  </div>
                  <div className="card" style={{ padding: '.85rem', borderTop: '4px solid var(--crimson)' }}>
                    <div className="text-serif" style={{ fontSize: '1.8rem' }}>{detalle.resumenNotas?.reprobadas || 0}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>REPROBADAS</div>
                  </div>
                  <div className="card" style={{ padding: '.85rem', borderTop: '4px solid var(--gold)' }}>
                    <div className="text-serif" style={{ fontSize: '1.8rem' }}>{detalle.resumenNotas?.reprobadas || 0}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>ACUMULADO REPROBADAS</div>
                  </div>
                </div>

                {detalle.notas?.length === 0 ? (
                  <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    Este estudiante todavia no tiene notas registradas.
                  </div>
                ) : (
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Periodo</th>
                          <th>Docente</th>
                          <th>Modalidad</th>
                          <th>1P</th>
                          <th>2P</th>
                          <th>Final</th>
                          <th>Recup.</th>
                          <th>Total</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.notas.map((nota, index) => (
                          <tr key={`${nota.materia_id}-${nota.periodo || 'sin-periodo'}-${index}`}>
                            <td>
                              <div style={{ fontFamily: 'var(--serif)' }}>{nota.materia_nombre}</div>
                              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                                {nota.materia_codigo} - Grupo {nota.materia_grupo}
                              </div>
                            </td>
                            <td className="text-mono" style={{ fontSize: '.8rem' }}>{nota.periodo || '-'}</td>
                            <td style={{ fontSize: '.84rem' }}>
                              {nota.docente_nombre ? `${nota.docente_nombre} ${nota.docente_apellido}` : 'Sin docente'}
                            </td>
                            <td style={{ fontSize: '.84rem' }}>{nota.modalidad || '-'}</td>
                            <td className="text-mono">{nota.primer_parcial ?? '-'}</td>
                            <td className="text-mono">{nota.segundo_parcial ?? '-'}</td>
                            <td className="text-mono">{nota.examen_final ?? '-'}</td>
                            <td className="text-mono">{nota.examen_recuperacion ?? '-'}</td>
                            <td className="text-mono">{nota.nota_final ?? '-'}</td>
                            <td>
                              <span className={`chip ${nota.estado === 'aprobado' ? 'chip-forest' : 'chip-crimson'}`}>
                                {nota.estado === 'aprobado' ? 'Aprobado' : 'Reprobado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'disciplina' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {detalle.disciplina?.length === 0 && <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin registros disciplinarios</div>}
                {detalle.disciplina?.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '.75rem 1rem',
                      borderLeft: `3px solid ${TIPO_COLOR[d.tipo] || 'var(--gold)'}`,
                      background: 'var(--paper-dark)'
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="text-mono" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: TIPO_COLOR[d.tipo] }}>
                        {d.tipo}
                      </span>
                      <span className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>
                        {new Date(d.fecha).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p style={{ fontSize: '.9rem', marginTop: '.3rem' }}>{d.descripcion}</p>
                    <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                      {d.materia_nombre && `${d.materia_nombre} - `}
                      Por: {d.registrado_nombre} {d.registrado_apellido} ({d.registrado_rol})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'materias' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div className="card" style={{ padding: '1rem', display: 'grid', gap: '.75rem' }}>
                  <div className="text-mono" style={{ fontSize: '.72rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
                    Asignar materia
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '.75rem' }}>
                    <select
                      className="form-input"
                      value={materiaSeleccionada}
                      onChange={(e) => setMateriaNueva(e.target.value)}
                      disabled={savingMateria || materiasNoInscritas.length === 0}
                    >
                      {materiasNoInscritas.length === 0 && <option value="">No hay materias disponibles</option>}
                      {materiasNoInscritas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.codigo}) - Grupo {m.grupo}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={asignarMateria}
                      disabled={savingMateria || !materiaSeleccionada}
                    >
                      {savingMateria ? 'Guardando...' : 'Asignar'}
                    </button>
                  </div>
                </div>

                {detalle.materias.length === 0 && (
                  <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    El estudiante no tiene materias asignadas
                  </div>
                )}

                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.75rem', paddingRight: '.25rem' }}>
                  {detalle.materias.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '.75rem 1rem',
                        background: 'var(--paper-dark)',
                        borderRadius: '2px',
                        fontSize: '.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <strong>{m.nombre}</strong>
                        <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                          {' '} - {m.codigo} - Grupo {m.grupo}
                        </span>
                        {m.docente_nombre && (
                          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                            Docente: {m.docente_nombre} {m.docente_apellido}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => retirarMateria(m.id)}
                        disabled={savingMateria}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'comentarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {detalle.comentarios.length === 0 && <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin comentarios registrados</div>}
                {detalle.comentarios.map((c) => {
                  const color = c.tipo === 'alerta' ? 'var(--crimson)' : c.tipo === 'felicitacion' || c.tipo === 'positivo' ? 'var(--forest)' : 'var(--gold)';
                  return (
                    <div key={c.id} style={{ padding: '.75rem 1rem', borderLeft: `3px solid ${color}`, background: 'var(--paper-dark)' }}>
                      <div className="flex justify-between">
                        <span className="text-mono" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color }}>{c.tipo}</span>
                        <span className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.9rem', marginTop: '.35rem' }}>"{c.comentario}"</p>
                      <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                        - {c.docente_nombre} {c.docente_apellido}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'cursos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {detalle.cursos.length === 0 && <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin cursos registrados</div>}
                {detalle.cursos.map((c) => (
                  <div key={c.id} style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.9rem' }}>
                    <strong>{c.nombre_curso}</strong>
                    <span style={{ color: 'var(--ink-light)' }}> - {c.institucion} - {c.horas}h</span>
                    <span className={`chip ${c.estado === 'aprobado' ? 'chip-forest' : c.estado === 'rechazado' ? 'chip-crimson' : 'chip-gold'}`} style={{ marginLeft: '.5rem' }}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={!!attendanceModal}
        onClose={() => setAttendanceModal(null)}
        title={
          attendanceModal
            ? `${attendanceModal.estado === 'presente' ? 'Asistencias' : attendanceModal.estado === 'falta' ? 'Faltas' : 'Detalle de asistencia'} - ${attendanceModal.estudiante?.nombre || ''} ${attendanceModal.estudiante?.apellido || ''}`
            : 'Detalle de asistencia'
        }
        maxWidth="960px"
      >
        {attendanceModal && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {attendanceLoading ? (
              <div className="loading-dots"><span/><span/><span/></div>
            ) : attendanceModal.error ? (
              <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)' }}>
                {attendanceModal.error}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '.6rem' }}>
                  {[
                    ['Total', attendanceModal.resumen.total, 'chip-ink'],
                    ['Presentes', attendanceModal.resumen.presente, 'chip-forest'],
                    ['Faltas', attendanceModal.resumen.falta, 'chip-crimson'],
                    ['Permisos', attendanceModal.resumen.permiso, 'chip-gold'],
                    ['Tardes', attendanceModal.resumen.tarde, 'chip-blue']
                  ].map(([label, value, chip]) => (
                    <div key={label} className="card" style={{ padding: '.8rem' }}>
                      <div className="text-serif" style={{ fontSize: '1.55rem', lineHeight: 1 }}>{value}</div>
                      <span className={`chip ${chip}`} style={{ marginTop: '.45rem' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="text-muted" style={{ fontSize: '.88rem' }}>
                    {attendanceModal.registros.length} registro{attendanceModal.registros.length === 1 ? '' : 's'} encontrados.
                  </div>
                  <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={descargarAsistenciasExcel} disabled={!attendanceModal.registros.length}>
                      Excel
                    </button>
                    <button className="btn btn-primary btn-sm" type="button" onClick={descargarAsistenciasPdf} disabled={!attendanceModal.registros.length}>
                      PDF
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Fecha</th>
                        <th>Materia</th>
                        <th>Estado</th>
                        <th>Justificacion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceModal.registros.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ink-light)' }}>
                            No hay registros para este indicador.
                          </td>
                        </tr>
                      )}
                      {attendanceModal.registros.map((row, index) => (
                        <tr key={row.id || `${row.fecha}-${row.materia_id}-${index}`}>
                          <td className="num">{String(index + 1).padStart(2, '0')}</td>
                          <td className="text-mono" style={{ fontSize: '.8rem' }}>{new Date(row.fecha).toLocaleDateString('es-ES')}</td>
                          <td>
                            <div>{row.materia_nombre}</div>
                            <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                              {row.materia_codigo} - Grupo {row.materia_grupo}
                            </div>
                          </td>
                          <td>
                            <span className={`chip ${row.estado === 'presente' ? 'chip-forest' : row.estado === 'falta' ? 'chip-crimson' : row.estado === 'permiso' ? 'chip-gold' : 'chip-blue'}`}>
                              {row.estado}
                            </span>
                          </td>
                          <td style={{ fontSize: '.84rem' }}>{row.justificacion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
