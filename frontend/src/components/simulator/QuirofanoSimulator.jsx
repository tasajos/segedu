import { useState, useEffect } from 'react';
import api from '../../services/api';

const ROLES_QUIRURGICOS = [
  'Cirujano Jefe', 'Cirujano Asistente', 'Anestesiólogo/a',
  'Instrumentista', 'Enfermero/a Quirúrgico/a', 'Internista/Intensivista',
  'Perfusionista', 'Jefe de Piso',
];

const URGENCIA_CFG = {
  inmediata: { color: '#dc2626', bg: '#fee2e2', label: 'INMEDIATA' },
  alta:      { color: '#d97706', bg: '#fef3c7', label: 'ALTA' },
  media:     { color: '#16a34a', bg: '#dcfce7', label: 'MEDIA' },
};

const RIESGO_CFG = {
  bajo:  { border: '#16a34a', bg: '#f0fdf4', badge: '#dcfce7', text: '#16a34a', label: 'Riesgo bajo' },
  medio: { border: '#d97706', bg: '#fffbeb', badge: '#fef3c7', text: '#d97706', label: 'Riesgo medio' },
  alto:  { border: '#dc2626', bg: '#fff5f5', badge: '#fee2e2', text: '#dc2626', label: 'Riesgo alto' },
};

const ESTADO_CFG = {
  Estable:    { color: '#16a34a', bg: '#dcfce7' },
  Inestable:  { color: '#d97706', bg: '#fef3c7' },
  Crítico:    { color: '#dc2626', bg: '#fee2e2' },
  PCR:        { color: '#fff',    bg: '#7f1d1d' },
};

const IMPACTO_CFG = {
  positivo: { color: '#16a34a', icon: '↑' },
  negativo: { color: '#dc2626', icon: '↓' },
  neutral:  { color: '#64748b', icon: '→' },
};

const DESEMPENO_CFG = {
  Excelente: { color: '#16a34a', bg: '#dcfce7' },
  Bueno:     { color: '#1d4ed8', bg: '#dbeafe' },
  Regular:   { color: '#d97706', bg: '#fef3c7' },
  Deficiente:{ color: '#dc2626', bg: '#fee2e2' },
};

const monoSt = { fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em' };

const VitalItem = ({ label, value, warn, critical }) => {
  const color = critical ? '#dc2626' : warn ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.1rem', minWidth: 56 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '.85rem', fontWeight: 700, color }}>{value}</span>
      {(warn || critical) && <span style={{ fontSize: '.55rem', color }}>▲</span>}
    </div>
  );
};

const CSS = `
  @keyframes pulse-red { 0%,100%{opacity:1} 50%{opacity:.6} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .qx-grid-caso   { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .qx-grid-equipo { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
  .qx-grid-ops    { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .qx-grid-eval   { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .qx-card-op { border-radius:10px; padding:1rem; cursor:pointer; border:2px solid transparent;
    transition:transform .15s, box-shadow .15s, border-color .15s; animation:fadeIn .3s ease; }
  .qx-card-op:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.1); }
  .qx-card-op.selected { border-color:#1d4ed8!important; box-shadow:0 0 0 3px rgba(29,78,216,.2); }
  .qx-card-op.disabled { opacity:.45; cursor:not-allowed; pointer-events:none; }
  .qx-alerta { background:#7f1d1d; border:2px solid #dc2626; border-radius:10px; padding:1rem 1.25rem;
    animation:pulse-red 1.2s infinite; display:flex; align-items:center; gap:.85rem; }
  .qx-vitals { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; background:#0f172a;
    border-radius:8px; padding:.65rem 1rem; }
  .qx-team-strip { display:flex; flex-wrap:wrap; gap:.4rem; }
  .qx-report-score { width:90px; height:90px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; }
  @media (max-width:640px) {
    .qx-grid-caso   { grid-template-columns:1fr; }
    .qx-grid-equipo { grid-template-columns:1fr; }
    .qx-grid-ops    { grid-template-columns:1fr; }
    .qx-grid-eval   { grid-template-columns:1fr; }
  }
  @media (min-width:641px) and (max-width:900px) {
    .qx-grid-equipo { grid-template-columns:1fr; }
  }
`;

