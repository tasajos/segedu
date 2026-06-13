import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STEPS = [
  { id: 1, label: 'Formular',  desc: 'Pregunta PICO' },
  { id: 2, label: 'Términos',  desc: 'MeSH y operadores' },
  { id: 3, label: 'Ejecutar',  desc: 'Búsqueda con IA' },
  { id: 4, label: 'Informe',   desc: 'Hallazgos y fuentes' },
];

const PICO_CONFIG = {
  P: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'P — Paciente / Problema',    placeholder: 'Ej: Pacientes adultos con diabetes tipo 2 e hipertensión arterial...' },
  I: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'I — Intervención',            placeholder: 'Ej: Metformina 850 mg/día como monoterapia...' },
  C: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'C — Comparación (opcional)', placeholder: 'Ej: Glibenclamida 5 mg/día o placebo...' },
  O: { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'O — Resultado (Outcome)',    placeholder: 'Ej: Reducción de HbA1c, control glucémico a 6 meses...' },
};

const EVIDENCIA_CFG = {
  'alta':     { color: '#16a34a', bg: '#dcfce7', label: 'Alta' },
  'moderada': { color: '#d97706', bg: '#fef3c7', label: 'Moderada' },
  'baja':     { color: '#dc2626', bg: '#fee2e2', label: 'Baja' },
  'muy-baja': { color: '#7c3aed', bg: '#ede9fe', label: 'Muy baja' },
};

const TIPO_LABEL = {
  'meta-analisis':               'Meta-análisis',
  'revision-sistematica':        'Revisión sistemática',
  'ensayo-clinico-aleatorizado': 'ECA',
  'estudio-cohorte':             'Cohorte',
  'caso-control':                'Caso-control',
};

const GRADO_CFG = {
  A: { color: '#16a34a', desc: 'Evidencia consistente de ECA o estudios observacionales excepcionales' },
  B: { color: '#d97706', desc: 'Evidencia de ECA con limitaciones o estudios observacionales consistentes' },
  C: { color: '#dc2626', desc: 'Estudios observacionales o extrapolación de estudios categoría A o B' },
  D: { color: '#64748b', desc: 'Opinión de expertos o extrapolación de estudios categoría C' },
};

const labelSt = {
  display: 'block', fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.35rem',
};
const inputSt = {
  width: '100%', padding: '.6rem .85rem', borderRadius: '6px', border: '1px solid #cbd5e1',
  fontSize: '.88rem', background: '#fff', boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit', resize: 'vertical',
};

