import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PresentationViewer from '../../components/PresentationViewer';

const isDriveFolder = (url) => /drive\.google\.com\/drive\/folders\//i.test(url || '');

const tipoEfectivo = (p) =>
  p.tipo_archivo === 'link' && isDriveFolder(p.enlace_url) ? 'drive_folder' : p.tipo_archivo;

const TIPO_ICON  = { pdf: '📄', pptx: '📊', link: '🔗', drive_folder: '📁' };
const TIPO_BADGE = { pdf: 'PDF', pptx: 'PPT', link: 'URL', drive_folder: 'CARPETA' };
const TIPO_COLOR = {
  pdf:          { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  pptx:         { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  link:         { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  drive_folder: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

// ── Ítem individual de presentación ──────────────────────────
function ItemPresentacion({ p, onVer, isLast }) {
  const tipo = tipoEfectivo(p);
  const col  = TIPO_COLOR[tipo] || TIPO_COLOR.link;
  const esFolder = tipo === 'drive_folder';
  return (
    <button
      onClick={() => onVer(p)}
      style={{
        all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: '.85rem',
        padding: '.7rem 1.1rem .7rem 1.5rem',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-100)',
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }}>
        {TIPO_ICON[tipo]}
      </span>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.titulo}
        </div>
        {p.descripcion && (
          <div style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: '.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.descripcion}
          </div>
        )}
      </div>
      <span style={{ fontSize: '.65rem', fontWeight: 800, letterSpacing: '.04em', padding: '.15rem .5rem', borderRadius: 99, flexShrink: 0, background: col.bg, color: col.color, border: `1px solid ${col.border}` }}>
        {TIPO_BADGE[tipo]}
      </span>
      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--blue-600)', background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 4, padding: '.2rem .55rem', flexShrink: 0 }}>
        {esFolder ? 'Abrir →' : 'Ver →'}
      </span>
    </button>
  );
}

// ── Carpeta / módulo colapsable ───────────────────────────────
function ModuloCarpeta({ nombre, items, onVer, defaultOpen = true }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '.45rem' }}>
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: '.6rem',
          padding: '.6rem 1rem',
          background: 'var(--gray-50)',
          borderBottom: abierto ? '1px solid var(--border)' : 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', textAlign: 'left' }}>
          {nombre}
        </span>
        <span style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 99, padding: '.1rem .5rem' }}>
          {items.length}
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{abierto ? '▼' : '▶'}</span>
      </button>
      {abierto && items.map((p, i) => (
        <ItemPresentacion key={p.id} p={p} onVer={onVer} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}

// ── Tarjeta de materia (tipo "curso" Coursera) ────────────────
function TarjetaMateria({ materia, items, onVer }) {
  // Agrupar items por carpeta
  const { modulos, sueltos } = (() => {
    const map = {};
    const sin = [];
    items.forEach(p => {
      if (p.carpeta_id) {
        if (!map[p.carpeta_id]) map[p.carpeta_id] = { nombre: p.carpeta_nombre, orden: p.carpeta_orden ?? 0, items: [] };
        map[p.carpeta_id].items.push(p);
      } else {
        sin.push(p);
      }
    });
    const ordenados = Object.values(map).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
    return { modulos: ordenados, sueltos: sin };
  })();

  const tieneCarpetas = modulos.length > 0;

  // Iniciales de la carrera para el badge
  const inicialesCarrera = (nombre) => {
    if (!nombre) return '??';
    const skip = new Set(['de', 'del', 'en', 'la', 'las', 'los', 'y', 'e', 'a']);
    const iniciales = nombre.split(/\s+/)
      .filter(w => !skip.has(w.toLowerCase()))
      .map(w => w[0]?.toUpperCase())
      .join('');
    return iniciales.slice(0, 3) || nombre.slice(0, 3).toUpperCase();
  };

  // Color de acento por índice de carrera (variación visual entre materias)
  const colores = [
    'var(--blue-600)', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  ];
  const acento = colores[(materia.semestre ?? 1) % colores.length];

  return (
    <article style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow .2s, border-color .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--gray-300)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Banda de color */}
      <div style={{ height: 4, background: acento }} />

      {/* Encabezado de la materia */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
        {/* Badge con iniciales de carrera */}
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: acento, display: 'grid', placeItems: 'center',
          color: '#fff', fontWeight: 800, fontSize: '.75rem', fontFamily: 'var(--font-mono)',
          letterSpacing: '.02em',
        }}>
          {inicialesCarrera(materia.carrera_nombre)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '.98rem', color: 'var(--text)', lineHeight: 1.25 }}>
            {materia.nombre}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.2rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <span>Grupo <strong>{materia.grupo}</strong></span>
            <span>·</span>
            <span>Semestre {materia.semestre}</span>
            <span>·</span>
            <span>{materia.docente_nombre} {materia.docente_apellido}</span>
          </div>
        </div>
        <div style={{
          fontSize: '.72rem', fontWeight: 700, color: 'var(--text-muted)',
          background: 'var(--gray-100)', border: '1px solid var(--border)',
          borderRadius: 99, padding: '.25rem .75rem', flexShrink: 0,
        }}>
          {items.length} {items.length === 1 ? 'material' : 'materiales'}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '1rem 1.25rem 1.1rem' }}>
        {modulos.map(m => (
          <ModuloCarpeta key={m.nombre} nombre={m.nombre} items={m.items} onVer={onVer} />
        ))}
        {sueltos.length > 0 && (
          tieneCarpetas
            ? <ModuloCarpeta nombre="Otros materiales" items={sueltos} onVer={onVer} defaultOpen={!tieneCarpetas} />
            : sueltos.map((p, i) => (
                <ItemPresentacion key={p.id} p={p} onVer={onVer} isLast={i === sueltos.length - 1} />
              ))
        )}
      </div>
    </article>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function PresentacionesVista() {
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [visor, setVisor]     = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/auth/mis-presentaciones')
      .then(r => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(err => setErrorCarga(err.response?.data?.error || 'Error al cargar presentaciones'))
      .finally(() => setLoading(false));
  }, []);

  // Agrupar por materia (materia_id es único por materia+grupo)
  const materias = (() => {
    const map = {};
    lista.forEach(p => {
      const key = p.materia_id;
      if (!map[key]) {
        map[key] = {
          id: p.materia_id,
          nombre: p.materia_nombre,
          codigo: p.materia_codigo,
          grupo: p.materia_grupo,
          semestre: p.materia_semestre,
          carrera_nombre: p.carrera_nombre,
          docente_nombre: p.docente_nombre,
          docente_apellido: p.docente_apellido,
          items: [],
        };
      }
      // Evitar duplicados (misma presentación no debe aparecer dos veces en la misma materia)
      if (!map[key].items.find(x => x.id === p.id)) {
        map[key].items.push(p);
      }
    });
    return Object.values(map).sort((a, b) =>
      a.nombre.localeCompare(b.nombre) || a.grupo.localeCompare(b.grupo)
    );
  })();

  // Filtro búsqueda
  const materiasFiltradas = busqueda.trim()
    ? materias.map(m => ({
        ...m,
        items: m.items.filter(p =>
          p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
        ),
      })).filter(m => m.items.length > 0)
    : materias;

  const totalMateriales = lista.length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.75rem' }}>
        <span className="eyebrow">Material de estudio</span>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginTop: '.25rem', letterSpacing: '-.02em' }}>
          Presentaciones
        </h1>
        <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>
          Material de clase organizado por tus materias. Solo puedes visualizarlo.
        </p>
      </div>

      {/* Buscador */}
      {!loading && !errorCarga && totalMateriales > 0 && (
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <svg style={{ position: 'absolute', left: '.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar presentación…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '.65rem .875rem .65rem 2.5rem',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)', color: 'var(--text)',
              fontSize: '.9rem', fontFamily: 'var(--font)', outline: 'none',
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      )}

      {/* Estados */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="loading-dots"><span/><span/><span/></div>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '.88rem' }}>Cargando material…</p>
        </div>
      ) : errorCarga ? (
        <div style={{ padding: '1.25rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '.88rem' }}>
          {errorCarga}
        </div>
      ) : totalMateriales === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--surface)', border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
            Aún no hay presentaciones disponibles para tus materias.
          </p>
        </div>
      ) : materiasFiltradas.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
          Sin resultados para "<strong>{busqueda}</strong>".
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
              {materiasFiltradas.length} materia{materiasFiltradas.length !== 1 ? 's' : ''} · {totalMateriales} material{totalMateriales !== 1 ? 'es' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {materiasFiltradas.map(m => (
              <TarjetaMateria key={m.id} materia={m} items={m.items} onVer={setVisor} />
            ))}
          </div>
        </>
      )}

      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentación'} maxWidth="1120px">
        {visor && <PresentationViewer presentation={visor} />}
      </Modal>
    </div>
  );
}
