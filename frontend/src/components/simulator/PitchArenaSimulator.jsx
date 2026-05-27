import { useState } from 'react';
import api from '../../services/api';

const QUESTIONS = [
  { id: 1, label: 'La idea',      text: '¿Cuál es tu idea de negocio? Descríbela en una sola oración clara y directa.' },
  { id: 2, label: 'El problema',  text: '¿Qué problema urgente y real resuelves? ¿Para quién específicamente?' },
  { id: 3, label: 'El modelo',    text: '¿Cómo genera dinero tu negocio? Describe tu modelo de ingresos.' },
  { id: 4, label: 'La ventaja',   text: '¿Qué te diferencia de las alternativas que existen hoy en el mercado?' },
  { id: 5, label: 'La tracción',  text: '¿En qué etapa está tu proyecto y qué validación tienes hasta ahora?' },
  { id: 6, label: 'La inversión', text: '¿Cuánto capital necesitas para el siguiente paso y en qué lo invertirías?' },
];

const VEREDICTO = {
  inversion_aprobada:   { label: 'Inversión aprobada',   color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
  interes_condicionado: { label: 'Interés condicionado', color: '#d97706', bg: '#fef3c7', border: '#d97706' },
  rechazado:            { label: 'Pitch rechazado',      color: '#dc2626', bg: '#fee2e2', border: '#dc2626' },
};

const DIMENSION_LABELS = {
  claridad_problema:   'Claridad del problema',
  propuesta_valor:     'Propuesta de valor',
  modelo_negocio:      'Modelo de negocio',
  equipo_credibilidad: 'Equipo y credibilidad',
  traccion_validacion: 'Tracción y validación',
};

const DIFICULTAD_COLOR = d => d >= 8 ? '#dc2626' : d >= 6 ? '#d97706' : '#16a34a';

const LOADING_MESSAGES = [
  { icon: '🎭', title: 'Analizando tu idea...', sub: 'La IA está construyendo un escenario único y desafiante para tu propuesta.' },
  { icon: '✍️', title: 'Construyendo tu pitch...', sub: 'La IA redacta el pitch ideal adaptado a tu escenario y evaluador.' },
];

export default function PitchArenaSimulator() {
  const [phase,       setPhase]       = useState('questions'); // questions | loading | results
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentQ,    setCurrentQ]    = useState(0);
  const [answers,     setAnswers]     = useState(Array(QUESTIONS.length).fill(''));
  const [scenario,    setScenario]    = useState(null);
  const [evaluation,  setEvaluation]  = useState(null);
  const [error,       setError]       = useState(null);

  const currentAnswer = answers[currentQ] || '';
  const canNext = currentAnswer.trim().length >= 10;

  const handleAnswer = val => {
    const updated = [...answers];
    updated[currentQ] = val;
    setAnswers(updated);
  };

  const nextQuestion = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      generate();
    }
  };

  const generate = async () => {
    setPhase('loading');
    setLoadingStep(0);
    setError(null);
    try {
      const respuestas = QUESTIONS.map((q, i) => ({ pregunta: q.text, respuesta: answers[i] }));
      const { data: scenarioData } = await api.post('/auth/generar-escenario-pitch', { respuestas });
      setLoadingStep(1);
      const { data: pitchData } = await api.post('/auth/construir-pitch', { escenario: scenarioData, respuestas });
      setScenario(scenarioData);
      setEvaluation(pitchData);
      setPhase('results');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar el pitch. Intenta de nuevo.');
      setPhase('questions');
    }
  };

  const reset = () => {
    setPhase('questions'); setCurrentQ(0); setAnswers(Array(QUESTIONS.length).fill(''));
    setScenario(null); setEvaluation(null); setError(null); setLoadingStep(0);
  };

  const downloadPDF = () => {
    if (!evaluation || !scenario) return;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const vd = VEREDICTO[evaluation.veredicto] || VEREDICTO.rechazado;
    const score = evaluation.puntuacion_total;

    const dimsHTML = Object.entries(evaluation.dimensiones || {}).map(([key, d]) => {
      const pct = Math.round((d.puntos / d.max) * 100);
      const col = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
      return `<div class="dim-row">
        <div class="dim-head"><span>${DIMENSION_LABELS[key] || key}</span><span style="color:${col};font-weight:bold">${d.puntos}/${d.max}</span></div>
        <div class="dim-bar-wrap"><div class="dim-bar" style="width:${pct}%;background:${col}"></div></div>
        <div class="dim-comment">${d.comentario}</div>
      </div>`;
    }).join('');

    const exitoHTML  = (evaluation.lineamientos_exito   || []).map(l => `<li class="exito-item">✓ ${l}</li>`).join('');
    const fracasoHTML = (evaluation.lineamientos_fracaso || []).map(l => `<li class="fracaso-item">✗ ${l}</li>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Pitch Arena — Reporte</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}@page{margin:1.5cm}
body{font-family:'Georgia',serif;color:#1e3a5f;font-size:10pt;padding:.5cm}
.header{border-bottom:3px solid #1d4ed8;padding-bottom:.8rem;margin-bottom:1rem}
.title{font-size:18pt;font-weight:bold;color:#1d4ed8}.sub{font-size:9.5pt;color:#64748b;margin-top:.2rem}
.meta{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:.6rem;font-size:9pt;color:#475569}
.meta strong{color:#1e3a5f}
.scenario-box{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:.9rem;margin:.8rem 0}
.scenario-title{font-size:9pt;font-weight:bold;font-family:monospace;color:#1d4ed8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem}
.scenario-grid{display:grid;grid-template-columns:1fr 1fr;gap:.4rem}
.scenario-item{font-size:9pt;color:#334155;line-height:1.5}
.scenario-item strong{color:#1e3a5f}
.condicion{background:#fef3c7;border:1px solid #fcd34d;border-radius:4px;padding:.4rem .7rem;font-size:9pt;color:#92400e;margin-top:.5rem;grid-column:1/-1}
.decision-box{border:3px solid ${vd.border};background:${vd.bg};border-radius:10px;padding:1rem 1.5rem;margin:1rem 0;display:flex;align-items:center;gap:1.5rem}
.score-circle{width:70px;height:70px;border-radius:50%;border:3px solid ${vd.border};background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
.score-num{font-size:18pt;font-weight:bold;color:${vd.color};line-height:1;font-family:monospace}
.score-unit{font-size:8pt;color:${vd.color};font-family:monospace}
.verd-label{font-size:13pt;font-weight:bold;color:${vd.color};margin-bottom:.3rem}
.verd-razon{font-size:9.5pt;color:#475569;line-height:1.6}
.section{margin:.9rem 0}.section-title{font-size:11pt;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #e2e8f0;padding-bottom:.3rem;margin-bottom:.6rem}
.dim-row{margin-bottom:.6rem;break-inside:avoid}
.dim-head{display:flex;justify-content:space-between;font-size:9.5pt;margin-bottom:.2rem}
.dim-bar-wrap{height:7px;background:#e2e8f0;border-radius:99px;margin-bottom:.2rem}
.dim-bar{height:100%;border-radius:99px}
.dim-comment{font-size:8.5pt;color:#64748b;line-height:1.4;font-style:italic}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.exito-list,.fracaso-list{list-style:none;display:flex;flex-direction:column;gap:.35rem}
.exito-item{font-size:9.5pt;color:#166534;line-height:1.5}
.fracaso-item{font-size:9.5pt;color:#991b1b;line-height:1.5}
.pitch-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;font-size:10pt;line-height:1.8;color:#334155;white-space:pre-wrap}
.pregunta-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.9rem;font-size:10pt;line-height:1.65;color:#1e40af}
.pregunta-label{font-size:9pt;font-weight:bold;font-family:monospace;color:#1d4ed8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.4rem}
.footer{margin-top:1.5rem;padding-top:.7rem;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  <div class="title">Pitch Arena — Reporte</div>
  <div class="sub">Pitch construido y evaluado por IA · Simulador de presentación emprendedora</div>
  <div class="meta"><span>📅 ${fecha}</span><span>🎯 Dificultad del escenario: ${scenario.dificultad}/10</span></div>
</div>
<div class="scenario-box">
  <div class="scenario-title">🎭 Escenario asignado</div>
  <div class="scenario-grid">
    <div class="scenario-item"><strong>Audiencia:</strong> ${scenario.audiencia}</div>
    <div class="scenario-item"><strong>Formato:</strong> ${scenario.formato}</div>
    <div class="scenario-item"><strong>Contexto:</strong> ${scenario.contexto}</div>
    <div class="scenario-item"><strong>Evaluador:</strong> ${scenario.perfil_evaluador}</div>
    <div class="condicion">⚡ <strong>Condición especial:</strong> ${scenario.condicion_especial}</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Pitch generado por IA</div>
  <div class="pitch-box">${evaluation.pitch_generado}</div>
</div>
<div class="decision-box">
  <div class="score-circle"><span class="score-num">${score}</span><span class="score-unit">/100</span></div>
  <div>
    <div class="verd-label">${vd.label}</div>
    <div class="verd-razon">${evaluation.razon_veredicto}</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Evaluación por dimensiones</div>${dimsHTML}
</div>
<div class="section">
  <div class="section-title">Lineamientos de éxito y fracaso en este escenario</div>
  <div class="two-col">
    <div><div style="font-size:10pt;font-weight:bold;color:#16a34a;margin-bottom:.4rem">✅ Para ganar este pitch</div><ul class="exito-list">${exitoHTML}</ul></div>
    <div><div style="font-size:10pt;font-weight:bold;color:#dc2626;margin-bottom:.4rem">⚠ Lo que lo hundiría</div><ul class="fracaso-list">${fracasoHTML}</ul></div>
  </div>
</div>
<div class="section">
  <div class="pregunta-label">💬 Pregunta crítica y cómo responderla</div>
  <div style="font-style:italic;color:#475569;font-size:9.5pt;margin-bottom:.5rem">"${scenario.pregunta_critica}"</div>
  <div class="pregunta-box">${evaluation.respuesta_pregunta_critica}</div>
</div>
<div class="footer">Generado con IA — Pitch Arena · SEGEDU · ${fecha}<br>
Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
    const win = window.open('', '_blank', 'width=950,height=750');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const vd = VEREDICTO[evaluation?.veredicto] || VEREDICTO.rechazado;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── PHASE: QUESTIONS ── */}
      {phase === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: '#64748b' }}>
                Pregunta {currentQ + 1} de {QUESTIONS.length} —{' '}
                <strong style={{ color: '#1d4ed8' }}>{QUESTIONS[currentQ].label}</strong>
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#94a3b8' }}>
                {Math.round((currentQ / QUESTIONS.length) * 100)}% completado
              </span>
            </div>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#1d4ed8', borderRadius: '99px',
                width: `${(currentQ / QUESTIONS.length) * 100}%`, transition: 'width .4s' }} />
            </div>
          </div>

          {/* Question card */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1d4ed8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>
                {currentQ + 1}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', color: '#1e3a5f',
                lineHeight: 1.55, paddingTop: '.35rem' }}>
                {QUESTIONS[currentQ].text}
              </div>
            </div>
            <textarea
              value={currentAnswer}
              onChange={e => handleAnswer(e.target.value)}
              rows={4}
              placeholder="Escribe tu respuesta aquí..."
              autoFocus
              style={{ width: '100%', padding: '.75rem', borderRadius: '8px',
                border: '1.5px solid #cbd5e1', fontSize: '.9rem', resize: 'vertical',
                boxSizing: 'border-box', lineHeight: 1.6, background: '#fff',
                fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#1d4ed8'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && canNext) nextQuestion(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem' }}>
              <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>
                {currentAnswer.length < 10 ? `Mínimo ${10 - currentAnswer.length} caracteres más` : '✓ Listo'}
              </div>
              <div style={{ display: 'flex', gap: '.6rem' }}>
                {currentQ > 0 && (
                  <button onClick={() => setCurrentQ(q => q - 1)}
                    style={{ padding: '.45rem .9rem', borderRadius: '6px', cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: '.75rem', border: '1.5px solid #cbd5e1',
                      background: '#fff', color: '#64748b' }}>
                    ← Anterior
                  </button>
                )}
                <button onClick={nextQuestion} disabled={!canNext}
                  style={{ padding: '.45rem 1.2rem', borderRadius: '6px',
                    cursor: canNext ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--mono)', fontSize: '.78rem', fontWeight: 700, border: 'none',
                    background: canNext ? '#1d4ed8' : '#e2e8f0',
                    color: canNext ? '#fff' : '#94a3b8' }}>
                  {currentQ < QUESTIONS.length - 1 ? 'Siguiente →' : '🎭 Generar mi pitch'}
                </button>
              </div>
            </div>
          </div>

          {/* Respuestas anteriores */}
          {currentQ > 0 && (
            <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fafafa' }}>
              <div style={{ padding: '.5rem .9rem', background: '#f1f5f9',
                fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Respuestas anteriores
              </div>
              {answers.slice(0, currentQ).map((ans, i) => (
                <div key={i} style={{ padding: '.55rem .9rem', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#1d4ed8', marginBottom: '.15rem' }}>
                    {QUESTIONS[i].label}
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#334155', lineHeight: 1.5 }}>{ans}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PHASE: LOADING ── */}
      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc',
          borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem',
            animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>
            {LOADING_MESSAGES[loadingStep]?.icon}
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700,
            color: '#1e3a5f', marginBottom: '.5rem' }}>
            {LOADING_MESSAGES[loadingStep]?.title}
          </div>
          <div style={{ fontSize: '.83rem', color: '#64748b', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            {LOADING_MESSAGES[loadingStep]?.sub}
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1.5rem' }}>
            {LOADING_MESSAGES.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%',
                  background: i <= loadingStep ? '#1d4ed8' : '#e2e8f0',
                  transition: 'background .3s' }} />
                <span style={{ fontSize: '.67rem', color: i <= loadingStep ? '#1d4ed8' : '#94a3b8',
                  fontFamily: 'var(--mono)' }}>{m.title.replace('...', '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE: RESULTS ── */}
      {phase === 'results' && evaluation && scenario && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
            <button onClick={reset}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b' }}>
              ↺ Nueva sesión
            </button>
            <button onClick={downloadPDF}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #16a34a', background: '#16a34a', color: '#fff' }}>
              ⬇ Descargar reporte PDF
            </button>
          </div>

          {/* Escenario (compacto) */}
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.1rem 1.25rem',
            border: '1px solid #1e293b', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: '.9rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '.2rem' }}>
                  🎭 Escenario asignado
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0' }}>
                  {scenario.audiencia}
                </div>
              </div>
              <div style={{ background: DIFICULTAD_COLOR(scenario.dificultad) + '22',
                border: `1.5px solid ${DIFICULTAD_COLOR(scenario.dificultad)}`,
                borderRadius: '8px', padding: '.35rem .7rem', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem',
                  color: DIFICULTAD_COLOR(scenario.dificultad), textTransform: 'uppercase' }}>Dificultad</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 900,
                  color: DIFICULTAD_COLOR(scenario.dificultad), lineHeight: 1 }}>{scenario.dificultad}/10</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.5rem' }}>
              {[
                { label: 'Formato', val: scenario.formato },
                { label: 'Contexto', val: scenario.contexto },
                { label: 'Evaluador', val: scenario.perfil_evaluador },
              ].map(item => (
                <div key={item.label} style={{ background: '#1e293b', borderRadius: '7px', padding: '.5rem .7rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: '#64748b',
                    textTransform: 'uppercase', marginBottom: '.15rem' }}>{item.label}</div>
                  <div style={{ fontSize: '.8rem', color: '#e2e8f0', lineHeight: 1.45 }}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#451a03', border: '1px solid #92400e', borderRadius: '7px',
              padding: '.55rem .8rem', marginTop: '.5rem' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: '#fcd34d',
                textTransform: 'uppercase', marginBottom: '.15rem' }}>⚡ Condición especial</div>
              <div style={{ fontSize: '.82rem', color: '#fef3c7', lineHeight: 1.45 }}>{scenario.condicion_especial}</div>
            </div>
          </div>

          {/* Pitch generado */}
          <div style={{ borderRadius: '10px', border: '2px solid #1d4ed8', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#1d4ed8',
              fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              ✍️ Pitch construido por IA para este escenario
            </div>
            <div style={{ padding: '1.1rem 1.2rem', fontSize: '.9rem', lineHeight: 1.85,
              color: '#1e3a5f', whiteSpace: 'pre-wrap', background: '#f8faff' }}>
              {evaluation.pitch_generado}
            </div>
          </div>

          {/* Veredicto */}
          <div style={{ borderRadius: '12px', border: `3px solid ${vd.border}`, background: vd.bg,
            padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%',
              border: `4px solid ${vd.border}`, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', flexShrink: 0 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: vd.color,
                fontFamily: 'var(--mono)', lineHeight: 1 }}>{evaluation.puntuacion_total}</span>
              <span style={{ fontSize: '.6rem', color: vd.color, fontFamily: 'var(--mono)' }}>/100</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700,
                color: vd.color, marginBottom: '.3rem' }}>{vd.label}</div>
              <div style={{ fontSize: '.86rem', color: '#475569', lineHeight: 1.6 }}>
                {evaluation.razon_veredicto}
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.6rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700,
              color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Evaluación por dimensiones
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              {Object.entries(evaluation.dimensiones || {}).map(([key, d]) => {
                const pct = Math.round((d.puntos / d.max) * 100);
                const col = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '.3rem' }}>
                      <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#1e3a5f' }}>
                        {DIMENSION_LABELS[key] || key}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem',
                        fontWeight: 700, color: col }}>{d.puntos}/{d.max}</span>
                    </div>
                    <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '99px',
                      overflow: 'hidden', marginBottom: '.3rem' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col,
                        borderRadius: '99px', transition: 'width .6s' }} />
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#64748b', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {d.comentario}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lineamientos éxito / fracaso */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { title: '✅ Para ganar este pitch', items: evaluation.lineamientos_exito,  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#166534' },
              { title: '⚠ Lo que lo hundiría',    items: evaluation.lineamientos_fracaso, color: '#dc2626', bg: '#fff7f7', border: '#fecaca', textColor: '#991b1b' },
            ].map(col => (
              <div key={col.title} style={{ borderRadius: '10px', border: `1px solid ${col.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '.6rem 1rem', background: col.bg, borderBottom: `1px solid ${col.border}`,
                  fontFamily: 'var(--mono)', fontSize: '.68rem', fontWeight: 700,
                  color: col.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {col.title}
                </div>
                <div style={{ padding: '.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                  {(col.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.45rem', fontSize: '.83rem',
                      color: col.textColor, lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>•</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pregunta crítica */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
            padding: '1rem 1.25rem' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', fontWeight: 700,
              color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>
              💬 Cómo responder la pregunta crítica
            </div>
            <div style={{ fontSize: '.83rem', color: '#1e40af', fontStyle: 'italic', marginBottom: '.5rem' }}>
              "{scenario.pregunta_critica}"
            </div>
            <div style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.7 }}>
              {evaluation.respuesta_pregunta_critica}
            </div>
          </div>

          <p style={{ fontSize: '.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            ⚠ Este pitch es generado por IA con prompts específicos para la asignatura y tiene carácter orientativo.
            Complementa con práctica real. Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', gap: '.75rem' }}>
          <span>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '.2rem' }}>Error</div>
            <div style={{ fontSize: '.85rem', color: '#7f1d1d' }}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
