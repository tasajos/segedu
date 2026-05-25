import { useState } from 'react';
import api from '../../services/api';

const NIVEL_STYLE = {
  Alto:  { bg: '#dcfce7', text: '#16a34a', border: '#16a34a' },
  Medio: { bg: '#fef3c7', text: '#d97706', border: '#d97706' },
  Bajo:  { bg: '#fee2e2', text: '#dc2626', border: '#dc2626' },
};

const ESTADO_STYLE = {
  'activo':         { bg: '#dbeafe', text: '#1d4ed8' },
  'en crecimiento': { bg: '#dcfce7', text: '#16a34a' },
  'cerrado':        { bg: '#f1f5f9', text: '#64748b' },
};

const IMPACTO = {
  positivo: { icon: '↑', color: '#16a34a', bg: '#dcfce7' },
  neutral:  { icon: '→', color: '#64748b', bg: '#f1f5f9' },
  negativo: { icon: '↓', color: '#dc2626', bg: '#fee2e2' },
};

function Card({ title, icon, children, accent = '#1d4ed8' }) {
  return (
    <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.07em', color: accent }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '1rem' }}>{children}</div>
    </div>
  );
}

export default function AnalizadorMercadoSimulator() {
  const [nombre,   setNombre]   = useState('');
  const [problema, setProblema] = useState('');
  const [cliente,  setCliente]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  const canAnalyze = (nombre.trim() || problema.trim()) && !loading;

  const analyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/auth/analizar-negocio', { nombre, problema, cliente });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con Gemini. Verifica la configuración de la API key.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  const downloadPDF = () => {
    if (!result) return;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const nivel = result.viabilidad?.nivel || 'Medio';
    const score = result.viabilidad?.puntuacion ?? 0;
    const ns = NIVEL_STYLE[nivel] || NIVEL_STYLE.Medio;

    const similares = (result.negocios_similares || []).map(n =>
      `<div class="similar-card">
        <div class="similar-head">
          <strong>${n.nombre}</strong>
          <span class="badge estado-${(n.estado||'activo').replace(' ','-')}">${n.estado || 'activo'}</span>
        </div>
        <div class="similar-city">📍 ${n.ciudad}</div>
        <div class="similar-desc">${n.descripcion}</div>
      </div>`
    ).join('');

    const tendencias = (result.tendencias || []).map(t => {
      const imp = IMPACTO[t.impacto] || IMPACTO.neutral;
      return `<div class="trend-row">
        <span class="trend-icon" style="color:${imp.color}">${imp.icon}</span>
        <div><strong>${t.titulo}</strong><br><span class="small">${t.descripcion}</span></div>
      </div>`;
    }).join('');

    const favor = (result.viabilidad?.factores_favor || []).map(f =>
      `<li class="pro-item">✓ ${f}</li>`).join('');
    const riesgos = (result.viabilidad?.factores_riesgo || []).map(r =>
      `<li class="risk-item">✗ ${r}</li>`).join('');
    const recos = (result.recomendaciones || []).map((r, i) =>
      `<li class="reco-item"><span class="reco-num">${i + 1}</span>${r}</li>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Análisis de Mercado — ${nombre || 'Negocio'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{margin:1.5cm}
body{font-family:'Georgia',serif;color:#1e3a5f;font-size:10.5pt;padding:.5cm}
.header{border-bottom:3px solid #1d4ed8;padding-bottom:.8rem;margin-bottom:1rem}
.biz-name{font-size:20pt;font-weight:bold;color:#1d4ed8}
.biz-sub{font-size:9.5pt;color:#64748b;margin-top:.2rem}
.meta{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:.6rem;font-size:9pt;color:#475569}
.meta strong{color:#1e3a5f}
.section{margin:1rem 0}
.section-title{font-size:11.5pt;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #e2e8f0;
  padding-bottom:.3rem;margin-bottom:.7rem;display:flex;align-items:center;gap:.4rem}
.summary-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.9rem;
  font-size:10.5pt;line-height:1.65;color:#1e40af}
.score-row{display:flex;align-items:center;gap:1.5rem;margin-bottom:.7rem}
.score-circle{width:70px;height:70px;border-radius:50%;
  background:${ns.bg};border:3px solid ${ns.border};
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.score-num{font-size:22pt;font-weight:bold;color:${ns.text}}
.nivel-badge{display:inline-block;padding:.2rem .7rem;border-radius:4px;
  background:${ns.bg};color:${ns.text};font-weight:bold;font-size:10pt;margin-bottom:.4rem}
.vial-desc{font-size:10pt;line-height:1.6;color:#334155}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.pro-list,.risk-list{list-style:none;display:flex;flex-direction:column;gap:.4rem}
.pro-item{font-size:9.5pt;color:#166534;line-height:1.5;padding:.2rem 0}
.risk-item{font-size:9.5pt;color:#991b1b;line-height:1.5;padding:.2rem 0}
.similar-grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.similar-card{border:1px solid #e2e8f0;border-radius:6px;padding:.6rem .8rem;break-inside:avoid}
.similar-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.2rem}
.similar-city{font-size:8.5pt;color:#64748b;margin-bottom:.2rem}
.similar-desc{font-size:9pt;color:#475569;line-height:1.4}
.badge{font-size:7.5pt;padding:.15rem .45rem;border-radius:3px;font-family:monospace}
.estado-activo{background:#dbeafe;color:#1d4ed8}
.estado-en-crecimiento{background:#dcfce7;color:#16a34a}
.estado-cerrado{background:#f1f5f9;color:#64748b}
.trend-row{display:flex;align-items:flex-start;gap:.6rem;padding:.4rem 0;
  border-bottom:1px solid #f1f5f9}
.trend-icon{font-size:13pt;font-weight:bold;flex-shrink:0;line-height:1.3}
.market-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:.9rem;
  font-size:10pt;line-height:1.65;color:#14532d}
.reco-list{list-style:none;display:flex;flex-direction:column;gap:.5rem}
.reco-item{display:flex;align-items:flex-start;gap:.6rem;font-size:10pt;line-height:1.55;break-inside:avoid}
.reco-num{background:#1d4ed8;color:#fff;border-radius:50%;width:18px;height:18px;
  display:flex;align-items:center;justify-content:center;font-size:8pt;
  font-weight:bold;flex-shrink:0;margin-top:.1rem}
.small{font-size:9pt;color:#475569}
.footer{margin-top:1.5rem;padding-top:.7rem;border-top:1px solid #e2e8f0;
  font-size:8.5pt;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="header">
  <div class="biz-name">${nombre || 'Análisis de Negocio'}</div>
  <div class="biz-sub">Análisis de Mercado Bolivia — Generado con IA</div>
  <div class="meta">
    <span>💡 <strong>Idea:</strong> ${nombre || '—'}</span>
    <span>🎯 <strong>Problema:</strong> ${problema || '—'}</span>
    <span>👥 <strong>Cliente:</strong> ${cliente || '—'}</span>
    <span>📅 ${fecha}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Resumen ejecutivo</div>
  <div class="summary-box">${result.resumen_ejecutivo || '—'}</div>
</div>

<div class="section">
  <div class="section-title">📊 Viabilidad del negocio</div>
  <div class="score-row">
    <div class="score-circle"><span class="score-num">${score}</span></div>
    <div>
      <div class="nivel-badge">${nivel}</div>
      <div class="vial-desc">${result.viabilidad?.descripcion || ''}</div>
    </div>
  </div>
  <div class="two-col">
    <div>
      <div class="section-title" style="font-size:10pt">✅ Factores a favor</div>
      <ul class="pro-list">${favor}</ul>
    </div>
    <div>
      <div class="section-title" style="font-size:10pt">⚠ Factores de riesgo</div>
      <ul class="risk-list">${riesgos}</ul>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">🏢 Negocios similares en Bolivia</div>
  <div class="similar-grid">${similares}</div>
</div>

<div class="section">
  <div class="section-title">📈 Tendencias del mercado</div>
  ${tendencias}
</div>

<div class="section">
  <div class="section-title">🌱 Mercado potencial</div>
  <div class="market-box">${result.mercado_potencial || '—'}</div>
</div>

<div class="section">
  <div class="section-title">💡 Recomendaciones</div>
  <ul class="reco-list">${recos}</ul>
</div>

<div class="footer">Análisis generado con Claude (Anthropic) — SEGEDU · ${fecha}<br>
Este análisis es orientativo. Complementa con investigación de campo local.</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=950,height=750');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const nivel   = result?.viabilidad?.nivel || 'Medio';
  const nstyle  = NIVEL_STYLE[nivel] || NIVEL_STYLE.Medio;
  const score   = result?.viabilidad?.puntuacion ?? 0;

  const inputStyle = {
    width: '100%', padding: '.5rem .75rem', borderRadius: '6px',
    border: '1px solid #cbd5e1', fontSize: '.88rem', background: '#fff',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontFamily: 'var(--mono)', fontSize: '.68rem',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Formulario */}
      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem', marginBottom: '.85rem' }}>
          {[
            { label: 'Idea de negocio', val: nombre, set: setNombre, placeholder: 'Ej: EcoDelivery Bolivia' },
            { label: 'Problema que resuelve', val: problema, set: setProblema, placeholder: 'Ej: falta de delivery sostenible' },
            { label: 'Cliente objetivo', val: cliente, set: setCliente, placeholder: 'Ej: tiendas ecológicas de La Paz' },
          ].map(f => (
            <div key={f.label}>
              <label style={labelStyle}>{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#1d4ed8'; }}
                onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }}
                onKeyDown={e => { if (e.key === 'Enter') analyze(); }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={analyze} disabled={!canAnalyze}
            style={{
              padding: '.5rem 1.2rem', borderRadius: '7px', cursor: canAnalyze ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--mono)', fontSize: '.8rem', fontWeight: 700,
              border: 'none', background: canAnalyze ? '#1d4ed8' : '#e2e8f0',
              color: canAnalyze ? '#fff' : '#94a3b8', transition: 'all .15s',
            }}>
            {loading ? '⏳ Analizando...' : '🔍 Análisis con IA'}
          </button>
          {result && (
            <>
              <button onClick={reset}
                style={{ padding: '.5rem 1rem', borderRadius: '7px', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: '.78rem', fontWeight: 700,
                  border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b' }}>
                ↺ Nueva búsqueda
              </button>
              <button onClick={downloadPDF}
                style={{ padding: '.5rem 1rem', borderRadius: '7px', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: '.78rem', fontWeight: 700,
                  border: '1.5px solid #16a34a', background: '#16a34a', color: '#fff' }}>
                ⬇ Descargar análisis PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc',
          borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem',
            animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🌐</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', color: '#1e3a5f',
            fontWeight: 700, marginBottom: '.4rem' }}>
            Analizando el mercado boliviano...
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b' }}>
            La IA está buscando negocios similares, tendencias y evaluando viabilidad. Puede tomar unos segundos.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '.25rem' }}>Error al analizar</div>
            <div style={{ fontSize: '.85rem', color: '#7f1d1d' }}>{error}</div>
            <div style={{ fontSize: '.78rem', color: '#991b1b', marginTop: '.4rem' }}>
              Verifica que <code>ANTHROPIC_API_KEY</code> esté configurada en el servidor.
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Resumen ejecutivo */}
          <Card title="Resumen ejecutivo" icon="📋" accent="#1d4ed8">
            <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: '#1e40af',
              background: '#eff6ff', padding: '.85rem', borderRadius: '7px', margin: 0 }}>
              {result.resumen_ejecutivo}
            </p>
          </Card>

          {/* Viabilidad + mercado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            {/* Score */}
            <Card title="Viabilidad del negocio" icon="📊" accent={nstyle.text}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '.75rem', textAlign: 'center' }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: nstyle.bg, border: `4px solid ${nstyle.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                }}>
                  <span style={{ fontSize: '1.9rem', fontWeight: 900, color: nstyle.text,
                    fontFamily: 'var(--mono)', lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: '.65rem', color: nstyle.text, fontFamily: 'var(--mono)' }}>/10</span>
                </div>
                <span style={{ background: nstyle.bg, color: nstyle.text, border: `1.5px solid ${nstyle.border}`,
                  padding: '.25rem .8rem', borderRadius: '999px',
                  fontFamily: 'var(--mono)', fontSize: '.78rem', fontWeight: 700 }}>
                  {nivel}
                </span>
                <p style={{ fontSize: '.82rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {result.viabilidad?.descripcion}
                </p>
              </div>
            </Card>

            {/* Mercado potencial */}
            <Card title="Mercado potencial en Bolivia" icon="🌱" accent="#16a34a">
              <p style={{ fontSize: '.88rem', lineHeight: 1.75, color: '#166534',
                background: '#f0fdf4', padding: '.85rem', borderRadius: '7px', margin: '0 0 .75rem' }}>
                {result.mercado_potencial}
              </p>
              {/* Factores favor / riesgo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', fontWeight: 700,
                    color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>
                    ✅ A favor
                  </div>
                  {(result.viabilidad?.factores_favor || []).map((f, i) => (
                    <div key={i} style={{ fontSize: '.8rem', color: '#166534', display: 'flex',
                      gap: '.4rem', marginBottom: '.35rem', lineHeight: 1.45 }}>
                      <span style={{ flexShrink: 0, color: '#16a34a' }}>•</span>{f}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', fontWeight: 700,
                    color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>
                    ⚠ Riesgos
                  </div>
                  {(result.viabilidad?.factores_riesgo || []).map((r, i) => (
                    <div key={i} style={{ fontSize: '.8rem', color: '#991b1b', display: 'flex',
                      gap: '.4rem', marginBottom: '.35rem', lineHeight: 1.45 }}>
                      <span style={{ flexShrink: 0, color: '#dc2626' }}>•</span>{r}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Negocios similares */}
          <Card title="Negocios similares en Bolivia" icon="🏢" accent="#7c3aed">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '.75rem' }}>
              {(result.negocios_similares || []).map((n, i) => {
                const st = ESTADO_STYLE[n.estado] || ESTADO_STYLE.activo;
                return (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '.75rem', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: '.5rem', marginBottom: '.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#1e3a5f', lineHeight: 1.3 }}>
                        {n.nombre}
                      </span>
                      <span style={{ background: st.bg, color: st.text, padding: '.15rem .5rem',
                        borderRadius: '3px', fontFamily: 'var(--mono)', fontSize: '.65rem',
                        fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {n.estado}
                      </span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: '.3rem' }}>
                      📍 {n.ciudad}
                    </div>
                    <div style={{ fontSize: '.8rem', color: '#475569', lineHeight: 1.5 }}>
                      {n.descripcion}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tendencias */}
          <Card title="Tendencias del mercado" icon="📈" accent="#d97706">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {(result.tendencias || []).map((t, i) => {
                const imp = IMPACTO[t.impacto] || IMPACTO.neutral;
                return (
                  <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start',
                    padding: '.6rem .75rem', borderRadius: '7px', background: imp.bg }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: imp.color,
                      flexShrink: 0, lineHeight: 1.5, fontFamily: 'var(--mono)' }}>
                      {imp.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#1e3a5f',
                        marginBottom: '.2rem' }}>
                        {t.titulo}
                      </div>
                      <div style={{ fontSize: '.82rem', color: '#475569', lineHeight: 1.55 }}>
                        {t.descripcion}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recomendaciones */}
          <Card title="Recomendaciones estratégicas" icon="💡" accent="#1d4ed8">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {(result.recomendaciones || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '.72rem', fontWeight: 700,
                    flexShrink: 0, fontFamily: 'var(--mono)', marginTop: '.1rem' }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.65 }}>{r}</span>
                </div>
              ))}
            </div>
          </Card>

          <p style={{ fontSize: '.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            ⚠ Este análisis es generado por IA con prompts específicos para la asignatura y tiene carácter orientativo. Complementa siempre con investigación de campo local. Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel
          </p>
        </div>
      )}
    </div>
  );
}
