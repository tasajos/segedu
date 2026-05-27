import { useState } from 'react';
import api from '../../services/api';

const STEPS = [
  { id: 1, label: 'Hipótesis',   icon: '💡' },
  { id: 2, label: 'Experimento', icon: '🧪' },
  { id: 3, label: 'Criterios',   icon: '📏' },
  { id: 4, label: 'Resultados',  icon: '📊' },
];

const EXPERIMENT_TYPES = [
  { id: 'smoke_test',   icon: '🌫️', label: 'Smoke Test',              desc: 'Landing page o anuncio falso para medir interés real sin construir nada.' },
  { id: 'entrevistas',  icon: '📞', label: 'Entrevistas de problema',  desc: '5-10 conversaciones profundas con clientes para descubrir dolores reales.' },
  { id: 'mago_oz',      icon: '🎭', label: 'Mago de Oz',               desc: 'Simular la funcionalidad manualmente mientras el cliente cree que es automático.' },
  { id: 'preventa',     icon: '💰', label: 'Preventa',                  desc: 'Cobrar antes de construir — el pago es la validación más poderosa.' },
  { id: 'prototipo',    icon: '📱', label: 'Prototipo mínimo',         desc: 'Maqueta navegable o demo básica para probar la propuesta de valor.' },
];

const DECISION_CONFIG = {
  perseverar:     { color: '#16a34a', bg: '#dcfce7', border: '#16a34a', label: '✅ Perseverar',      sub: 'Tu hipótesis tiene validación suficiente. Avanza.' },
  pivotar_parcial:{ color: '#d97706', bg: '#fef3c7', border: '#d97706', label: '⚡ Pivotar parcialmente', sub: 'Hay señales positivas pero algo importante debe cambiar.' },
  pivotar:        { color: '#dc2626', bg: '#fee2e2', border: '#dc2626', label: '🔄 Pivotar',          sub: 'La hipótesis no se validó. Replantea el enfoque.' },
};

const INTERES_STYLE = {
  alto:  { bg: '#dcfce7', text: '#16a34a' },
  medio: { bg: '#fef3c7', text: '#d97706' },
  bajo:  { bg: '#fee2e2', text: '#dc2626' },
};

