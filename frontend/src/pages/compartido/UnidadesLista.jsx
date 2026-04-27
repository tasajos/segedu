import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TIPO_ICON = {
  simulador: '⚡',
  contenido: '📄',
  ejercicio: '✏️'
};

const TIPO_LABEL = {
  simulador: 'Simulador interactivo',
  contenido: 'Contenido teórico',
  ejercicio: 'Ejercicio práctico'
};

const UNIT_ROUTES = {
  'Circuitos Lógicos': 'circuitos-logicos'
};

export default function UnidadesLista() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/unidades')
      .then(r => setUnidades(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openUnidad(u) {
    const slug = UNIT_ROUTES[u.nombre];
    if (slug) {
      navigate(`/${user.rol}/unidades/${slug}`);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--ink-light)' }}>Cargando...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '.3rem' }}>
          Unidades de Instrucción
        </h1>
        <p style={{ fontSize: '.88rem', color: 'var(--ink-light)' }}>
          Módulos de aprendizaje interactivo disponibles para la carrera.
        </p>
      </div>

      {unidades.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>
          No hay unidades disponibles aún.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {unidades.map(u => (
            <button
              key={u.id}
              onClick={() => openUnidad(u)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '.75rem',
                background: 'var(--paper-dark)',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '3px',
                padding: '1.25rem',
                transition: 'box-shadow .15s, transform .15s',
                textAlign: 'left'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{TIPO_ICON[u.tipo] || '📘'}</span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem' }}>{u.nombre}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.1rem' }}>
                    {TIPO_LABEL[u.tipo] || u.tipo} · Unidad {u.orden}
                  </div>
                </div>
              </div>
              {u.descripcion && (
                <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', margin: 0, lineHeight: 1.5 }}>
                  {u.descripcion.length > 120 ? u.descripcion.slice(0, 120) + '…' : u.descripcion}
                </p>
              )}
              <div style={{
                display: 'inline-block',
                alignSelf: 'flex-start',
                background: 'var(--ink)',
                color: '#fff',
                fontSize: '.72rem',
                padding: '.25rem .6rem',
                borderRadius: '2px',
                fontFamily: 'var(--mono)',
                marginTop: 'auto'
              }}>
                Abrir unidad →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