const RESPONSIVE_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Stepper */
  .pico-stepper { display: flex; align-items: center; margin-bottom: 1.5rem; }
  .pico-step-connector { flex: 1; height: 2px; margin: 0 .75rem; margin-top: -1rem; transition: background .3s; }
  .pico-step-desc { font-size: .65rem; color: #94a3b8; }

  /* Split layout: terminal + report side by side */
  .pico-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; min-height: 520px; }
  .pico-terminal-panel { display: flex; flex-direction: column; }
  .pico-report-panel   { overflow-y: auto; max-height: 580px; }

  /* 2-column grids inside steps */
  .pico-2col     { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .pico-2col-sm  { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }

  /* Terminal scroll area */
  .pico-terminal-body { background: #0d1117; border-radius: 0 0 8px 8px; padding: 1rem;
    font-family: var(--mono); font-size: .78rem; line-height: 1.65; color: #e6edf3;
    overflow-y: auto; flex: 1; min-height: 0; max-height: 520px;
    white-space: pre-wrap; word-break: break-word; }

  /* ── Mobile (≤ 640px) ── */
  @media (max-width: 640px) {
    .pico-step-desc    { display: none; }
    .pico-step-connector { margin: 0 .4rem; margin-top: -.75rem; }
    .pico-split        { grid-template-columns: 1fr; min-height: auto; }
    .pico-report-panel { max-height: none; }
    .pico-terminal-body { max-height: 300px; }
    .pico-2col         { grid-template-columns: 1fr; }
    .pico-2col-sm      { grid-template-columns: 1fr; }
  }

  /* ── Tablet (641–900px) ── */
  @media (min-width: 641px) and (max-width: 900px) {
    .pico-split        { grid-template-columns: 1fr; min-height: auto; }
    .pico-report-panel { max-height: none; }
    .pico-terminal-body { max-height: 320px; }
    .pico-2col         { grid-template-columns: 1fr 1fr; }
    .pico-2col-sm      { grid-template-columns: 1fr; }
  }

  /* PDF-only styles (used in downloadPDF) */
`;

export default function PICOSearchSimulator() {
  const [step, setStep]           = useState(1);
  const [picoP, setPicoP]         = useState('');
  const [picoI, setPicoI]         = useState('');
  const [picoC, setPicoC]         = useState('');
  const [picoO, setPicoO]         = useState('');
  const [termData, setTermData]   = useState(null);
  const [stringBus, setStringBus] = useState('');
  const [loadingT, setLoadingT]   = useState(false);
  const [termText, setTermText]   = useState('');
  const [searching, setSearching] = useState(false);
  const [report, setReport]       = useState(null);
  const [error, setError]         = useState(null);
  const [copied, setCopied]       = useState(false);
  const terminalRef               = useRef(null);
  const hitSepRef                 = useRef(false);

  const copyString = useCallback(() => {
    const text = stringBus || (termData?.string_busqueda) || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stringBus, termData]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [termText]);

  const canStep1 = picoP.trim() && picoI.trim() && picoO.trim();

  const generarTerminos = async () => {
    if (!canStep1) return;
    setLoadingT(true); setError(null);
    try {
      const { data } = await api.post('/auth/pico-terminos', { p: picoP, i: picoI, c: picoC, o: picoO });
      setTermData(data);
      setStringBus(data.string_busqueda || '');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar términos de búsqueda.');
    } finally {
      setLoadingT(false);
    }
  };

  const ejecutarBusqueda = async () => {
    setSearching(true);
    setTermText('');
    setReport(null);
    setError(null);
    hitSepRef.current = false;
    setStep(3);

    const token   = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || '/api';

    try {
      const res = await fetch(`${baseURL}/auth/pico-buscar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ p: picoP, i: picoI, c: picoC, o: picoO, string_busqueda: stringBus, terminos_mesh: termData?.terminos_mesh || [] }),
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { setSearching(false); return; }
          try {
            const evt = JSON.parse(raw);
            if (evt.error) { setError(evt.error); setSearching(false); return; }
            if (evt.text && !hitSepRef.current) {
              const sepIdx = evt.text.indexOf('===INFORME_JSON===');
              if (sepIdx >= 0) {
                hitSepRef.current = true;
                const before = evt.text.slice(0, sepIdx);
                if (before) setTermText(p => p + before);
              } else {
                setTermText(p => p + evt.text);
              }
            }
            if (evt.report) {
              setReport(evt.report);
              setStep(4);
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setStep(1); setTermData(null); setReport(null); setTermText('');
    setError(null); setPicoP(''); setPicoI(''); setPicoC(''); setPicoO('');
    setStringBus(''); hitSepRef.current = false;
  };

  const downloadPDF = () => {
    if (!report) return;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const grado = GRADO_CFG[report.grado_recomendacion] || GRADO_CFG.D;

    const estudiosHTML = (report.estudios || []).filter(e => e.incluido).map((e, idx) => {
      const ev = EVIDENCIA_CFG[e.calidad_evidencia] || EVIDENCIA_CFG['baja'];
      return `<div class="estudio">
        <div class="estudio-head">
          <span class="estudio-num">${idx + 1}</span>
          <div style="flex:1">
            <div class="estudio-titulo">${e.titulo}</div>
            <div class="estudio-meta">${e.autores} · ${e.revista} · ${e.anio}</div>
            <div class="estudio-badges">
              <span class="badge" style="background:${ev.bg};color:${ev.color}">${TIPO_LABEL[e.tipo_estudio] || e.tipo_estudio}</span>
              <span class="badge" style="background:${ev.bg};color:${ev.color}">Evidencia ${ev.label}</span>
              ${e.pmid ? `<span class="badge" style="background:#f1f5f9;color:#475569">PMID: ${e.pmid}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="estudio-hallazgo">${e.resumen_hallazgo}</div>
        <div class="estudio-links">
          ${e.enlace_pubmed ? `<a href="${e.enlace_pubmed}" target="_blank">PubMed</a>` : ''}
          ${e.enlace_doi    ? `<a href="${e.enlace_doi}"    target="_blank">DOI</a>` : ''}
        </div>
      </div>`;
    }).join('');

    const inclHTML  = (report.criterios_inclusion   || []).map(c => `<li class="inc">&#10003; ${c}</li>`).join('');
    const exclHTML  = (report.criterios_exclusion    || []).map(c => `<li class="exc">&#10007; ${c}</li>`).join('');
    const implHTML  = (report.implicaciones_clinicas || []).map((c, i) => `<li><span class="num">${i+1}</span>${c}</li>`).join('');
    const limitHTML = (report.limitaciones           || []).map(c => `<li>${c}</li>`).join('');
    const termLog   = termText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Busqueda PICO - Informe de Evidencia</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}@page{margin:1.5cm}
body{font-family:'Georgia',serif;color:#1e293b;font-size:10pt;padding:.5cm;line-height:1.6}
.header{border-bottom:4px solid #1d4ed8;padding-bottom:1rem;margin-bottom:1.2rem}
.title{font-size:18pt;font-weight:bold;color:#1d4ed8}
.sub{font-size:9.5pt;color:#64748b;margin-top:.2rem}
.meta{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:.6rem;font-size:8.5pt;color:#475569}
.pico-grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin:1rem 0}
.pico-card{border-radius:6px;padding:.5rem .75rem}
.pico-letter{font-size:11pt;font-weight:bold;margin-bottom:.1rem}
.pico-text{font-size:9pt;color:#334155}
.pregunta{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.9rem;font-size:10pt;font-style:italic;color:#1e40af;margin:1rem 0;line-height:1.7}
.evidence-bar{display:flex;align-items:center;gap:1.5rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.9rem 1.2rem;margin:1rem 0}
.grado-circle{width:70px;height:70px;border-radius:50%;border:3px solid ${grado.color};background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
.grado-letter{font-size:22pt;font-weight:bold;color:${grado.color};line-height:1}
.grado-sub{font-size:7.5pt;color:${grado.color};font-family:monospace}
.nivel{font-size:13pt;font-weight:bold;color:#1d4ed8}
.nivel-desc{font-size:9pt;color:#64748b;margin-top:.2rem}
.grado-desc{font-size:9pt;color:#475569;margin-top:.4rem;max-width:400px}
.section{margin:1rem 0}
.section-title{font-size:11pt;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #e2e8f0;padding-bottom:.3rem;margin-bottom:.7rem}
.resumen{font-size:10pt;line-height:1.75;color:#334155}
.estudio{border:1px solid #e2e8f0;border-radius:6px;padding:.7rem .9rem;margin-bottom:.6rem;break-inside:avoid}
.estudio-head{display:flex;gap:.7rem;align-items:flex-start;margin-bottom:.3rem}
.estudio-num{background:#1d4ed8;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:8.5pt;font-weight:bold;flex-shrink:0;margin-top:.1rem}
.estudio-titulo{font-weight:bold;font-size:9.5pt;color:#1e293b;line-height:1.4}
.estudio-meta{font-size:8.5pt;color:#64748b;margin-top:.15rem;font-style:italic}
.estudio-badges{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.3rem}
.badge{font-size:7.5pt;padding:.12rem .4rem;border-radius:3px;font-family:monospace}
.estudio-hallazgo{font-size:9pt;color:#334155;margin:.4rem 0;line-height:1.5;border-left:2px solid #bfdbfe;padding-left:.5rem}
.estudio-links{display:flex;gap:.7rem;font-size:8pt}
.estudio-links a{color:#1d4ed8}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.inc{color:#166534;font-size:9.5pt;padding:.15rem 0}
.exc{color:#991b1b;font-size:9.5pt;padding:.15rem 0}
ul{list-style:none}
.impl-list{list-style:none;display:flex;flex-direction:column;gap:.4rem}
.impl-list li{display:flex;gap:.5rem;font-size:9.5pt;line-height:1.5}
.num{background:#1d4ed8;color:#fff;border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:7.5pt;font-weight:bold;flex-shrink:0;margin-top:.2rem}
.conclusion{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:.9rem;font-size:10pt;line-height:1.75;color:#14532d;margin:1rem 0}
.terminal{background:#0d1117;border-radius:6px;padding:.8rem 1rem;font-family:monospace;font-size:7.5pt;color:#7ee787;line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:280px;overflow:hidden;margin-top:.5rem}
.prompt-box{background:#0d1117;border-radius:6px;padding:.85rem 1rem;font-family:monospace;font-size:8.5pt;line-height:1.6}
.footer{margin-top:1.5rem;padding-top:.7rem;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  <div class="title">Informe de Busqueda Bibliografica Sistematica</div>
  <div class="sub">Metodologia PICO - Medicina Basada en Evidencia</div>
  <div class="meta"><span>Fecha: ${fecha}</span><span>Estudios incluidos: ${report.total_incluidos}</span><span>Encontrados: ${report.total_estudios_encontrados}</span></div>
</div>
<div class="section"><div class="section-title">Pregunta PICO</div>
<div class="pico-grid">
  <div class="pico-card" style="background:#eff6ff;border:1px solid #bfdbfe"><div class="pico-letter" style="color:#1d4ed8">P - Paciente/Problema</div><div class="pico-text">${picoP}</div></div>
  <div class="pico-card" style="background:#f0fdf4;border:1px solid #bbf7d0"><div class="pico-letter" style="color:#16a34a">I - Intervencion</div><div class="pico-text">${picoI}</div></div>
  <div class="pico-card" style="background:#fffbeb;border:1px solid #fde68a"><div class="pico-letter" style="color:#d97706">C - Comparacion</div><div class="pico-text">${picoC || 'No especificado'}</div></div>
  <div class="pico-card" style="background:#faf5ff;border:1px solid #ddd6fe"><div class="pico-letter" style="color:#7c3aed">O - Resultado</div><div class="pico-text">${picoO}</div></div>
</div>
<div class="pregunta">${report.pregunta_estructurada}</div></div>
<div class="evidence-bar">
  <div class="grado-circle"><span class="grado-letter">${report.grado_recomendacion}</span><span class="grado-sub">GRADO</span></div>
  <div><div class="nivel">Nivel de evidencia: ${report.nivel_evidencia_global}</div><div class="nivel-desc">Oxford Centre for Evidence-Based Medicine (CEBM)</div><div class="grado-desc">${grado.desc}</div></div>
</div>
<div class="section"><div class="section-title">Resumen ejecutivo</div><div class="resumen">${report.resumen_ejecutivo}</div></div>
<div class="conclusion">${report.conclusion_principal}</div>
<div class="section"><div class="section-title">Estudios incluidos</div>${estudiosHTML}</div>
<div class="section"><div class="section-title">Criterios aplicados</div>
<div class="two-col">
<div><div style="font-size:10pt;font-weight:bold;color:#16a34a;margin-bottom:.4rem">Inclusion</div><ul>${inclHTML}</ul></div>
<div><div style="font-size:10pt;font-weight:bold;color:#dc2626;margin-bottom:.4rem">Exclusion</div><ul>${exclHTML}</ul></div>
</div></div>
<div class="section"><div class="section-title">Implicaciones clinicas</div><ul class="impl-list">${implHTML}</ul></div>
<div class="section"><div class="section-title">Limitaciones</div><ul style="padding-left:1rem;font-size:9.5pt;color:#475569">${limitHTML}</ul></div>
<div class="section"><div class="section-title">Estrategia de busqueda reproducible</div>
<div class="prompt-box">
  <div style="margin-bottom:.5rem"><span style="color:#79c0ff;font-family:monospace;font-weight:bold">P</span> = <span style="color:#e6edf3">${picoP}</span></div>
  <div style="margin-bottom:.5rem"><span style="color:#7ee787;font-family:monospace;font-weight:bold">I</span> = <span style="color:#e6edf3">${picoI}</span></div>
  <div style="margin-bottom:.5rem"><span style="color:#ffa657;font-family:monospace;font-weight:bold">C</span> = <span style="color:#e6edf3">${picoC || 'No especificado'}</span></div>
  <div style="margin-bottom:.75rem"><span style="color:#d2a8ff;font-family:monospace;font-weight:bold">O</span> = <span style="color:#e6edf3">${picoO}</span></div>
  <div style="border-top:1px solid #30363d;padding-top:.5rem;margin-bottom:.5rem;font-size:8pt;color:#8b949e">// Términos MeSH</div>
  <div style="color:#ffa657;margin-bottom:.75rem">${(termData?.terminos_mesh || []).join(' · ')}</div>
  <div style="border-top:1px solid #30363d;padding-top:.5rem;margin-bottom:.5rem;font-size:8pt;color:#8b949e">// String booleano</div>
  <div style="color:#7ee787;word-break:break-all">${stringBus || termData?.string_busqueda || ''}</div>
</div></div>
<div class="section"><div class="section-title">Log de busqueda (consola)</div><div class="terminal">${termLog}</div></div>
<div class="footer">Generado con IA - Busqueda PICO - SEGEDU - ${fecha}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (win) { win.document.write(html); win.document.close(); }
  };

  // ── Terminal líneas coloreadas ─────────────────────────────────────────────
  const termLines = termText.split('\n').map((line, i) => {
    let color = '#e6edf3';
    if      (line.startsWith('[COMPLETE]') || line.startsWith('[+]'))                                                     color = '#3fb950';
    else if (line.startsWith('[EXCLUIDO]') || line.startsWith('[ERROR]'))                                                 color = '#f85149';
    else if (line.startsWith('[GRADE]')    || line.startsWith('[REC]') || line.startsWith('[QUALITY]'))                   color = '#d2a8ff';
    else if (line.startsWith('[PICO]'))                                                                                   color = '#79c0ff';
    else if (line.startsWith('[MESH]')     || line.startsWith('[BOOL]'))                                                  color = '#ffa657';
    else if (line.startsWith('[DB:'))                                                                                     color = '#58a6ff';
    else if (line.startsWith('[RESULT]')   || line.startsWith('[INCLUSION]') || line.startsWith('[EXCLUSION]'))           color = '#e3b341';
    else if (line.startsWith('  →')        || line.startsWith('  [+]') || line.startsWith('  ✓') || line.startsWith('  ✗')) color = '#8b949e';
    return <span key={i} style={{ color, display: 'block' }}>{line}</span>;
  });

  const grado = GRADO_CFG[report?.grado_recomendacion] || GRADO_CFG.D;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{RESPONSIVE_CSS}</style>

      {/* ── Stepper ── */}
      <div className="pico-stepper">
        {STEPS.map((s, i) => {
          const done   = step > s.id;
          const active = step === s.id;
          const color  = done ? '#16a34a' : active ? '#1d4ed8' : '#cbd5e1';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#16a34a' : active ? '#1d4ed8' : '#f1f5f9', border: `2px solid ${color}`, display: 'grid', placeItems: 'center', fontSize: '.8rem', color: done || active ? '#fff' : '#94a3b8', fontWeight: 700, transition: 'all .2s', flexShrink: 0 }}>
                  {done ? '✓' : s.id}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color, fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{s.label}</span>
                  <span className="pico-step-desc">{s.desc}</span>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="pico-step-connector" style={{ background: done ? '#16a34a' : '#e2e8f0' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 1 ═══ */}
      {step === 1 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <p style={{ fontSize: '.9rem', color: 'var(--ink-light)', lineHeight: 1.7 }}>
            Complete los componentes PICO para estructurar su pregunta de búsqueda clínica. Los campos <strong>P, I y O</strong> son obligatorios.
          </p>

          {Object.entries(PICO_CONFIG).map(([key, cfg]) => {
            const val = key === 'P' ? picoP : key === 'I' ? picoI : key === 'C' ? picoC : picoO;
            const set = key === 'P' ? setPicoP : key === 'I' ? setPicoI : key === 'C' ? setPicoC : setPicoO;
            return (
              <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '1rem' }}>
                <label style={{ ...labelSt, color: cfg.color, fontSize: '.75rem' }}>{cfg.label}</label>
                <textarea rows={2} style={{ ...inputSt, borderColor: cfg.border, minHeight: 56 }}
                  placeholder={cfg.placeholder} value={val} onChange={e => set(e.target.value)} />
              </div>
            );
          })}

          {error && <p style={{ fontSize: '.85rem', color: '#dc2626', background: '#fee2e2', padding: '.75rem 1rem', borderRadius: 6 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{ padding: '.7rem 1.75rem', background: canStep1 ? '#1d4ed8' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: canStep1 ? 'pointer' : 'not-allowed' }}
              onClick={generarTerminos} disabled={!canStep1 || loadingT}
            >
              {loadingT ? 'Generando términos...' : 'Generar términos de búsqueda →'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 ═══ */}
      {step === 2 && termData && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Pregunta estructurada</div>
            <p style={{ fontSize: '.9rem', fontStyle: 'italic', color: '#1e40af', lineHeight: 1.65 }}>{termData.pregunta_estructurada}</p>
          </div>

          <div>
            <label style={labelSt}>Términos MeSH identificados</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {(termData.terminos_mesh || []).map((t, i) => (
                <span key={i} style={{ background: '#1d4ed8', color: '#fff', padding: '.2rem .65rem', borderRadius: 4, fontFamily: 'var(--mono)', fontSize: '.78rem' }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <label style={labelSt}>Sinónimos por componente</label>
            <div className="pico-2col-sm">
              {Object.entries(termData.sinonimos || {}).map(([k, terms]) => {
                const cfg = PICO_CONFIG[k];
                if (!cfg || !terms?.length) return null;
                return (
                  <div key={k} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '.6rem .85rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: cfg.color, fontWeight: 700, marginBottom: '.3rem' }}>{k}</div>
                    <div style={{ fontSize: '.82rem', color: '#475569', lineHeight: 1.6 }}>{terms.join(' · ')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelSt}>String de búsqueda (editable)</label>
            <textarea rows={3} style={{ ...inputSt, fontFamily: 'var(--mono)', fontSize: '.82rem', background: '#f8fafc' }}
              value={stringBus} onChange={e => setStringBus(e.target.value)} />
          </div>

          <div>
            <label style={labelSt}>Bases de datos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {(termData.bases_datos || []).map((b, i) => (
                <span key={i} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '.2rem .65rem', borderRadius: 4, fontFamily: 'var(--mono)', fontSize: '.78rem' }}>{b}</span>
              ))}
            </div>
          </div>

          {termData.filtros_sugeridos?.length > 0 && (
            <div>
              <label style={labelSt}>Filtros sugeridos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {termData.filtros_sugeridos.map((f, i) => (
                  <span key={i} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '.2rem .65rem', borderRadius: 4, fontSize: '.78rem' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: '.85rem', color: '#dc2626', background: '#fee2e2', padding: '.75rem 1rem', borderRadius: 6 }}>{error}</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button style={{ padding: '.65rem 1.25rem', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '.85rem', cursor: 'pointer' }} onClick={() => setStep(1)}>← Volver</button>
            <button style={{ padding: '.7rem 1.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: '.85rem', cursor: 'pointer' }} onClick={ejecutarBusqueda}>
              Ejecutar búsqueda con IA →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3 / 4 ═══ */}
      {(step === 3 || step === 4) && (
        <div className="pico-split">

          {/* ── Terminal ── */}
          <div className="pico-terminal-panel">
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Consola de búsqueda</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: '#21262d', padding: '.5rem .75rem', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #30363d' }}>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#8b949e', marginLeft: '.25rem' }}>pico-search — bash</span>
                {searching   && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#3fb950' }}>● EJECUTANDO</span>}
                {!searching && termText && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#8b949e' }}>COMPLETADO</span>}
              </div>
              <div ref={terminalRef} className="pico-terminal-body">
                {termText ? termLines : <span style={{ color: '#8b949e' }}>Esperando ejecución de búsqueda...</span>}
                {searching && <span style={{ color: '#3fb950' }}>▌</span>}
              </div>
            </div>
          </div>

          {/* ── Informe ── */}
          <div className="pico-report-panel">
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Informe de evidencia</div>

            {!report && searching && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: '1rem', color: '#94a3b8' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: 'var(--mono)', fontSize: '.82rem' }}>Analizando evidencia científica...</p>
              </div>
            )}

            {error && !report && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '1rem' }}>
                <p style={{ fontSize: '.85rem', color: '#dc2626' }}>{error}</p>
                <button style={{ marginTop: '.75rem', padding: '.5rem 1rem', background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, fontSize: '.82rem', cursor: 'pointer' }} onClick={() => { setStep(2); setError(null); }}>← Volver a términos</button>
              </div>
            )}

            {report && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '.85rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>Pregunta estructurada</div>
                  <p style={{ fontSize: '.85rem', fontStyle: 'italic', color: '#1e40af', lineHeight: 1.65 }}>{report.pregunta_estructurada}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: `3px solid ${grado.color}`, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: grado.color, lineHeight: 1 }}>{report.grado_recomendacion}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '.55rem', color: grado.color }}>GRADO</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '.9rem' }}>Nivel {report.nivel_evidencia_global} — Oxford CEBM</div>
                    <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: '.15rem', lineHeight: 1.5 }}>{grado.desc}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Resumen ejecutivo</div>
                  <p style={{ fontSize: '.85rem', color: '#334155', lineHeight: 1.7 }}>{report.resumen_ejecutivo}</p>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>
                    Estudios incluidos ({(report.estudios || []).filter(e => e.incluido).length} de {report.total_estudios_encontrados} encontrados)
                  </div>
                  <div style={{ display: 'grid', gap: '.6rem' }}>
                    {(report.estudios || []).filter(e => e.incluido).map((e, idx) => {
                      const ev = EVIDENCIA_CFG[e.calidad_evidencia] || EVIDENCIA_CFG['baja'];
                      return (
                        <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem', borderLeft: `3px solid ${ev.color}` }}>
                          <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#1e293b', lineHeight: 1.4, marginBottom: '.25rem' }}>{e.titulo}</div>
                          <div style={{ fontSize: '.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '.35rem' }}>{e.autores} · {e.revista} · {e.anio}</div>
                          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                            <span style={{ background: ev.bg, color: ev.color, padding: '.1rem .45rem', borderRadius: 3, fontFamily: 'var(--mono)', fontSize: '.7rem' }}>{ev.label}</span>
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '.1rem .45rem', borderRadius: 3, fontFamily: 'var(--mono)', fontSize: '.7rem' }}>{TIPO_LABEL[e.tipo_estudio] || e.tipo_estudio}</span>
                            {e.pmid && <span style={{ background: '#f1f5f9', color: '#475569', padding: '.1rem .45rem', borderRadius: 3, fontFamily: 'var(--mono)', fontSize: '.7rem' }}>PMID {e.pmid}</span>}
                          </div>
                          <p style={{ fontSize: '.8rem', color: '#334155', lineHeight: 1.55, marginBottom: '.35rem', borderLeft: '2px solid #bfdbfe', paddingLeft: '.5rem' }}>{e.resumen_hallazgo}</p>
                          <div style={{ display: 'flex', gap: '.75rem' }}>
                            {e.enlace_pubmed && <a href={e.enlace_pubmed} target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: '#1d4ed8', textDecoration: 'none' }}>↗ PubMed</a>}
                            {e.enlace_doi    && <a href={e.enlace_doi}    target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: '#1d4ed8', textDecoration: 'none' }}>↗ DOI</a>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '.85rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>Conclusión clínica</div>
                  <p style={{ fontSize: '.85rem', color: '#14532d', lineHeight: 1.7 }}>{report.conclusion_principal}</p>
                </div>

                {report.implicaciones_clinicas?.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Implicaciones clínicas</div>
                    <div style={{ display: 'grid', gap: '.4rem' }}>
                      {report.implicaciones_clinicas.map((imp, i) => (
                        <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1d4ed8', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '.65rem', fontWeight: 700, flexShrink: 0, marginTop: '.1rem' }}>{i+1}</div>
                          <p style={{ fontSize: '.83rem', color: '#334155', lineHeight: 1.55 }}>{imp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pico-2col">
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '.7rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.67rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Inclusión</div>
                    {(report.criterios_inclusion || []).map((c, i) => <p key={i} style={{ fontSize: '.78rem', color: '#166534', lineHeight: 1.5 }}>✓ {c}</p>)}
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '.7rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.67rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Exclusión</div>
                    {(report.criterios_exclusion || []).map((c, i) => <p key={i} style={{ fontSize: '.78rem', color: '#991b1b', lineHeight: 1.5 }}>✗ {c}</p>)}
                  </div>
                </div>

                {report.limitaciones?.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '.7rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.67rem', color: '#d97706', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Limitaciones</div>
                    {report.limitaciones.map((l, i) => <p key={i} style={{ fontSize: '.78rem', color: '#92400e', lineHeight: 1.5 }}>• {l}</p>)}
                  </div>
                )}

                {/* ── Estrategia reproducible ── */}
                <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .85rem', background: '#161b22', borderBottom: '1px solid #30363d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '.06em' }}>Estrategia de búsqueda reproducible</span>
                      <span style={{ background: '#1d4ed8', color: '#fff', fontFamily: 'var(--mono)', fontSize: '.6rem', padding: '.1rem .4rem', borderRadius: 3 }}>PROMPT</span>
                    </div>
                    <button
                      onClick={copyString}
                      style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: copied ? '#16a34a' : '#21262d', color: copied ? '#fff' : '#8b949e', border: `1px solid ${copied ? '#16a34a' : '#30363d'}`, borderRadius: 5, padding: '.3rem .7rem', fontFamily: 'var(--mono)', fontSize: '.7rem', cursor: 'pointer', transition: 'all .2s' }}
                    >
                      {copied ? '✓ Copiado' : '⎘ Copiar'}
                    </button>
                  </div>

                  <div style={{ padding: '.85rem 1rem', display: 'grid', gap: '.65rem' }}>
                    {/* PICO components */}
                    <div style={{ display: 'grid', gap: '.3rem' }}>
                      {[
                        { letter: 'P', color: '#79c0ff', label: 'Paciente/Problema', val: picoP },
                        { letter: 'I', color: '#7ee787', label: 'Intervención',       val: picoI },
                        { letter: 'C', color: '#ffa657', label: 'Comparación',        val: picoC || 'No especificado' },
                        { letter: 'O', color: '#d2a8ff', label: 'Outcome',            val: picoO },
                      ].map(({ letter, color, label, val }) => (
                        <div key={letter} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color, fontWeight: 700, flexShrink: 0, width: 16 }}>{letter}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#6e7681' }}>=</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: '#e6edf3', lineHeight: 1.5 }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ height: 1, background: '#21262d' }} />

                    {/* MeSH terms */}
                    {termData?.terminos_mesh?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#6e7681', marginBottom: '.3rem' }}>// Términos MeSH</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: '#ffa657', lineHeight: 1.6, wordBreak: 'break-word' }}>
                          {termData.terminos_mesh.join(' · ')}
                        </div>
                      </div>
                    )}

                    {/* Boolean string */}
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#6e7681', marginBottom: '.3rem' }}>// String booleano</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: '#7ee787', lineHeight: 1.7, wordBreak: 'break-all', background: '#0d1117', padding: '.5rem .7rem', borderRadius: 5, border: '1px solid #21262d' }}>
                        {stringBus || termData?.string_busqueda || '—'}
                      </div>
                    </div>

                    {/* Bases de datos */}
                    {termData?.bases_datos?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#6e7681', marginBottom: '.3rem' }}>// Bases de datos</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                          {termData.bases_datos.map((b, i) => (
                            <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: '#58a6ff', background: '#0d2030', border: '1px solid #1c4060', padding: '.15rem .5rem', borderRadius: 3 }}>{b}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ height: 1, background: '#21262d' }} />
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#484f58', lineHeight: 1.6 }}>
                      Puedes copiar este string booleano y ejecutarlo directamente en PubMed, Cochrane, Embase u otros modelos de IA.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'flex-end', paddingTop: '.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <button style={{ padding: '.65rem 1.1rem', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '.82rem', cursor: 'pointer' }} onClick={reset}>Nueva búsqueda</button>
                  <button style={{ padding: '.65rem 1.5rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: '.82rem', cursor: 'pointer' }} onClick={downloadPDF}>Descargar PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
