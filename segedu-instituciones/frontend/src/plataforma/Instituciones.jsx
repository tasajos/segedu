import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatCard from '../components/StatCard';
import NuevaInstitucion from './NuevaInstitucion';
import useAccionesInstitucion from './useAccionesInstitucion';
import api from './api';
import { fecha, mensajeError, tipos } from './utils';

const ESTADOS = {
  activa: { texto: 'Activa', chip: 'chip-forest' },
  suspendida: { texto: 'Suspendida', chip: 'chip-gold' },
  creando: { texto: 'Creando', chip: 'chip-blue' },
  error: { texto: 'Con error', chip: 'chip-crimson' }
};

const PASOS = {
  base: 'Crear la base de datos', usuario: 'Crear el usuario de la base', esquema: 'Cargar las tablas',
  datos: 'Registrar institución y administrador', subdominio: 'Crear el subdominio', listo: 'Listo'
};

const ACCIONES_EVENTO = {
  'institucion.creada': 'Institución creada',
  'institucion.error': 'Error al configurar',
  'institucion.suspendida': 'Suspendida',
  'institucion.reactivada': 'Reactivada',
  'institucion.editada': 'Datos editados',
  'institucion.admin_restablecido': 'Contraseña del administrador restablecida'
};

function Estado({ estado }) {
  const e = ESTADOS[estado] || { texto: estado, chip: 'chip-ink' };
  return <span className={`chip ${e.chip}`}>{e.texto}</span>;
}

function Acciones({ inst, busy, ejecutar, conVer = true }) {
  return <div className="plataforma-row-actions">
    {conVer && <Link className="btn btn-ghost btn-sm" to={`/instituciones/${inst.id}`}>Ver</Link>}
    {(inst.estado === 'activa' || inst.estado === 'suspendida') && (
      <button type="button" className={`btn btn-sm ${inst.estado === 'activa' ? 'btn-danger' : 'btn-secondary'}`} disabled={busy}
        onClick={() => ejecutar(inst, 'estado')}>{inst.estado === 'activa' ? 'Suspender' : 'Reactivar'}</button>
    )}
    {inst.estado === 'activa' && (
      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => ejecutar(inst, 'restablecer')}>Restablecer administrador</button>
    )}
    {inst.estado === 'error' && (
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} aria-busy={busy} onClick={() => ejecutar(inst, 'reintentar')}>
        {busy ? 'Reintentando…' : 'Reintentar'}
      </button>
    )}
  </div>;
}

function Lista() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [nueva, setNueva] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try { setItems((await api.get('/instituciones')).data); }
    catch (err) { setError(mensajeError(err)); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const { busy, ejecutar, creado, fallido, dialogs } = useAccionesInstitucion(cargar);

  const conteo = useMemo(() => {
    const c = { total: 0, activa: 0, suspendida: 0, error: 0 };
    for (const i of items || []) { c.total++; if (c[i.estado] !== undefined) c[i.estado]++; }
    return c;
  }, [items]);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (items || []).filter((i) => (filtro === 'todas' || i.estado === filtro)
      && (!q || [i.nombre, i.sigla, i.subdominio, i.admin?.email].some((v) => String(v || '').toLowerCase().includes(q))));
  }, [items, buscar, filtro]);

  return <>
    <div className="plataforma-head">
      <div>
        <p className="eyebrow">Plataforma Chakuy</p>
        <h1>Instituciones</h1>
        <p className="text-muted">Cada institución tiene su propio subdominio y su propia base de datos.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => setNueva(true)}>+ Nueva institución</button>
    </div>

    <div className="plataforma-stats">
      <StatCard label="Instituciones" value={items ? conteo.total : '—'} accent="ink" />
      <StatCard label="Activas" value={items ? conteo.activa : '—'} accent="forest" />
      <StatCard label="Suspendidas" value={items ? conteo.suspendida : '—'} accent="gold" />
      <StatCard label="Con error" value={items ? conteo.error : '—'} accent="crimson" />
    </div>

    <section className="card plataforma-card">
      <div className="plataforma-toolbar">
        <input className="form-input" type="search" placeholder="Buscar por nombre, sigla, subdominio o correo…" aria-label="Buscar instituciones"
          value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select className="form-input" aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todas">Todos los estados</option>
          {Object.entries(ESTADOS).map(([v, e]) => <option key={v} value={v}>{e.texto}</option>)}
        </select>
      </div>

      {error ? <div className="error-state" role="alert"><p>{error}</p><button className="btn btn-primary btn-sm mt-2" onClick={cargar}>Reintentar</button></div>
        : !items ? <div className="loading-state" role="status">Cargando instituciones…</div>
        : !items.length ? <div className="empty-state">
            <img src="/chakuy.png" alt="" width="72" height="72" />
            <p><strong>Todavía no hay instituciones.</strong></p>
            <p>Cree la primera con «Nueva institución».</p>
          </div>
        : !visibles.length ? <div className="empty-state">Ninguna institución coincide con la búsqueda.</div>
        : <div className="table-scroll"><table className="data-table">
            <thead><tr><th>Institución</th><th>Dirección</th><th>Tipo</th><th>Estado</th><th>Administrador</th><th>Alta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{visibles.map((i) => <tr key={i.id}>
              <td><Link to={`/instituciones/${i.id}`} className="plataforma-nombre">{i.nombre}</Link>{i.sigla && <span className="text-muted"> · {i.sigla}</span>}</td>
              <td><a href={i.url} target="_blank" rel="noreferrer" className="text-mono">{i.subdominio}</a></td>
              <td>{tipos[i.tipo] || i.tipo}</td>
              <td><Estado estado={i.estado} />{i.estado === 'error' && i.paso && <div className="plataforma-paso">Falló: {PASOS[i.paso] || i.paso}</div>}</td>
              <td className="text-muted">{i.admin?.email}</td>
              <td className="text-muted">{fecha(i.created_at)}</td>
              <td><Acciones inst={i} busy={busy} ejecutar={ejecutar} /></td>
            </tr>)}</tbody>
          </table></div>}
    </section>

    {nueva && <NuevaInstitucion
      onClose={() => setNueva(false)}
      onCreated={(data) => { setNueva(false); creado(data); }}
      onFailure={(err) => { setNueva(false); fallido(err); }}
    />}
    {dialogs}
  </>;
}

function Detalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try { setInst((await api.get(`/instituciones/${id}`)).data); }
    catch (err) { setError(err.response?.status === 404 ? 'La institución no existe.' : mensajeError(err)); }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);
  const { busy, ejecutar, dialogs } = useAccionesInstitucion(cargar);

  if (error) return <div className="error-state" role="alert"><p>{error}</p>
    <div className="plataforma-actions mt-2"><button className="btn btn-primary btn-sm" onClick={cargar}>Reintentar</button>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>Volver</button></div></div>;
  if (!inst) return <div className="loading-state" role="status">Cargando institución…</div>;

  return <>
    <Link to="/" className="btn btn-ghost btn-sm mb-4">← Instituciones</Link>
    <div className="plataforma-head">
      <div>
        <p className="eyebrow">{tipos[inst.tipo] || inst.tipo}{inst.sigla ? ` · ${inst.sigla}` : ''}</p>
        <h1>{inst.nombre}</h1>
        <p><a href={inst.url} target="_blank" rel="noreferrer" className="text-mono">{inst.url}</a></p>
      </div>
      <Estado estado={inst.estado} />
    </div>

    {inst.estado === 'error' && <div className="error-state mb-4" role="alert">
      <p><strong>Falló el paso: {PASOS[inst.paso] || inst.paso}</strong></p>
      {inst.error && <p className="text-mono plataforma-error-detalle">{inst.error}</p>}
    </div>}

    <div className="grid-2">
      <section className="card plataforma-card">
        <h3>Administrador</h3>
        <dl className="plataforma-dl">
          <dt>Nombre</dt><dd>{inst.admin?.nombre} {inst.admin?.apellido}</dd>
          <dt>Correo</dt><dd>{inst.admin?.email}</dd>
          <dt>Alta</dt><dd>{fecha(inst.created_at)}</dd>
          <dt>Última modificación</dt><dd>{fecha(inst.updated_at)}</dd>
        </dl>
        <Acciones inst={inst} busy={busy} ejecutar={ejecutar} conVer={false} />
      </section>
      <section className="card plataforma-card">
        <h3>Historial</h3>
        {!inst.eventos?.length ? <p className="text-muted">Sin eventos registrados.</p>
          : <ol className="plataforma-eventos">{inst.eventos.map((e, n) => <li key={n}>
              <span>{ACCIONES_EVENTO[e.accion] || e.accion}</span>
              <time className="text-muted">{fecha(e.created_at)}</time>
            </li>)}</ol>}
      </section>
    </div>
    {dialogs}
  </>;
}

export default function Instituciones({ detalle = false }) {
  return detalle ? <Detalle /> : <Lista />;
}
