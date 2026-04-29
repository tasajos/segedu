import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

export default function DocenteInicio() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [pgo, setPgo] = useState([]);
  const [avance, setAvance] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [m, p, a] = await Promise.all([
          api.get('/docente/materias'),
          api.get('/docente/pgo'),
          api.get('/docente/avance')
        ]);
        setMaterias(m.data); setPgo(p.data); setAvance(a.data);
      } catch {}
    })();
  }, []);

  const totalEstudiantes = materias.reduce((s, m) => s + (+m.total_estudiantes || 0), 0);
  const avanceProm = avance.length ? Math.round(avance.reduce((s, a) => s + (+a.porcentaje_avance), 0) / avance.length) : 0;
  const pgoPendientes = pgo.filter(p => p.estado === 'enviado' || p.estado === 'revision').length;
  const docenteNombreCompleto = [user.nombre, user.apellido].filter(Boolean).join(' ');

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Panel docente"
        title={<>Buen día, <span className="display-italic">Sr. Docente {docenteNombreCompleto}</span>.</>}
        lead={user.especialidad || 'Panel de seguimiento académico para docentes'}
      />

      <div className="grid-4 mb-8">
        <StatCard num="01" label="Materias" value={materias.length} hint="a cargo" accent="ink"/>
        <StatCard num="02" label="Estudiantes" value={totalEstudiantes} hint="en total" accent="forest"/>
        <StatCard num="03" label="Avance promedio" value={`${avanceProm}%`} hint="del programa" accent="gold"/>
        <StatCard num="04" label="PGO pendientes" value={pgoPendientes} hint="de revisión" accent="crimson"/>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-head">
            <h2>Mis materias</h2>
            <span className="count">{materias.length} asignadas</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {materias.map((m, i) => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                      {String(i + 1).padStart(2, '0')} · {m.codigo}
                    </div>
                    <h3 style={{ marginTop: '.25rem' }}>{m.nombre}</h3>
                    <div className="text-muted" style={{ fontSize: '.85rem', marginTop: '.25rem' }}>
                      Semestre {m.semestre} · {m.creditos} créditos
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-serif" style={{ fontSize: '1.75rem', color: 'var(--crimson)' }}>{m.total_estudiantes}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.1em' }}>ESTUDIANTES</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>Últimos avances</h2>
            <Link to="/docente/avance" className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>VER TODOS →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {avance.slice(0, 5).map(a => (
              <div key={a.id} className="card">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>{a.fecha}</span>
                  {a.validado
                    ? <span className="chip chip-forest">Validado</span>
                    : <span className="chip chip-gold">En revisión</span>}
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>{a.tema}</h3>
                <div className="text-muted" style={{ fontSize: '.8rem', marginTop: '.25rem' }}>{a.materia_nombre}</div>
                <div style={{ marginTop: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{ flex: 1, height: '4px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${a.porcentaje_avance}%`, height: '100%', background: 'var(--gold)' }} />
                  </div>
                  <span className="text-mono" style={{ fontSize: '.75rem' }}>{a.porcentaje_avance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
