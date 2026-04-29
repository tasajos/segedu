import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_COLOR  = { 1: '#F59E0B', 2: '#94a3b8', 3: '#CD7F32' };
const STEP_H       = { 1: 118, 2: 88, 3: 68 };
const STEP_W       = { 1: 148, 2: 132, 3: 118 };
const AVATAR_SIZE  = { 1: 72, 2: 60, 3: 52 };
const STEP_GRAD    = {
  1: 'linear-gradient(180deg,#fbbf24 0%,#d97706 100%)',
  2: 'linear-gradient(180deg,#94a3b8 0%,#64748b 100%)',
  3: 'linear-gradient(180deg,#d97706 0%,#78350f 100%)',
};

// Visual order on the stage: 2nd left, 1st center, 3rd right
const STAGE_ORDER = [2, 1, 3];

export default function EstudianteInicio() {
  const { user } = useAuth();
  const [resumen,      setResumen]      = useState([]);
  const [cursos,       setCursos]       = useState([]);
  const [materias,     setMaterias]     = useState([]);
  const [podio,        setPodio]        = useState([]);
  const [clasificados, setClasificados] = useState([]);
  const [miGrupo,      setMiGrupo]      = useState(null);
  const [mejorGrupo,   setMejorGrupo]   = useState(null);
  const [rankingReady, setRankingReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r, c, m, rk] = await Promise.all([
          api.get('/estudiante/asistencias/resumen'),
          api.get('/estudiante/cursos'),
          api.get('/estudiante/materias'),
          api.get('/estudiante/ranking-grupo')
        ]);
        setResumen(r.data);
        setCursos(c.data);
        setMaterias(m.data);
        setPodio(rk.data.podio || []);
        setClasificados(rk.data.clasificados || []);
        setMiGrupo(rk.data.miGrupo);
        setMejorGrupo(rk.data.mejorGrupo);
      } catch { /* silent */ }
      finally { setRankingReady(true); }
    })();
  }, []);

  const totalAsist   = resumen.reduce((s, r) => s + (+r.presentes || 0), 0);
  const totalFaltas  = resumen.reduce((s, r) => s + (+r.faltas    || 0), 0);
  const totalPermisos= resumen.reduce((s, r) => s + (+r.permisos  || 0), 0);

  const byPos = (pos) => podio.find((a) => a.posicion === pos);

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Panel del estudiante"
        title={<>Buen día, <span className="display-italic">{user.nombre}</span>.</>}
        lead={`Código ${user.codigo_estudiante || '—'} · ${user.carrera || 'Sin carrera'} · Semestre ${user.semestre || '—'}`}
      />

      {/* ── PODIO OLÍMPICO ── */}
      {rankingReady && podio.length > 0 && (
        <div className="podio-wrap">

          {/* Fondo: número gigante del mejor promedio */}
          {mejorGrupo && (
            <div className="podio-ghost">
              {mejorGrupo.promedio_grupo}
            </div>
          )}

          {/* Luz de escenario */}
          <div className="podio-spotlight" />

          {/* Cabecera */}
          <div className="podio-head">
            <span className="podio-eyebrow">Alto desempeño · Grupo {miGrupo}</span>
            <h2 className="podio-title">Podio del semestre</h2>
          </div>

          {/* Escenario */}
          <div className="podio-stage">
            {STAGE_ORDER.map((pos) => {
              const a = byPos(pos);
              if (!a) return null;
              return (
                <div key={a.estudiante_id} className="podio-col">
                  {/* Avatar */}
                  <div
                    className="podio-avatar"
                    style={{
                      width:  AVATAR_SIZE[pos],
                      height: AVATAR_SIZE[pos],
                      fontSize: AVATAR_SIZE[pos] * 0.33,
                      borderColor: MEDAL_COLOR[pos],
                      boxShadow: `0 0 24px ${MEDAL_COLOR[pos]}44`,
                      background: a.es_yo
                        ? `${MEDAL_COLOR[pos]}cc`
                        : 'rgba(255,255,255,.1)',
                      color: a.es_yo ? '#fff' : MEDAL_COLOR[pos],
                    }}
                  >
                    {a.nombre?.[0]}{a.apellido?.[0]}
                  </div>

                  {/* Nombre y puntaje */}
                  <div className="podio-name-block" style={{ maxWidth: STEP_W[pos] + 8 }}>
                    <div className="podio-name" style={{ fontWeight: a.es_yo ? 700 : 500 }}>
                      {a.nombre} {a.apellido}
                      {a.es_yo && (
                        <span style={{ color: MEDAL_COLOR[pos], marginLeft: '.35rem', fontSize: '.6rem', letterSpacing: '.12em' }}>
                          TÚ
                        </span>
                      )}
                    </div>
                    <div className="podio-score" style={{ color: MEDAL_COLOR[pos] }}>
                      {a.promedio_general} pts
                    </div>
                  </div>

                  {/* Escalón */}
                  <div
                    className="podio-step"
                    style={{
                      width:      STEP_W[pos],
                      height:     STEP_H[pos],
                      background: STEP_GRAD[pos],
                      boxShadow:  `0 -8px 28px ${MEDAL_COLOR[pos]}30`,
                    }}
                  >
                    <span className="podio-medal">{MEDAL[pos]}</span>
                    <span className="podio-rank">#{pos}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Línea de suelo */}
          <div className="podio-floor" />

          {/* 4° y 5° — también clasificados */}
          {clasificados.length > 0 && (
            <div className="podio-clasificados">
              {clasificados.map((est) => (
                <div
                  key={est.estudiante_id}
                  className="podio-cls-card"
                  style={{
                    borderColor: est.es_yo ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.09)',
                    background:  est.es_yo ? 'rgba(245,158,11,.08)' : 'rgba(255,255,255,.04)',
                  }}
                >
                  <div
                    className="podio-cls-avatar"
                    style={{
                      background:  est.es_yo ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.1)',
                      borderColor: est.es_yo ? '#F59E0B' : 'rgba(255,255,255,.2)',
                      color:       est.es_yo ? '#F59E0B' : 'rgba(255,255,255,.6)',
                    }}
                  >
                    {est.nombre?.[0]}{est.apellido?.[0]}
                  </div>
                  <div>
                    <div className="podio-cls-name" style={{ color: est.es_yo ? '#F59E0B' : 'rgba(255,255,255,.85)' }}>
                      {est.nombre} {est.apellido}
                      {est.es_yo && <span style={{ marginLeft: '.3rem', fontSize: '.6rem', color: '#F59E0B', letterSpacing: '.1em' }}>TÚ</span>}
                    </div>
                    <div className="podio-cls-score">#{est.posicion} · {est.promedio_general} pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="grid-4 mb-8">
        <StatCard num="01" label="Asistencias"  value={totalAsist}    hint="días presentes"        accent="forest"/>
        <StatCard num="02" label="Faltas"        value={totalFaltas}   hint="ausencias registradas"  accent="crimson"/>
        <StatCard num="03" label="Permisos"      value={totalPermisos} hint="con justificación"      accent="gold"/>
        <StatCard num="04" label="Cursos"        value={cursos.length} hint="capacitaciones"         accent="ink"/>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-head">
            <h2>Materias inscritas</h2>
            <span className="count">{materias.length} registros</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {materias.length === 0 && <EmptyState text="Sin materias inscritas" />}
            {materias.map((m, i) => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)', letterSpacing: '.15em' }}>
                      {String(i + 1).padStart(2, '0')} · {m.codigo}
                    </div>
                    <h3 style={{ marginTop: '.25rem' }}>{m.nombre}</h3>
                    <div className="text-muted" style={{ fontSize: '.85rem', marginTop: '.25rem' }}>
                      {m.docente_nombre
                        ? `Sr. Docente ${[m.docente_nombre, m.docente_apellido].filter(Boolean).join(' ')}`
                        : 'Sin docente asignado'}
                    </div>
                  </div>
                  <span className="chip chip-ink">Sem. {m.semestre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>Accesos rápidos</h2>
            <span className="count">04 acciones</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/estudiante/cursos" className="quick-link">
              <span className="ql-num">01</span>
              <div><div className="ql-title">Capacitaciones</div><div className="ql-desc">Subir certificados y cursos externos</div></div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/info" className="quick-link">
              <span className="ql-num">02</span>
              <div><div className="ql-title">Información personal</div><div className="ql-desc">Actualizar CI, teléfono y datos</div></div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/asistencias" className="quick-link">
              <span className="ql-num">03</span>
              <div><div className="ql-title">Asistencias</div><div className="ql-desc">Consultar asistencias y solicitar permiso</div></div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/tareas" className="quick-link">
              <span className="ql-num">04</span>
              <div><div className="ql-title">Mis tareas</div><div className="ql-desc">Ver materiales y entregar trabajos</div></div>
              <span className="ql-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Quick links ── */
        .quick-link {
          display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
          background: var(--paper-light); border: 1px solid var(--line);
          border-radius: 3px; transition: all .25s; text-decoration: none; color: inherit;
        }
        .quick-link:hover { border-color: var(--ink); transform: translateX(4px); background: var(--paper-dark); }
        .ql-num  { font-family: var(--mono); font-size: .7rem; color: var(--gold-dark); letter-spacing: .15em; width: 30px; }
        .ql-title{ font-family: var(--serif); font-size: 1.15rem; flex: 1; }
        .ql-desc { font-size: .82rem; color: var(--ink-light); margin-top: 2px; }
        .ql-arrow{ font-family: var(--serif); font-size: 1.5rem; color: var(--ink-light); transition: transform .2s; }
        .quick-link:hover .ql-arrow { color: var(--crimson); transform: translateX(4px); }

        /* ── Podium wrapper ── */
        .podio-wrap {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0d1829 0%, #162035 55%, #0a1520 100%);
          border-radius: 12px; padding: 2.5rem 2rem 2rem;
          margin-bottom: 2.5rem;
        }

        /* Ghost average in background */
        .podio-ghost {
          position: absolute; right: -1.5rem; top: -2.5rem;
          font-family: var(--serif); font-size: clamp(7rem, 18vw, 15rem);
          font-weight: 900; color: rgba(255,255,255,.035);
          line-height: 1; user-select: none; pointer-events: none;
          letter-spacing: -.04em;
        }

        /* Radial spotlight from top-center */
        .podio-spotlight {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 500px; height: 250px;
          background: radial-gradient(ellipse at top, rgba(245,158,11,.07) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Header area */
        .podio-head {
          text-align: center; margin-bottom: 2rem;
          position: relative; z-index: 1;
        }
        .podio-eyebrow {
          display: block; font-family: var(--mono); font-size: .6rem;
          letter-spacing: .2em; text-transform: uppercase;
          color: rgba(245,158,11,.75); margin-bottom: .5rem;
        }
        .podio-title {
          font-family: var(--serif); font-size: 1.8rem; font-weight: 800;
          color: #fff; margin: 0 0 .75rem;
        }
        .podio-best-badge {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .35rem 1rem;
          background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.22);
          border-radius: 999px; font-family: var(--mono); font-size: .72rem;
          color: rgba(255,255,255,.65); letter-spacing: .04em;
        }

        /* Stage */
        .podio-stage {
          display: flex; align-items: flex-end; justify-content: center;
          gap: 0; position: relative; z-index: 1;
        }
        .podio-col {
          display: flex; flex-direction: column; align-items: center;
        }

        /* Avatar circle */
        .podio-avatar {
          border-radius: 50%; border: 2.5px solid;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--serif); font-weight: 700;
          margin-bottom: .5rem;
          transition: transform .3s ease;
        }
        .podio-avatar:hover { transform: scale(1.06); }

        /* Name block */
        .podio-name-block { text-align: center; margin-bottom: .65rem; }
        .podio-name {
          font-family: var(--serif); font-size: .82rem; color: #fff;
          line-height: 1.3; white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis;
        }
        .podio-score {
          font-family: var(--mono); font-size: .68rem; margin-top: .2rem; font-weight: 700;
        }

        /* Podium step */
        .podio-step {
          border-radius: 4px 4px 0 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: .3rem;
        }
        .podio-medal { font-size: 1.5rem; line-height: 1; }
        .podio-rank  {
          font-family: var(--mono); font-size: .62rem;
          color: rgba(255,255,255,.7); letter-spacing: .12em;
        }

        /* Floor line */
        .podio-floor {
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent);
          position: relative; z-index: 1;
        }

        /* 4th and 5th */
        .podio-clasificados {
          display: flex; gap: 1rem; justify-content: center;
          margin-top: 1.25rem; position: relative; z-index: 1; flex-wrap: wrap;
        }
        .podio-cls-card {
          display: flex; align-items: center; gap: .75rem;
          padding: .6rem 1rem; border-radius: 8px; border: 1px solid;
          min-width: 190px;
        }
        .podio-cls-avatar {
          width: 36px; height: 36px; border-radius: 50%; border: 1px solid;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--serif); font-size: .8rem; font-weight: 700;
          flex-shrink: 0;
        }
        .podio-cls-name {
          font-family: var(--serif); font-size: .82rem; line-height: 1.3;
        }
        .podio-cls-score {
          font-family: var(--mono); font-size: .68rem;
          color: rgba(255,255,255,.38); margin-top: .1rem;
        }
      `}</style>
    </>
  );
}

const EmptyState = ({ text }) => (
  <div style={{
    padding: '2rem', textAlign: 'center',
    border: '1px dashed var(--line-strong)', borderRadius: '3px',
    color: 'var(--ink-light)', fontFamily: 'var(--serif)', fontStyle: 'italic'
  }}>
    {text}
  </div>
);
