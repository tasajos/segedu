import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const TIPO_COLOR = { falta: 'var(--crimson)', sancion: '#7b2d8b', permiso: 'var(--gold)' };
const TIPO_CHIP = { falta: 'chip-crimson', sancion: 'chip-ink', permiso: 'chip-gold' };

export default function DocenteMiDisciplina() {
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    api.get('/docente/mi-disciplina').then(r => setRegistros(r.data));
  }, []);

  const faltas = registros.filter(r => r.tipo === 'falta').length;
  const sanciones = registros.filter(r => r.tipo === 'sancion').length;
  const permisos = registros.filter(r => r.tipo === 'permiso').length;

  return (
    <>
      <PageHeader
        num="06"
        eyebrow="Mi registro personal"
        title={<>Mi <span className="display-italic">disciplina</span></>}
        lead="Consulte las faltas, sanciones y permisos registrados para usted por el jefe de carrera."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { tipo: 'falta', count: faltas, label: 'Faltas' },
          { tipo: 'sancion', count: sanciones, label: 'Sanciones' },
          { tipo: 'permiso', count: permisos, label: 'Permisos' }
        ].map(item => (
          <div key={item.tipo} style={{
            padding: '1.25rem', background: 'var(--paper-dark)', borderRadius: '2px',
            borderTop: `4px solid ${TIPO_COLOR[item.tipo]}`
          }}>
            <div className="text-serif" style={{ fontSize: '2.5rem', lineHeight: 1 }}>{item.count}</div>
            <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.4rem' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {registros.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem', color: 'var(--ink-light)', fontStyle: 'italic',
          background: 'var(--paper-dark)', borderRadius: '2px'
        }}>
          Sin registros disciplinarios
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {registros.map(r => (
            <div key={r.id} style={{
              padding: '1rem 1.25rem', borderLeft: `4px solid ${TIPO_COLOR[r.tipo]}`,
              background: 'var(--paper-dark)', borderRadius: '0 2px 2px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`chip ${TIPO_CHIP[r.tipo]}`}>{r.tipo}</span>
                <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                  {new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: '.95rem', marginTop: '.5rem', marginBottom: '.4rem' }}>{r.descripcion}</p>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                {r.materia_nombre && `Materia: ${r.materia_nombre} · `}
                Registrado por: {r.registrado_nombre} {r.registrado_apellido}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