export default function ValidadorLeanSimulator() {
  const [step, setStep]             = useState(1);
  const [segmento, setSegmento]     = useState('');
  const [problema, setProblema]     = useState('');
  const [solucion, setSolucion]     = useState('');
  const [diferenciador, setDifer]   = useState('');
  const [experimento, setExper]     = useState('entrevistas');
  const [metrica, setMetrica]       = useState('');
  const [umbral, setUmbral]         = useState(60);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const hipotesisCompleta = segmento.trim() && problema.trim() && solucion.trim() && diferenciador.trim();
  const canSimulate = hipotesisCompleta;

  const simulate = async () => {
    if (!canSimulate) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/auth/validar-hipotesis', {
        segmento, problema, solucion, diferenciador, experimento, metrica, umbral,
      });
      setResult(data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con la IA.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setStep(1); };

  const downloadPDF = () => {
    if (!result) return;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const dc = DECISION_CONFIG[result.decision] || DECISION_CONFIG.pivotar;
    const expLabel = EXPERIMENT_TYPES.find(e => e.id === experimento)?.label || experimento;

    const perfilesHTML = (result.perfiles || []).map((p, i) => {
      const is = INTERES_STYLE[p.interes] || INTERES_STYLE.bajo;
      return `<div class="perfil">
        <div class="perfil-head">
          <span class="perfil-num">${i+1}</span>
          <div>
            <div class="perfil-nombre">${p.nombre}</div>
            <div class="perfil-badges">
              <span class="badge" style="background:${is.bg};color:${is.text}">Interés: ${p.interes}</span>
              <span class="badge" style="background:${p.pagaria?'#dcfce7':'#fee2e2'};color:${p.pagaria?'#16a34a':'#dc2626'}">${p.pagaria?'💰 Pagaría':'✗ No pagaría'}</span>
            </div>
          </div>
        </div>
        <div class="perfil-resp">"${p.comentario_clave}"</div>
        <div class="perfil-full">${p.respuesta}</div>
      </div>`;
    }).join('');

    const fav  = (result.evidencia_favor  || []).map(e => `<li class="pro">✓ ${e}</li>`).join('');
    const cont = (result.evidencia_contra || []).map(e => `<li class="risk">✗ ${e}</li>`).join('');
    const pasos = (result.proximos_pasos  || []).map((p,i) => `<li><span class="num">${i+1}</span>${p}</li>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Validación Lean — ${segmento}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}@page{margin:1.5cm}
body{font-family:'Georgia',serif;color:#1e3a5f;font-size:10pt;padding:.5cm}
.header{border-bottom:3px solid #1d4ed8;padding-bottom:.8rem;margin-bottom:1rem}
.title{font-size:18pt;font-weight:bold;color:#1d4ed8}.sub{font-size:9.5pt;color:#64748b;margin-top:.2rem}
.meta{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:.6rem;font-size:9pt;color:#475569}
.meta strong{color:#1e3a5f}
.hipotesis{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.9rem;
  font-size:10pt;line-height:1.7;color:#1e40af;margin:1rem 0;font-style:italic}
.decision-box{border:3px solid ${dc.border};background:${dc.bg};border-radius:10px;
  padding:1rem 1.5rem;margin:1rem 0;display:flex;align-items:center;gap:1.5rem}
.score-circle{width:75px;height:75px;border-radius:50%;border:3px solid ${dc.border};
  background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
.score-num{font-size:20pt;font-weight:bold;color:${dc.color};line-height:1}
.score-unit{font-size:8pt;color:${dc.color};font-family:monospace}
.decision-label{font-size:14pt;font-weight:bold;color:${dc.color};margin-bottom:.3rem}
.decision-sub{font-size:10pt;color:#475569}
.section{margin:1rem 0}.section-title{font-size:11pt;font-weight:bold;color:#1d4ed8;
  border-bottom:2px solid #e2e8f0;padding-bottom:.3rem;margin-bottom:.7rem}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.pro-list,.risk-list{list-style:none}.pro{color:#166534;font-size:9.5pt;padding:.2rem 0}
.risk{color:#991b1b;font-size:9.5pt;padding:.2rem 0}
.perfil{border:1px solid #e2e8f0;border-radius:6px;padding:.6rem .8rem;margin-bottom:.5rem;break-inside:avoid}
.perfil-head{display:flex;gap:.6rem;align-items:flex-start;margin-bottom:.3rem}
.perfil-num{background:#1d4ed8;color:#fff;border-radius:50%;width:20px;height:20px;
  display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:bold;flex-shrink:0;margin-top:.1rem}
.perfil-nombre{font-weight:bold;font-size:9.5pt;color:#1e3a5f}
.perfil-badges{display:flex;gap:.4rem;margin-top:.2rem}
.badge{font-size:8pt;padding:.15rem .45rem;border-radius:3px;font-family:monospace}
.perfil-resp{font-size:9pt;color:#1d4ed8;font-style:italic;margin:.3rem 0}
.perfil-full{font-size:8.5pt;color:#475569;line-height:1.4}
.reco-list{list-style:none;display:flex;flex-direction:column;gap:.4rem}
.reco-list li{display:flex;gap:.5rem;font-size:9.5pt;line-height:1.5}
.num{background:#1d4ed8;color:#fff;border-radius:50%;width:17px;height:17px;
  display:flex;align-items:center;justify-content:center;font-size:7.5pt;font-weight:bold;flex-shrink:0;margin-top:.1rem}
.insight{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:.9rem;
  font-size:10pt;line-height:1.65;color:#92400e;margin-top:1rem}
.footer{margin-top:1.5rem;padding-top:.7rem;border-top:1px solid #e2e8f0;
  font-size:8pt;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  <div class="title">Sprint de Validación Lean</div>
  <div class="sub">Validación de hipótesis de negocio con simulación IA</div>
  <div class="meta">
    <span>👥 <strong>Segmento:</strong> ${segmento}</span>
    <span>🧪 <strong>Experimento:</strong> ${expLabel}</span>
    <span>📏 <strong>Umbral:</strong> ${umbral}%</span>
    <span>📅 ${fecha}</span>
  </div>
</div>
<div class="hipotesis">"Creemos que <strong>${segmento}</strong> experimenta <strong>${problema}</strong>. Nuestra solución <strong>${solucion}</strong> resuelve esto mejor que las alternativas porque <strong>${diferenciador}</strong>."</div>
<div class="decision-box">
  <div class="score-circle"><span class="score-num">${result.tasa_validacion}</span><span class="score-unit">%</span></div>
  <div>
    <div class="decision-label">${dc.label}</div>
    <div class="decision-sub">${result.razon_decision}</div>
    ${result.tipo_pivote ? `<div style="margin-top:.4rem;font-size:9pt;color:#d97706;font-weight:bold">Pivote sugerido: ${result.tipo_pivote}</div>` : ''}
  </div>
</div>
<div class="section">
  <div class="section-title">Perfiles simulados (8 clientes potenciales)</div>
  ${perfilesHTML}
</div>
<div class="section">
  <div class="section-title">Evidencia de validación</div>
  <div class="two-col">
    <div><div style="font-size:10pt;font-weight:bold;color:#16a34a;margin-bottom:.4rem">✅ A favor</div><ul class="pro-list">${fav}</ul></div>
    <div><div style="font-size:10pt;font-weight:bold;color:#dc2626;margin-bottom:.4rem">⚠ En contra</div><ul class="risk-list">${cont}</ul></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Próximos pasos</div>
  <ul class="reco-list">${pasos}</ul>
</div>
<div class="insight">💡 <strong>Insight clave:</strong> ${result.insight_clave}</div>
<div class="footer">Generado con IA — Sprint de Validación Lean · SEGEDU · ${fecha}<br>
Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=950,height=750');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const dc = DECISION_CONFIG[result?.decision] || DECISION_CONFIG.pivotar;
  const expActivo = EXPERIMENT_TYPES.find(e => e.id === experimento);

  const labelStyle = { display: 'block', fontFamily: 'var(--mono)', fontSize: '.68rem',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' };
  const inputStyle = { width: '100%', padding: '.5rem .75rem', borderRadius: '6px',
    border: '1px solid #cbd5e1', fontSize: '.88rem', background: '#fff',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const taStyle   = { ...inputStyle, resize: 'vertical' };
  const focusBlue = e => { e.target.style.borderColor = '#1d4ed8'; };
  const blurGray  = e => { e.target.style.borderColor = '#cbd5e1'; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => {
          const done    = step > s.id;
          const active  = step === s.id;
          const color   = done ? '#16a34a' : active ? '#1d4ed8' : '#cbd5e1';
          const textCol = done || active ? '#fff' : '#94a3b8';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? '.9rem' : '1rem', color: textCol, fontWeight: 700,
                  transition: 'all .3s' }}>
                  {done ? '✓' : s.icon}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: active ? '#1d4ed8' : '#94a3b8',
                  fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: done ? '#16a34a' : '#e2e8f0',
                  margin: '0 .4rem', marginBottom: '1.2rem', transition: 'background .3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Hipótesis */}
      {step === 1 && (
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700,
            color: '#1d4ed8', marginBottom: '1rem' }}>
            💡 Formula tu hipótesis de negocio
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '.75rem' }}>
            <div>
              <label style={labelStyle}>Segmento de clientes *</label>
              <input value={segmento} onChange={e => setSegmento(e.target.value)} style={inputStyle}
                placeholder="Ej: Emprendedores jóvenes de La Paz" onFocus={focusBlue} onBlur={blurGray} />
            </div>
            <div>
              <label style={labelStyle}>Diferenciador único *</label>
              <input value={diferenciador} onChange={e => setDifer(e.target.value)} style={inputStyle}
                placeholder="Ej: sin costo inicial, en 24 horas" onFocus={focusBlue} onBlur={blurGray} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Problema / necesidad *</label>
              <textarea value={problema} onChange={e => setProblema(e.target.value)} rows={3} style={taStyle}
                placeholder="Ej: no tienen acceso a financiamiento rápido" onFocus={focusBlue} onBlur={blurGray} />
            </div>
            <div>
              <label style={labelStyle}>Solución propuesta *</label>
              <textarea value={solucion} onChange={e => setSolucion(e.target.value)} rows={3} style={taStyle}
                placeholder="Ej: plataforma de microcréditos basada en historial digital" onFocus={focusBlue} onBlur={blurGray} />
            </div>
          </div>

          {/* Preview hipótesis */}
          {hipotesisCompleta && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
              padding: '.85rem', marginBottom: '1rem', fontSize: '.85rem', lineHeight: 1.7, color: '#1e40af',
              fontStyle: 'italic' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: '#1d4ed8' }}>Tu hipótesis: </span>
              "Creemos que <strong>{segmento}</strong> experimenta <strong>{problema}</strong>.
              Nuestra solución <strong>{solucion}</strong> resuelve esto mejor que las alternativas
              porque <strong>{diferenciador}</strong>."
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(2)} disabled={!hipotesisCompleta}
              style={{ padding: '.5rem 1.4rem', borderRadius: '7px', cursor: hipotesisCompleta ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--mono)', fontSize: '.8rem', fontWeight: 700, border: 'none',
                background: hipotesisCompleta ? '#1d4ed8' : '#e2e8f0',
                color: hipotesisCompleta ? '#fff' : '#94a3b8' }}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Experimento */}
      {step === 2 && (
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700,
            color: '#1d4ed8', marginBottom: '1rem' }}>
            🧪 Diseña tu experimento de validación
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.6rem', marginBottom: '1rem' }}>
            {EXPERIMENT_TYPES.map(e => (
              <button key={e.id} onClick={() => setExper(e.id)}
                style={{ all: 'unset', cursor: 'pointer', padding: '.75rem .9rem', borderRadius: '8px',
                  border: `2px solid ${experimento === e.id ? '#1d4ed8' : '#e2e8f0'}`,
                  background: experimento === e.id ? '#eff6ff' : '#fff',
                  textAlign: 'left', transition: 'all .15s' }}>
                <div style={{ fontSize: '1.3rem', marginBottom: '.3rem' }}>{e.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '.85rem', color: experimento === e.id ? '#1d4ed8' : '#1e3a5f',
                  marginBottom: '.25rem' }}>{e.label}</div>
                <div style={{ fontSize: '.75rem', color: '#64748b', lineHeight: 1.4 }}>{e.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)}
              style={{ padding: '.5rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.78rem', border: '1.5px solid #cbd5e1',
                background: '#fff', color: '#64748b' }}>
              ← Anterior
            </button>
            <button onClick={() => setStep(3)}
              style={{ padding: '.5rem 1.4rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.8rem', fontWeight: 700,
                border: 'none', background: '#1d4ed8', color: '#fff' }}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Criterios */}
      {step === 3 && (
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700,
            color: '#1d4ed8', marginBottom: '1rem' }}>
            📏 Define tus criterios de éxito
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Métrica principal de validación</label>
            <input value={metrica} onChange={e => setMetrica(e.target.value)} style={inputStyle}
              placeholder="Ej: % de entrevistados dispuestos a pagar en el primer mes"
              onFocus={focusBlue} onBlur={blurGray} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>
              Umbral mínimo de éxito: <strong style={{ color: '#1d4ed8' }}>{umbral}%</strong>
            </label>
            <input type="range" min={30} max={90} step={5} value={umbral}
              onChange={e => setUmbral(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#1d4ed8' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--mono)', marginTop: '.25rem' }}>
              <span>30% — Muy flexible</span>
              <span>60% — Estándar Lean</span>
              <span>90% — Muy exigente</span>
            </div>
          </div>

          {/* Resumen antes de simular */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '.85rem', marginBottom: '1rem', fontSize: '.82rem', color: '#475569', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '.4rem' }}>Resumen del experimento</div>
            <div>🧪 <strong>{expActivo?.label}</strong> — {expActivo?.desc}</div>
            <div style={{ marginTop: '.3rem' }}>📏 Validado si ≥ <strong style={{ color: '#1d4ed8' }}>{umbral}%</strong> de los perfiles simulados muestran interés alto o medio</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(2)}
              style={{ padding: '.5rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.78rem', border: '1.5px solid #cbd5e1',
                background: '#fff', color: '#64748b' }}>
              ← Anterior
            </button>
            <button onClick={simulate} disabled={loading}
              style={{ padding: '.55rem 1.5rem', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.82rem', fontWeight: 700, border: 'none',
                background: loading ? '#e2e8f0' : '#1d4ed8', color: loading ? '#94a3b8' : '#fff' }}>
              {loading ? '⏳ Simulando...' : '🚀 Simular con IA'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc',
          borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '.75rem',
            animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🧪</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700,
            color: '#1e3a5f', marginBottom: '.4rem' }}>
            Simulando respuestas del mercado boliviano...
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b' }}>
            La IA está generando 8 perfiles de clientes y evaluando tu hipótesis. Un momento...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', gap: '.75rem' }}>
          <span>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '.2rem' }}>Error al simular</div>
            <div style={{ fontSize: '.85rem', color: '#7f1d1d' }}>{error}</div>
          </div>
        </div>
      )}

      {/* STEP 4: Resultados */}
      {result && step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
            <button onClick={reset}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b' }}>
              ↺ Nueva validación
            </button>
            <button onClick={downloadPDF}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #16a34a', background: '#16a34a', color: '#fff' }}>
              ⬇ Descargar reporte PDF
            </button>
          </div>

          {/* Decisión principal */}
          <div style={{ borderRadius: '12px', border: `3px solid ${dc.border}`,
            background: dc.bg, padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%',
              border: `4px solid ${dc.border}`, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', flexShrink: 0 }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 900, color: dc.color,
                fontFamily: 'var(--mono)', lineHeight: 1 }}>{result.tasa_validacion}</span>
              <span style={{ fontSize: '.65rem', color: dc.color, fontFamily: 'var(--mono)' }}>%</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700,
                color: dc.color, marginBottom: '.3rem' }}>{dc.label}</div>
              <div style={{ fontSize: '.88rem', color: '#475569', lineHeight: 1.6 }}>
                {result.razon_decision}
              </div>
              {result.tipo_pivote && (
                <div style={{ marginTop: '.45rem', display: 'inline-block', background: '#fef3c7',
                  color: '#92400e', padding: '.2rem .7rem', borderRadius: '4px',
                  fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700 }}>
                  Pivote sugerido: {result.tipo_pivote}
                </div>
              )}
            </div>
          </div>

          {/* Perfiles */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0', fontFamily: 'var(--mono)', fontSize: '.72rem',
              fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              👥 Perfiles simulados — 8 clientes potenciales
            </div>
            <div style={{ padding: '1rem', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '.75rem' }}>
              {(result.perfiles || []).map((p, i) => {
                const is = INTERES_STYLE[p.interes] || INTERES_STYLE.bajo;
                return (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '.75rem', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: '.5rem', marginBottom: '.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#1e3a5f', lineHeight: 1.3 }}>
                        {p.nombre}
                      </span>
                      <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                        <span style={{ background: is.bg, color: is.text, padding: '.1rem .45rem',
                          borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '.63rem', fontWeight: 700 }}>
                          {p.interes}
                        </span>
                        <span style={{ background: p.pagaria ? '#dcfce7' : '#fee2e2',
                          color: p.pagaria ? '#16a34a' : '#dc2626',
                          padding: '.1rem .4rem', borderRadius: '3px',
                          fontFamily: 'var(--mono)', fontSize: '.63rem', fontWeight: 700 }}>
                          {p.pagaria ? '💰' : '✗'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#1d4ed8', fontStyle: 'italic',
                      marginBottom: '.35rem', lineHeight: 1.4 }}>
                      "{p.comentario_clave}"
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#475569', lineHeight: 1.5 }}>
                      {p.respuesta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidencia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '.65rem 1rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0',
                fontFamily: 'var(--mono)', fontSize: '.68rem', fontWeight: 700,
                color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                ✅ Evidencia a favor
              </div>
              <div style={{ padding: '.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {(result.evidencia_favor || []).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: '.5rem', fontSize: '.83rem',
                    color: '#166534', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, color: '#16a34a' }}>•</span>{e}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '.65rem 1rem', background: '#fff7ed', borderBottom: '1px solid #fed7aa',
                fontFamily: 'var(--mono)', fontSize: '.68rem', fontWeight: 700,
                color: '#ea580c', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                ⚠ Evidencia en contra
              </div>
              <div style={{ padding: '.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {(result.evidencia_contra || []).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: '.5rem', fontSize: '.83rem',
                    color: '#9a3412', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, color: '#ea580c' }}>•</span>{e}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Próximos pasos */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
              color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              🚀 Próximos pasos accionables
            </div>
            <div style={{ padding: '.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {(result.proximos_pasos || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '.72rem', fontWeight: 700,
                    flexShrink: 0, fontFamily: 'var(--mono)', marginTop: '.1rem' }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.6 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight clave */}
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '.3rem',
                fontFamily: 'var(--mono)', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Insight clave
              </div>
              <div style={{ fontSize: '.9rem', color: '#78350f', lineHeight: 1.65 }}>
                {result.insight_clave}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            ⚠ Esta simulación es generada por IA con prompts específicos para la asignatura y tiene carácter orientativo.
            Complementa con investigación de campo real. Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel
          </p>
        </div>
      )}
    </div>
  );
}