export default function QuirofanoSimulator() {
  const [fase, setFase]             = useState('caso');
  const [loadingCaso, setLoadingCaso] = useState(false);
  const [caso, setCaso]             = useState(null);
  const [usuarios, setUsuarios]     = useState([]);
  const [busqueda, setBusqueda]     = useState('');
  const [equipo, setEquipo]         = useState([]); // [{ id, nombre, apellido, rol, rol_quirurgico }]
  const [loadingPaso, setLoadingPaso] = useState(false);
  const [pasoActual, setPasoActual] = useState(null);
  const [historial, setHistorial]   = useState([]);
  const [decSelec, setDecSelec]     = useState(null);
  const [loadingInforme, setLoadingInforme] = useState(false);
  const [informe, setInforme]       = useState(null);
  const [error, setError]           = useState(null);

  useEffect(() => {
    api.get('/auth/usuarios-equipo').then(r => setUsuarios(r.data)).catch(() => {});
  }, []);

  const generarCaso = async () => {
    setLoadingCaso(true); setError(null); setCaso(null);
    try {
      const { data } = await api.post('/auth/quirofano-caso');
      setCaso(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar caso.');
    } finally { setLoadingCaso(false); }
  };

  const agregarAlEquipo = (u) => {
    if (equipo.length >= 8) return;
    if (equipo.find(m => m.id === u.id)) return;
    setEquipo(prev => [...prev, { ...u, rol_quirurgico: ROLES_QUIRURGICOS[0] }]);
  };

  const quitarDelEquipo = (id) => setEquipo(prev => prev.filter(m => m.id !== id));

  const cambiarRol = (id, rol) => setEquipo(prev => prev.map(m => m.id === id ? { ...m, rol_quirurgico: rol } : m));

  const iniciarSimulacion = async () => {
    setFase('simulacion');
    setHistorial([]);
    setPasoActual(null);
    setDecSelec(null);
    setError(null);
    await cargarPaso(1, []);
  };

  const cargarPaso = async (num, hist) => {
    setLoadingPaso(true); setError(null);
    try {
      const { data } = await api.post('/auth/quirofano-paso', { caso, equipo, historial: hist, paso_numero: num });
      setPasoActual(data);
      setDecSelec(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la simulación.');
    } finally { setLoadingPaso(false); }
  };

  const tomarDecision = async (opcion) => {
    if (loadingPaso || decSelec) return;
    setDecSelec(opcion.id);
    const entrada = {
      paso: pasoActual.paso,
      situacion_titulo: pasoActual.situacion_titulo,
      descripcion: pasoActual.descripcion,
      vitales: pasoActual.vitales,
      decision_id: opcion.id,
      decision_texto: opcion.titulo,
      resultado_breve: `Se eligió: ${opcion.titulo}`,
    };
    const nuevaHist = [...historial, entrada];
    setHistorial(nuevaHist);

    if (pasoActual.fin_operacion || pasoActual.paso >= 4) {
      await cargarPaso(5, nuevaHist);
    } else {
      await cargarPaso(pasoActual.paso + 1, nuevaHist);
    }
  };

  const generarInforme = async () => {
    setLoadingInforme(true); setError(null);
    try {
      const { data } = await api.post('/auth/quirofano-informe', {
        caso, equipo, historial,
        resultado_final: pasoActual?.resultado_final,
      });
      setInforme(data);
      setFase('informe');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar informe.');
    } finally { setLoadingInforme(false); }
  };

  const reset = () => {
    setFase('caso'); setCaso(null); setEquipo([]); setHistorial([]);
    setPasoActual(null); setInforme(null); setError(null); setDecSelec(null);
  };

  const downloadPDF = () => {
    const scoreColor = informe.resultado_global === 'Exitoso' ? '#16a34a' : informe.resultado_global === 'Parcial' ? '#d97706' : '#dc2626';
    const equipoRows = (informe.evaluacion_equipo || []).map(m => {
      const dc = { Excelente: '#16a34a', Bueno: '#1d4ed8', Regular: '#d97706', Deficiente: '#dc2626' };
      return `<tr><td><strong>${m.nombre}</strong></td><td>${m.rol}</td><td style="color:${dc[m.desempeno]||'#333'};font-weight:600">${m.desempeno}</td><td>${m.observacion}</td></tr>`;
    }).join('');
    const cronRows = (informe.cronologia || []).map(ev => {
      const ic = { positivo: '↑', negativo: '↓', neutral: '→' };
      const cc = { positivo: '#16a34a', negativo: '#dc2626', neutral: '#64748b' };
      return `<tr><td style="text-align:center;font-weight:700;color:${cc[ev.impacto]||'#333'}">${ic[ev.impacto]||'→'} P${ev.paso}</td><td><strong>${ev.evento}</strong><br><em style="color:#64748b">${ev.decision}</em></td><td>${ev.explicacion_medica}</td></tr>`;
    }).join('');
    const decRows = (informe.decisiones_criticas || []).map(d => {
      const ok = d.fue_correcta;
      return `<tr style="background:${ok?'#f0fdf4':'#fff1f2'}"><td>P${d.paso}</td><td>${d.decision}</td><td style="color:${ok?'#16a34a':'#dc2626'};font-weight:700">${ok?'✓ Correcta':'✗ Incorrecta'}</td><td>${ok ? '—' : (d.alternativa_correcta||'—')}</td><td>${d.explicacion}</td></tr>`;
    }).join('');
    const aprendizaje = (informe.puntos_de_aprendizaje || []).map((p,i) => `<li>${p}</li>`).join('');
    const recomendaciones = (informe.recomendaciones || []).map(r => `<li>${r}</li>`).join('');
    const errores = (informe.errores_identificados || []).map(e => `<li>${e}</li>`).join('');
    const complicaciones = (informe.complicaciones_presentadas || []).map(c => `<li>${c}</li>`).join('');
    const equipoCaso = equipo.map(m => `${m.nombre} ${m.apellido||''} (${m.rol_quirurgico})`).join(', ');
    const fecha = new Date().toLocaleDateString('es-BO', { year:'numeric', month:'long', day:'numeric' });

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Informe Quirúrgico — ${caso?.emergencia || 'Simulación'}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size:11pt; color:#1e293b; padding:0; }
  .page { max-width:800px; margin:0 auto; padding:24px 32px; }
  h1 { font-size:18pt; color:#0f172a; margin-bottom:4px; }
  h2 { font-size:12pt; color:#0f172a; margin:18px 0 8px; border-bottom:2px solid #e2e8f0; padding-bottom:4px; }
  .header-bar { background:${scoreColor}; color:#fff; border-radius:8px; padding:16px 20px; display:flex; align-items:center; gap:20px; margin-bottom:16px; }
  .score-circle { width:72px; height:72px; border-radius:50%; border:4px solid rgba(255,255,255,.5); background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; flex-direction:column; flex-shrink:0; }
  .score-num { font-size:20pt; font-weight:700; line-height:1; }
  .score-lbl { font-size:7pt; opacity:.8; }
  .meta { font-size:9pt; color:#64748b; margin-bottom:16px; }
  .resumen { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; font-size:10.5pt; line-height:1.7; margin-bottom:4px; }
  table { width:100%; border-collapse:collapse; font-size:9.5pt; }
  th { background:#f1f5f9; text-align:left; padding:5px 8px; font-size:8.5pt; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
  td { padding:5px 8px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
  .section { margin-bottom:14px; }
  ul { padding-left:18px; }
  ul li { line-height:1.8; font-size:10pt; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; }
  .box-title { font-size:8.5pt; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin-bottom:6px; font-family:monospace; }
  .conclusion { background:#faf5ff; border:1px solid #ddd6fe; border-radius:6px; padding:10px 14px; font-size:10.5pt; line-height:1.7; }
  .footer { margin-top:20px; font-size:8pt; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:8px; }
  @media print { body{-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style></head><body><div class="page">
  <div class="header-bar">
    <div class="score-circle"><div class="score-num">${informe.score_global}</div><div class="score-lbl">SCORE</div></div>
    <div>
      <div style="font-size:9pt;opacity:.8;text-transform:uppercase;letter-spacing:.06em">Informe de Simulación Quirúrgica</div>
      <div style="font-size:15pt;font-weight:700;margin:2px 0">${informe.resultado_global} — ${caso?.emergencia || ''}</div>
      <div style="font-size:9.5pt;opacity:.9">Nivel de competencia: <strong>${informe.nivel_competencia}</strong></div>
    </div>
  </div>
  <div class="meta">
    Paciente: <strong>${caso?.paciente?.nombre_ficticio||''}</strong>, ${caso?.paciente?.edad||''} años ·
    Cirugía: <strong>${caso?.tipo_cirugia_requerida||''}</strong> ·
    Fecha: ${fecha}<br>
    Equipo: ${equipoCaso}
  </div>
  <div class="section"><div class="resumen">${informe.resumen_operacion}</div></div>
  <h2>Cronología de la intervención</h2>
  <div class="section"><table><thead><tr><th>Paso</th><th>Evento / Decisión</th><th>Explicación médica</th></tr></thead><tbody>${cronRows}</tbody></table></div>
  <h2>Evaluación del equipo</h2>
  <div class="section"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Desempeño</th><th>Observación</th></tr></thead><tbody>${equipoRows}</tbody></table></div>
  ${decRows ? `<h2>Análisis de decisiones críticas</h2><div class="section"><table><thead><tr><th>Paso</th><th>Decisión</th><th>Resultado</th><th>Alternativa</th><th>Explicación</th></tr></thead><tbody>${decRows}</tbody></table></div>` : ''}
  <div class="grid2">
    <div><div class="box" style="border-color:#bfdbfe;background:#eff6ff"><div class="box-title" style="color:#1d4ed8">Puntos de aprendizaje</div><ul>${aprendizaje}</ul></div></div>
    <div>
      <div class="box" style="border-color:#bbf7d0;background:#f0fdf4;margin-bottom:8px"><div class="box-title" style="color:#16a34a">Recomendaciones</div><ul>${recomendaciones}</ul></div>
      ${errores ? `<div class="box" style="border-color:#fecaca;background:#fff1f2"><div class="box-title" style="color:#dc2626">Errores identificados</div><ul>${errores}</ul></div>` : ''}
      ${complicaciones ? `<div class="box" style="border-color:#fed7aa;background:#fff7ed;margin-top:8px"><div class="box-title" style="color:#c2410c">Complicaciones</div><ul>${complicaciones}</ul></div>` : ''}
    </div>
  </div>
  <h2>Conclusión educativa</h2>
  <div class="section"><div class="conclusion">${informe.conclusion}</div></div>
  <div class="footer">Generado por SEGEDU · Simulador Quirúrgico · ${fecha}</div>
</div><script>window.onload=()=>window.print();</script></body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return !q || u.nombre?.toLowerCase().includes(q) || u.apellido?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const vitalesEnCritico = (v) => v && (v.spo2 < 90 || v.fc > 145 || v.fc < 40 || v.estado === 'PCR' || v.estado === 'Crítico');

  // ────── render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{CSS}</style>

      {/* ═══ FASE: CASO ═══ */}
      {fase === 'caso' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', lineHeight: 1.6, flex: 1, minWidth: 200 }}>
              La IA generará un caso de emergencia médica aleatoria. Conformarás tu equipo quirúrgico y tomarás decisiones en tiempo real para salvar al paciente.
            </p>
            <button
              onClick={generarCaso}
              disabled={loadingCaso}
              style={{ padding: '.75rem 1.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer', flexShrink: 0 }}
            >
              {loadingCaso ? 'Generando caso...' : caso ? '🔄 Nuevo caso' : '🚨 Generar emergencia'}
            </button>
          </div>

          {error && <p style={{ background: '#fee2e2', color: '#dc2626', padding: '.75rem 1rem', borderRadius: 6, fontSize: '.85rem' }}>{error}</p>}

          {loadingCaso && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem', justifyContent: 'center', color: '#94a3b8' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.85rem' }}>Generando emergencia médica...</span>
            </div>
          )}

          {caso && !loadingCaso && (() => {
            const urg = URGENCIA_CFG[caso.urgencia] || URGENCIA_CFG.alta;
            return (
              <div style={{ border: '2px solid #fecaca', borderRadius: 12, overflow: 'hidden', animation: 'fadeIn .4s ease' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <div style={{ color: '#fca5a5', fontFamily: 'var(--mono)', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>🚨 Emergencia Quirúrgica</div>
                    <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginTop: '.2rem' }}>{caso.emergencia}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: urg.bg, color: urg.color, fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700, padding: '.25rem .7rem', borderRadius: 4 }}>URGENCIA {urg.label}</span>
                    <span style={{ background: 'rgba(255,255,255,.15)', color: '#fff', fontFamily: 'var(--mono)', fontSize: '.72rem', padding: '.25rem .7rem', borderRadius: 4 }}>{caso.nivel_dificultad?.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
                  {/* Paciente + vitales */}
                  <div className="qx-grid-caso">
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.85rem' }}>
                      <div style={{ ...monoSt, marginBottom: '.5rem' }}>Paciente</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{caso.paciente.nombre_ficticio}</div>
                      <div style={{ fontSize: '.82rem', color: '#475569', marginTop: '.2rem' }}>
                        {caso.paciente.edad} años · {caso.paciente.sexo} · {caso.paciente.peso_kg} kg · {caso.paciente.grupo_sanguineo}
                      </div>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '.85rem' }}>
                      <div style={{ ...monoSt, color: '#475569', marginBottom: '.5rem' }}>Vitales de ingreso</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                        {[
                          { l: 'PA',   v: caso.signos_vitales_ingreso?.pa },
                          { l: 'FC',   v: caso.signos_vitales_ingreso?.fc },
                          { l: 'SpO2', v: `${caso.signos_vitales_ingreso?.spo2}%` },
                          { l: 'Temp', v: `${caso.signos_vitales_ingreso?.temp}°` },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: '#475569' }}>{l}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '.85rem', fontWeight: 700, color: '#7ee787' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico + cirugía */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '.85rem' }}>
                    <div style={{ ...monoSt, color: '#1d4ed8', marginBottom: '.35rem' }}>Diagnóstico presuntivo</div>
                    <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#1e293b' }}>{caso.diagnostico_presuntivo}</p>
                    <p style={{ fontSize: '.82rem', color: '#475569', marginTop: '.3rem' }}><strong>Cirugía requerida:</strong> {caso.tipo_cirugia_requerida}</p>
                  </div>

                  {/* Contexto clínico */}
                  <div>
                    <div style={{ ...monoSt, marginBottom: '.35rem' }}>Contexto clínico</div>
                    <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.7 }}>{caso.contexto_clinico}</p>
                  </div>

                  {/* Hallazgos + imagen */}
                  <div className="qx-grid-caso">
                    <div>
                      <div style={{ ...monoSt, marginBottom: '.4rem' }}>Hallazgos relevantes</div>
                      {(caso.hallazgos_relevantes || []).map((h, i) => (
                        <div key={i} style={{ fontSize: '.82rem', color: '#334155', display: 'flex', gap: '.4rem', marginBottom: '.2rem' }}>
                          <span style={{ color: '#dc2626', flexShrink: 0 }}>•</span>{h}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ ...monoSt, marginBottom: '.4rem' }}>Imagen diagnóstica</div>
                      <p style={{ fontSize: '.82rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>{caso.descripcion_imagen}</p>
                      {caso.antecedentes_patologicos?.length > 0 && (
                        <>
                          <div style={{ ...monoSt, marginTop: '.65rem', marginBottom: '.3rem' }}>Antecedentes</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                            {caso.antecedentes_patologicos.map((a, i) => (
                              <span key={i} style={{ background: '#fef3c7', color: '#92400e', fontSize: '.75rem', padding: '.15rem .5rem', borderRadius: 3 }}>{a}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setFase('equipo')}
                      style={{ padding: '.75rem 1.75rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer' }}
                    >
                      Conformar equipo quirúrgico →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ FASE: EQUIPO ═══ */}
      {fase === 'equipo' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '.2rem' }}>Equipo quirúrgico</h2>
              <p style={{ fontSize: '.82rem', color: 'var(--ink-light)' }}>Selecciona entre 3 y 8 personas y asigna su rol en el quirófano.</p>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <span style={{ background: equipo.length >= 3 ? '#dcfce7' : '#fee2e2', color: equipo.length >= 3 ? '#16a34a' : '#dc2626', fontFamily: 'var(--mono)', fontSize: '.78rem', padding: '.3rem .7rem', borderRadius: 4 }}>
                {equipo.length}/8 seleccionados
              </span>
            </div>
          </div>

          <div className="qx-grid-equipo">
            {/* Lista de usuarios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ ...monoSt, marginBottom: '.1rem' }}>Personal disponible</div>
              <input
                type="text" placeholder="Buscar por nombre o email..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                style={{ padding: '.6rem .85rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {usuariosFiltrados.map(u => {
                  const yaEsta = equipo.find(m => m.id === u.id);
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .85rem', background: yaEsta ? '#f0fdf4' : '#f8fafc', border: `1px solid ${yaEsta ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 6, gap: '.5rem' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre} {u.apellido}</div>
                        <div style={{ fontSize: '.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} · {u.rol}</div>
                      </div>
                      <button
                        onClick={() => yaEsta ? quitarDelEquipo(u.id) : agregarAlEquipo(u)}
                        disabled={!yaEsta && equipo.length >= 8}
                        style={{ padding: '.35rem .75rem', background: yaEsta ? '#fee2e2' : '#1d4ed8', color: yaEsta ? '#dc2626' : '#fff', border: 'none', borderRadius: 5, fontSize: '.75rem', cursor: 'pointer', fontFamily: 'var(--mono)', flexShrink: 0 }}
                      >
                        {yaEsta ? '− Quitar' : '+ Añadir'}
                      </button>
                    </div>
                  );
                })}
                {usuariosFiltrados.length === 0 && <p style={{ fontSize: '.82rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No se encontraron usuarios</p>}
              </div>
            </div>

            {/* Equipo seleccionado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ ...monoSt, marginBottom: '.1rem' }}>Equipo seleccionado</div>
              {equipo.length === 0 ? (
                <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem' }}>
                  Añade al menos 3 personas
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 400, overflowY: 'auto' }}>
                  {equipo.map((m, idx) => (
                    <div key={m.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.65rem .85rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#1d4ed8', marginRight: '.5rem' }}>#{idx+1}</span>
                          <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 'calc(100% - 2rem)', verticalAlign: 'middle' }}>{m.nombre} {m.apellido}</span>
                        </div>
                        <button onClick={() => quitarDelEquipo(m.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '.8rem', padding: '.2rem', flexShrink: 0 }}>✕</button>
                      </div>
                      <select
                        value={m.rol_quirurgico}
                        onChange={e => cambiarRol(m.id, e.target.value)}
                        style={{ padding: '.35rem .6rem', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: '.8rem', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}
                      >
                        {ROLES_QUIRURGICOS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {error && <p style={{ background: '#fee2e2', color: '#dc2626', padding: '.75rem 1rem', borderRadius: 6, fontSize: '.85rem' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button onClick={() => setFase('caso')} style={{ padding: '.65rem 1.1rem', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '.82rem', cursor: 'pointer' }}>← Volver</button>
                <button
                  onClick={iniciarSimulacion}
                  disabled={equipo.length < 3}
                  style={{ padding: '.75rem 1.5rem', background: equipo.length >= 3 ? '#16a34a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: equipo.length >= 3 ? 'pointer' : 'not-allowed' }}
                >
                  🏥 Iniciar simulación →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FASE: SIMULACION ═══ */}
      {fase === 'simulacion' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Barra de progreso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            {[1,2,3,4,5].map(n => {
              const done = pasoActual ? n < pasoActual.paso : false;
              const curr = pasoActual?.paso === n;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 5 ? 1 : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#16a34a' : curr ? '#dc2626' : '#f1f5f9', border: `2px solid ${done ? '#16a34a' : curr ? '#dc2626' : '#e2e8f0'}`, display: 'grid', placeItems: 'center', fontSize: '.75rem', fontWeight: 700, color: done || curr ? '#fff' : '#94a3b8', flexShrink: 0 }}>
                    {done ? '✓' : n}
                  </div>
                  {n < 5 && <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : '#e2e8f0', margin: '0 .35rem' }} />}
                </div>
              );
            })}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>Paso {pasoActual?.paso || '…'}/5</span>
          </div>

          {/* Vitales */}
          {pasoActual && (
            <div className="qx-vitals">
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#475569', textTransform: 'uppercase' }}>Monitor</span>
              <VitalItem label="PA"   value={pasoActual.vitales.pa}             warn={false} critical={false} />
              <VitalItem label="FC"   value={pasoActual.vitales.fc}             warn={pasoActual.vitales.fc > 110 || pasoActual.vitales.fc < 55} critical={pasoActual.vitales.fc > 145 || pasoActual.vitales.fc < 40} />
              <VitalItem label="SpO2" value={`${pasoActual.vitales.spo2}%`}     warn={pasoActual.vitales.spo2 < 95} critical={pasoActual.vitales.spo2 < 90} />
              <VitalItem label="Temp" value={`${pasoActual.vitales.temp}°C`}    warn={pasoActual.vitales.temp > 38 || pasoActual.vitales.temp < 36} critical={pasoActual.vitales.temp > 40} />
              <VitalItem label="FR"   value={pasoActual.vitales.fr}             warn={pasoActual.vitales.fr > 24} critical={false} />
              <div style={{ marginLeft: 'auto' }}>
                {(() => {
                  const cfg = ESTADO_CFG[pasoActual.vitales.estado] || ESTADO_CFG.Estable;
                  return <span style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700, padding: '.3rem .75rem', borderRadius: 5 }}>{pasoActual.vitales.estado}</span>;
                })()}
              </div>
            </div>
          )}

          {/* Alerta crítica */}
          {pasoActual?.alerta_critica && (
            <div className="qx-alerta">
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '.06em' }}>ALERTA CRÍTICA</div>
                <div style={{ color: '#fff', fontSize: '.92rem', fontWeight: 600, marginTop: '.15rem' }}>{pasoActual.mensaje_alerta || '¡El paciente está en riesgo inminente de muerte!'}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loadingPaso && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2.5rem', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.85rem' }}>Simulando situación quirúrgica...</span>
            </div>
          )}

          {/* Situación */}
          {pasoActual && !loadingPaso && (
            <div style={{ animation: 'fadeIn .35s ease' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.5rem' }}>
                  <span style={{ background: '#dc2626', color: '#fff', fontFamily: 'var(--mono)', fontSize: '.65rem', padding: '.2rem .5rem', borderRadius: 3 }}>PASO {pasoActual.paso}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#64748b' }}>{pasoActual.fase_cirugia}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: '#1e293b', marginBottom: '.5rem' }}>{pasoActual.situacion_titulo}</h3>
                <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.75 }}>{pasoActual.descripcion}</p>
              </div>

              {/* Opciones de decisión */}
              {!pasoActual.fin_operacion && pasoActual.opciones?.length > 0 && (
                <>
                  <div style={{ ...monoSt, marginBottom: '.65rem' }}>¿Qué decisión tomas?</div>
                  <div className="qx-grid-ops">
                    {pasoActual.opciones.map(op => {
                      const rCfg = RIESGO_CFG[op.riesgo] || RIESGO_CFG.medio;
                      const isSelected = decSelec === op.id;
                      return (
                        <div
                          key={op.id}
                          className={`qx-card-op${isSelected ? ' selected' : ''}${decSelec && !isSelected ? ' disabled' : ''}`}
                          style={{ background: rCfg.bg, borderColor: isSelected ? '#1d4ed8' : rCfg.border }}
                          onClick={() => tomarDecision(op)}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem' }}>
                            <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{op.icono || '🩺'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#1e293b', lineHeight: 1.35, marginBottom: '.3rem' }}>
                                <span style={{ fontFamily: 'var(--mono)', color: '#94a3b8', fontSize: '.72rem', marginRight: '.35rem' }}>{op.id}</span>
                                {op.titulo}
                              </div>
                              <p style={{ fontSize: '.8rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>{op.descripcion}</p>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.6rem', flexWrap: 'wrap', gap: '.3rem' }}>
                                <span style={{ background: rCfg.badge, color: rCfg.text, fontFamily: 'var(--mono)', fontSize: '.65rem', padding: '.15rem .45rem', borderRadius: 3 }}>{rCfg.label}</span>
                                {op.requiere_rol && <span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#64748b' }}>Req: {op.requiere_rol}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Resultado final */}
              {pasoActual.fin_operacion && pasoActual.resultado_final && (
                <div style={{ background: pasoActual.resultado_final.exitoso ? '#f0fdf4' : '#fff1f2', border: `2px solid ${pasoActual.resultado_final.exitoso ? '#16a34a' : '#dc2626'}`, borderRadius: 12, padding: '1.25rem', animation: 'fadeIn .5s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.75rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{pasoActual.resultado_final.exitoso ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: pasoActual.resultado_final.exitoso ? '#16a34a' : '#dc2626', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {pasoActual.resultado_final.exitoso ? 'Operación exitosa' : 'Operación con complicaciones'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginTop: '.15rem' }}>
                        {pasoActual.resultado_final.estado_paciente_final}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.7 }}>{pasoActual.resultado_final.descripcion}</p>
                  {pasoActual.resultado_final.complicaciones?.length > 0 && (
                    <div style={{ marginTop: '.75rem' }}>
                      <div style={{ ...monoSt, marginBottom: '.3rem' }}>Complicaciones</div>
                      {pasoActual.resultado_final.complicaciones.map((c, i) => (
                        <div key={i} style={{ fontSize: '.82rem', color: '#dc2626' }}>• {c}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      onClick={generarInforme}
                      disabled={loadingInforme}
                      style={{ padding: '.75rem 1.75rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer' }}
                    >
                      {loadingInforme ? 'Generando informe...' : 'Ver informe completo →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team strip */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '.75rem' }}>
            <div style={{ ...monoSt, marginBottom: '.4rem' }}>Equipo en quirófano</div>
            <div className="qx-team-strip">
              {equipo.map((m, i) => (
                <div key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, padding: '.3rem .65rem', fontSize: '.75rem', color: '#334155' }}>
                  <span style={{ fontWeight: 600 }}>{m.nombre}</span>
                  <span style={{ color: '#64748b' }}> · {m.rol_quirurgico}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ background: '#fee2e2', color: '#dc2626', padding: '.75rem 1rem', borderRadius: 6, fontSize: '.85rem' }}>{error}</p>}
        </div>
      )}

      {/* ═══ FASE: INFORME ═══ */}
      {fase === 'informe' && informe && (
        <div style={{ display: 'grid', gap: '1.25rem', animation: 'fadeIn .4s ease' }}>
          {/* Header resultado */}
          <div style={{ background: informe.resultado_global === 'Exitoso' ? 'linear-gradient(135deg,#14532d,#16a34a)' : informe.resultado_global === 'Parcial' ? 'linear-gradient(135deg,#78350f,#d97706)' : 'linear-gradient(135deg,#7f1d1d,#dc2626)', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div className="qx-report-score" style={{ border: '4px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.15)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{informe.score_global}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: 'rgba(255,255,255,.7)', marginTop: '.1rem' }}>SCORE</div>
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontFamily: 'var(--mono)', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Resultado de la intervención</div>
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginTop: '.2rem' }}>{informe.resultado_global}</div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '.82rem', marginTop: '.2rem' }}>Nivel de competencia: <strong>{informe.nivel_competencia}</strong></div>
            </div>
          </div>

          <p style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.75, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.9rem 1rem' }}>{informe.resumen_operacion}</p>

          {/* Cronología */}
          <div>
            <div style={{ ...monoSt, marginBottom: '.75rem' }}>Cronología de la intervención</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {(informe.cronologia || []).map((ev, i) => {
                const imp = IMPACTO_CFG[ev.impacto] || IMPACTO_CFG.neutral;
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem', display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: imp.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '.82rem', flexShrink: 0, marginTop: '.05rem' }}>{imp.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.2rem' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', background: '#f1f5f9', color: '#475569', padding: '.1rem .4rem', borderRadius: 3 }}>PASO {ev.paso}</span>
                        <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#1e293b' }}>{ev.evento}</span>
                      </div>
                      <div style={{ fontSize: '.8rem', color: '#475569', marginBottom: '.25rem' }}>Decisión: <em>{ev.decision}</em></div>
                      <div style={{ fontSize: '.8rem', color: '#334155', lineHeight: 1.55 }}>{ev.explicacion_medica}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluación del equipo */}
          <div>
            <div style={{ ...monoSt, marginBottom: '.65rem' }}>Evaluación del equipo</div>
            <div className="qx-grid-eval">
              {(informe.evaluacion_equipo || []).map((m, i) => {
                const d = DESEMPENO_CFG[m.desempeno] || DESEMPENO_CFG.Regular;
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem .9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.3rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#1e293b' }}>{m.nombre}</div>
                        <div style={{ fontSize: '.72rem', color: '#64748b' }}>{m.rol}</div>
                      </div>
                      <span style={{ background: d.bg, color: d.color, fontFamily: 'var(--mono)', fontSize: '.65rem', padding: '.15rem .45rem', borderRadius: 3, flexShrink: 0 }}>{m.desempeno}</span>
                    </div>
                    <p style={{ fontSize: '.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>{m.observacion}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decisiones críticas */}
          {informe.decisiones_criticas?.length > 0 && (
            <div>
              <div style={{ ...monoSt, marginBottom: '.65rem' }}>Análisis de decisiones críticas</div>
              <div style={{ display: 'grid', gap: '.5rem' }}>
                {informe.decisiones_criticas.map((d, i) => (
                  <div key={i} style={{ background: d.fue_correcta ? '#f0fdf4' : '#fff1f2', border: `1px solid ${d.fue_correcta ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.3rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#64748b' }}>PASO {d.paso}</span>
                      <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#1e293b' }}>{d.decision}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '.65rem', color: d.fue_correcta ? '#16a34a' : '#dc2626' }}>{d.fue_correcta ? '✓ CORRECTA' : '✗ INCORRECTA'}</span>
                    </div>
                    {!d.fue_correcta && d.alternativa_correcta && (
                      <div style={{ fontSize: '.8rem', color: '#16a34a', marginBottom: '.25rem' }}>✓ Alternativa: {d.alternativa_correcta}</div>
                    )}
                    <p style={{ fontSize: '.8rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>{d.explicacion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Puntos de aprendizaje */}
          <div className="qx-grid-caso">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '.9rem' }}>
              <div style={{ ...monoSt, color: '#1d4ed8', marginBottom: '.5rem' }}>Puntos de aprendizaje</div>
              {(informe.puntos_de_aprendizaje || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '.4rem', fontSize: '.82rem', color: '#1e40af', marginBottom: '.3rem', lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, color: '#1d4ed8' }}>{i+1}.</span>{p}
                </div>
              ))}
            </div>
            <div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '.9rem', marginBottom: '.5rem' }}>
                <div style={{ ...monoSt, color: '#16a34a', marginBottom: '.5rem' }}>Recomendaciones</div>
                {(informe.recomendaciones || []).map((r, i) => (
                  <div key={i} style={{ fontSize: '.82rem', color: '#166534', marginBottom: '.3rem', lineHeight: 1.5 }}>→ {r}</div>
                ))}
              </div>
              {informe.errores_identificados?.length > 0 && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8, padding: '.9rem' }}>
                  <div style={{ ...monoSt, color: '#dc2626', marginBottom: '.5rem' }}>Errores identificados</div>
                  {informe.errores_identificados.map((e, i) => (
                    <div key={i} style={{ fontSize: '.82rem', color: '#dc2626', marginBottom: '.3rem' }}>✗ {e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conclusión */}
          <div style={{ background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '.9rem 1rem' }}>
            <div style={{ ...monoSt, color: '#7c3aed', marginBottom: '.35rem' }}>Conclusión educativa</div>
            <p style={{ fontSize: '.88rem', color: '#4c1d95', lineHeight: 1.7 }}>{informe.conclusion}</p>
          </div>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', paddingTop: '.5rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <button onClick={downloadPDF} style={{ padding: '.65rem 1.25rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              ⬇ Descargar PDF
            </button>
            <button onClick={reset} style={{ padding: '.65rem 1.5rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer' }}>
              Nueva simulación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
