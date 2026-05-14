import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Evaluación numérica ──────────────────────────────────────────────────────

function compileFn(raw) {
  if (!raw.trim()) return null;
  try {
    let s = raw.trim()
      .replace(/\^/g, '**')
      .replace(/(\d+(?:\.\d+)?)\s*x/g, '$1*x')
      .replace(/\)\s*x/g, ')*x')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\blog10\b/g, 'Math.log10')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/ig, 'Math.PI')
      .replace(/(?<![a-zA-Z\.])e(?![a-zA-Z\*])/g, 'Math.E');
    if (/\b(eval|Function|fetch|import|require|window|document|process)\b/.test(s)) return null;
    return new Function('x', `"use strict"; try { return +(${s}); } catch { return NaN; }`);
  } catch {
    return null;
  }
}

function numDeriv(fn, x) {
  const h = Math.max(1e-8, Math.abs(x) * 1e-7);
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

const rnd = (n, d = 4) => isFinite(n) ? parseFloat(n.toFixed(d)) : n;
const fmt = (n, d = 4) => isFinite(n) ? rnd(n, d).toString() : '∞';
const fmtSigned = (n, d = 4, forceSign = false) => {
  if (!isFinite(n)) return '∞';
  const r = rnd(n, d);
  return forceSign && r >= 0 ? `+${r}` : r.toString();
};

/** y = mx + b formatted nicely */
function lineEq(m, x0, y0) {
  if (!isFinite(m)) return 'Recta vertical';
  const b = y0 - m * x0;
  const mR = rnd(m, 4), bR = rnd(b, 4);
  const mAbs = Math.abs(mR);
  const mPart = mAbs < 1e-9
    ? null
    : (mAbs === 1 ? (mR < 0 ? '−x' : 'x') : `${fmt(mR)}x`);
  const bPart = Math.abs(bR) < 1e-9
    ? null
    : bR > 0 ? `+ ${fmt(bR)}` : `− ${fmt(Math.abs(bR))}`;
  if (!mPart && !bPart) return 'y = 0';
  if (!mPart) return `y = ${bPart.replace(/^[+-] /, bR < 0 ? '−' : '')}`;
  if (!bPart) return `y = ${mPart}`;
  return `y = ${mPart} ${bPart}`;
}

/** Point–slope form display */
function pointSlopeEq(m, x0, y0) {
  if (!isFinite(m)) return 'Recta vertical';
  const y0R = rnd(y0, 4), x0R = rnd(x0, 4), mR = rnd(m, 4);
  const yPart = y0R === 0 ? 'y' : y0R > 0 ? `y − ${y0R}` : `y + ${Math.abs(y0R)}`;
  const xPart = x0R === 0 ? 'x' : x0R > 0 ? `(x − ${x0R})` : `(x + ${Math.abs(x0R)})`;
  const mPart = mR === 1 ? '' : mR === -1 ? '−' : `${mR}·`;
  return `${yPart} = ${mPart}${xPart}`;
}

// ─── Derivada simbólica (polinomios) ─────────────────────────────────────────

function symbolicDeriv(raw) {
  const e = raw.replace(/\s/g, '').replace(/\^/g, '^');

  // Split top-level terms by + / −
  const termStrs = [];
  let buf = '', depth = 0;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (depth === 0 && (c === '+' || c === '-') && i > 0) {
      if (buf) termStrs.push(buf);
      buf = c;
    } else buf += c;
  }
  if (buf) termStrs.push(buf);

  const derived = [];
  for (const raw of termStrs) {
    if (!raw) continue;
    let neg = false, s = raw;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    else if (s[0] === '+') s = s.slice(1);

    // (a/b)*x^n  or  (a/b)x^n
    const r1 = s.match(/^\((\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\)\*?x\^([\-\d\.]+)$/);
    // a*x^n  or  ax^n
    const r2 = s.match(/^(\d+(?:\.\d+)?)\*?x\^([\-\d\.]+)$/);
    // x^n
    const r3 = s.match(/^x\^([\-\d\.]+)$/);
    // (a/b)*x  or  (a/b)x
    const r4 = s.match(/^\((\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\)\*?x$/);
    // a*x  or  ax
    const r5 = s.match(/^(\d+(?:\.\d+)?)\*?x$/);
    // bare x
    const r6 = s === 'x';
    // constant
    const r7 = s.match(/^\d+(?:\.\d+)?$/);

    let coef, exp;
    if (r1)      { coef = parseFloat(r1[1]) / parseFloat(r1[2]); exp = parseFloat(r1[3]); }
    else if (r2) { coef = parseFloat(r2[1]); exp = parseFloat(r2[2]); }
    else if (r3) { coef = 1; exp = parseFloat(r3[1]); }
    else if (r4) { coef = parseFloat(r4[1]) / parseFloat(r4[2]); exp = 1; }
    else if (r5) { coef = parseFloat(r5[1]); exp = 1; }
    else if (r6) { coef = 1; exp = 1; }
    else if (r7) { coef = parseFloat(r7[0]); exp = 0; }
    else return null; // can't parse → no symbolic

    if (neg) coef = -coef;

    const dc = coef * exp;
    const de = exp - 1;
    if (Math.abs(dc) > 1e-12) derived.push({ c: dc, e: de });
  }

  if (derived.length === 0) return "f'(x) = 0";

  const parts = derived.map((t, i) => {
    const { c, e } = t;
    const cR = rnd(c, 6), eR = rnd(e, 6);
    const cAbs = Math.abs(cR);
    let base;
    if (Math.abs(eR) < 1e-9)      base = `${cAbs}`;
    else if (Math.abs(eR - 1) < 1e-9) base = cAbs === 1 ? 'x' : `${cAbs}x`;
    else                            base = cAbs === 1 ? `x^${eR}` : `${cAbs}x^${eR}`;
    if (i === 0) return cR < 0 ? `−${base}` : base;
    return cR < 0 ? ` − ${base}` : ` + ${base}`;
  });

  return `f'(x) = ${parts.join('')}`;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function niceStep(raw) {
  if (raw <= 0 || !isFinite(raw)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const s = raw / mag;
  if (s < 1.5) return mag;
  if (s < 3.5) return 2 * mag;
  if (s < 7.5) return 5 * mag;
  return 10 * mag;
}

function drawGraph(canvas, fn, x0, y0, slope, xSpan) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 28, right: 24, bottom: 36, left: 44 };
  const PW = W - PAD.left - PAD.right;
  const PH = H - PAD.top - PAD.bottom;

  const xMin = x0 - xSpan / 2;
  const xMax = x0 + xSpan / 2;
  const normalSlope = Math.abs(slope) > 1e-9 ? -1 / slope : Infinity;

  // Sample points
  const N = 400;
  let yMin = Infinity, yMax = -Infinity;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (xMax - xMin) * (i / N);
    const y = fn(x);
    pts.push([x, y]);
    if (isFinite(y)) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
  }
  // Include lines at viewport edges
  [xMin, xMax].forEach(x => {
    const yt = slope * (x - x0) + y0;
    if (isFinite(yt)) { yMin = Math.min(yMin, yt); yMax = Math.max(yMax, yt); }
    if (isFinite(normalSlope)) {
      const yn = normalSlope * (x - x0) + y0;
      if (isFinite(yn)) { yMin = Math.min(yMin, yn); yMax = Math.max(yMax, yn); }
    }
  });
  if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) { yMin = -5; yMax = 5; }
  const yPad = (yMax - yMin) * 0.18 + 1;
  yMin -= yPad; yMax += yPad;

  const tx = x => PAD.left + (x - xMin) / (xMax - xMin) * PW;
  const ty = y => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * PH;

  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // Grid
  const xStep = niceStep((xMax - xMin) / 8);
  const yStep = niceStep((yMax - yMin) / 7);

  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    ctx.beginPath(); ctx.moveTo(tx(x), PAD.top); ctx.lineTo(tx(x), H - PAD.bottom); ctx.stroke();
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    ctx.beginPath(); ctx.moveTo(PAD.left, ty(y)); ctx.lineTo(W - PAD.right, ty(y)); ctx.stroke();
  }

  // Axis ticks + labels
  ctx.fillStyle = 'rgba(255,255,255,.38)';
  ctx.font = '10px monospace';
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    ctx.textAlign = 'center';
    ctx.fillText(rnd(x, 2), tx(x), H - PAD.bottom + 14);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    ctx.textAlign = 'right';
    ctx.fillText(rnd(y, 2), PAD.left - 5, ty(y) + 4);
  }

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,.28)';
  ctx.lineWidth = 1.5; ctx.setLineDash([]);
  if (yMin < 0 && yMax > 0) {
    ctx.beginPath(); ctx.moveTo(PAD.left, ty(0)); ctx.lineTo(W - PAD.right, ty(0)); ctx.stroke();
  }
  if (xMin < 0 && xMax > 0) {
    ctx.beginPath(); ctx.moveTo(tx(0), PAD.top); ctx.lineTo(tx(0), H - PAD.bottom); ctx.stroke();
  }

  // Normal line
  if (isFinite(normalSlope)) {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(tx(xMin), ty(normalSlope * (xMin - x0) + y0));
    ctx.lineTo(tx(xMax), ty(normalSlope * (xMax - x0) + y0));
    ctx.stroke();
  }

  // Tangent line
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 4]);
  ctx.beginPath();
  ctx.moveTo(tx(xMin), ty(slope * (xMin - x0) + y0));
  ctx.lineTo(tx(xMax), ty(slope * (xMax - x0) + y0));
  ctx.stroke();

  ctx.setLineDash([]);

  // f(x) curve
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let pen = false;
  const clip = (yMax - yMin) * 2;
  for (const [x, y] of pts) {
    if (!isFinite(y) || y < yMin - clip || y > yMax + clip) { pen = false; continue; }
    if (!pen) { ctx.moveTo(tx(x), ty(y)); pen = true; } else ctx.lineTo(tx(x), ty(y));
  }
  ctx.stroke();

  // Point P
  const px0 = tx(x0), py0 = ty(y0);
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px0, py0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Label
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`P(${rnd(x0, 2)}, ${rnd(y0, 2)})`, px0 + 11, py0 - 8);

  // Legend
  const leg = [
    { color: '#f1f5f9', label: 'f(x)', dash: false },
    { color: '#fbbf24', label: 'Tangente', dash: true },
    { color: '#60a5fa', label: 'Normal', dash: true },
  ];
  let lx = PAD.left + 6, ly = PAD.top + 14;
  leg.forEach(item => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(item.dash ? [5, 3] : []);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, lx + 22, ly + 4);
    lx += 86;
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

const EXAMPLES = [
  { label: '(1/4)x³ − 2x', expr: '(1/4)*x^3 - 2*x', x0: 2 },
  { label: 'x² − 3x + 2',  expr: 'x^2 - 3*x + 2',   x0: 1 },
  { label: 'sin(x)',         expr: 'sin(x)',            x0: 0 },
  { label: 'x³ − x',        expr: 'x^3 - x',          x0: 1 },
  { label: 'e^x',            expr: 'exp(x)',            x0: 0 },
  { label: 'ln(x)',          expr: 'ln(x)',             x0: 1 },
];

const STEP_COLORS = ['#f59e0b', '#34d399', '#60a5fa', '#c084fc'];

export default function DerivadaSimulator() {
  const [expr, setExpr]   = useState('(1/4)*x^3 - 2*x');
  const [x0Str, setX0Str] = useState('2');
  const [xSpan, setXSpan] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError]  = useState('');
  const [activeStep, setActiveStep] = useState(null);
  const canvasRef = useRef(null);

  const compute = useCallback(() => {
    setError('');
    const fn = compileFn(expr);
    if (!fn) { setError('Expresión inválida. Revise la función ingresada.'); setResult(null); return; }

    const x0 = parseFloat(x0Str);
    if (!isFinite(x0)) { setError('El valor de x₀ debe ser un número válido.'); setResult(null); return; }

    const y0 = fn(x0);
    if (!isFinite(y0)) { setError(`f(${x0}) no está definida o es infinita.`); setResult(null); return; }

    const slope = numDeriv(fn, x0);
    if (!isFinite(slope)) { setError('La derivada no existe en ese punto.'); setResult(null); return; }

    const normalSlope = Math.abs(slope) > 1e-9 ? -1 / slope : Infinity;
    const symStr = symbolicDeriv(expr);

    setResult({
      fn, x0, y0: rnd(y0, 6), slope: rnd(slope, 6),
      normalSlope: isFinite(normalSlope) ? rnd(normalSlope, 6) : Infinity,
      symStr,
      tangentEq: lineEq(slope, x0, y0),
      normalEq:  isFinite(normalSlope) ? lineEq(normalSlope, x0, y0) : 'Recta vertical (pendiente ∞)',
      tangentPtSlope: pointSlopeEq(slope, x0, y0),
      normalPtSlope:  isFinite(normalSlope) ? pointSlopeEq(normalSlope, x0, y0) : 'x = ' + x0,
    });
    setActiveStep(null);
  }, [expr, x0Str]);

  // Auto-compute on mount
  useEffect(() => { compute(); }, []); // eslint-disable-line

  // Redraw canvas when result or xSpan changes
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    drawGraph(canvasRef.current, result.fn, result.x0, result.y0, result.slope, xSpan);
  }, [result, xSpan]);

  const loadExample = (ex) => {
    setExpr(ex.expr);
    setX0Str(String(ex.x0));
    setResult(null);
  };

  const steps = result ? [
    {
      label: 'a) Derivada en el punto P',
      color: STEP_COLORS[0],
      content: (
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {result.symStr && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.9rem' }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Derivada simbólica:</span>
              <div style={{ marginTop: '.3rem', fontSize: '1rem', color: '#fde68a' }}>{result.symStr}</div>
            </div>
          )}
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.9rem' }}>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Evaluación numérica:</span>
            <div style={{ marginTop: '.25rem' }}>
              f'(<span style={{ color: '#fbbf24' }}>{result.x0}</span>) = <span style={{ color: '#fde68a', fontSize: '1.15rem', fontWeight: 700 }}>{fmt(result.slope)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'b) Pendiente de la tangente',
      color: STEP_COLORS[1],
      content: (
        <div style={{ fontFamily: 'var(--mono)' }}>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', marginBottom: '.4rem' }}>
            La pendiente es el valor de la derivada en x₀:
          </div>
          <div style={{ fontSize: '1.1rem' }}>
            <span style={{ color: 'rgba(255,255,255,.6)' }}>m = f'(</span>
            <span style={{ color: '#fbbf24' }}>{result.x0}</span>
            <span style={{ color: 'rgba(255,255,255,.6)' }}>) = </span>
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '1.3rem' }}>{fmt(result.slope)}</span>
          </div>
        </div>
      )
    },
    {
      label: 'c) Ecuación de la recta tangente',
      color: STEP_COLORS[2],
      content: (
        <div style={{ display: 'grid', gap: '.55rem', fontFamily: 'var(--mono)' }}>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>Forma punto–pendiente:</div>
          <div style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)' }}>{result.tangentPtSlope}</div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', marginTop: '.2rem' }}>Forma pendiente–intersección:</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#93c5fd' }}>{result.tangentEq}</div>
        </div>
      )
    },
    {
      label: 'd) Ecuación de la recta normal',
      color: STEP_COLORS[3],
      content: (
        <div style={{ display: 'grid', gap: '.55rem', fontFamily: 'var(--mono)' }}>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>
            Pendiente normal: m_n = −1/m = {isFinite(result.normalSlope) ? fmt(result.normalSlope) : '∞'}
          </div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', marginTop: '.2rem' }}>Forma punto–pendiente:</div>
          <div style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)' }}>{result.normalPtSlope}</div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', marginTop: '.2rem' }}>Forma pendiente–intersección:</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c4b5fd' }}>{result.normalEq}</div>
        </div>
      )
    },
  ] : [];

  return (
    <div style={{
      background: '#0d0d1a',
      color: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.08)',
      fontFamily: 'var(--mono, monospace)'
    }}>

      {/* ── Header ─── */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.08)', background: '#111124' }}>
        <div style={{ fontSize: '.62rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.35)', marginBottom: '.3rem' }}>
          SIMULADOR · CÁLCULO DIFERENCIAL
        </div>
        <div style={{ fontFamily: 'var(--serif, serif)', fontSize: '1.05rem', fontWeight: 700 }}>
          Derivada — Tangente y Normal
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: '560px' }}>

        {/* ── Panel izquierdo ─── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,.07)',
          display: 'flex', flexDirection: 'column',
          background: '#0a0a18'
        }}>

          {/* Inputs */}
          <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.9rem' }}>
              PARÁMETROS
            </div>

            <div style={{ marginBottom: '.9rem' }}>
              <label style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: '.35rem' }}>
                f(x) = &nbsp;<span style={{ color: 'rgba(255,255,255,.2)', fontSize: '.65rem' }}>use * para mult., ^ para potencia</span>
              </label>
              <input
                value={expr}
                onChange={e => setExpr(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && compute()}
                style={{
                  width: '100%', padding: '.55rem .75rem',
                  background: '#16162a', border: '1px solid rgba(255,255,255,.12)',
                  color: '#fde68a', fontFamily: 'monospace', fontSize: '.92rem',
                  borderRadius: '3px', outline: 'none', boxSizing: 'border-box'
                }}
                placeholder="(1/4)*x^3 - 2*x"
                spellCheck={false}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: '.35rem' }}>
                x₀ (abscisa del punto P)
              </label>
              <input
                type="number"
                value={x0Str}
                onChange={e => setX0Str(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && compute()}
                step="0.5"
                style={{
                  width: '100%', padding: '.55rem .75rem',
                  background: '#16162a', border: '1px solid rgba(255,255,255,.12)',
                  color: '#a5f3fc', fontFamily: 'monospace', fontSize: '.92rem',
                  borderRadius: '3px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {result && (
              <div style={{
                padding: '.5rem .75rem', background: '#16162a',
                borderRadius: '3px', fontSize: '.78rem', marginBottom: '1rem',
                border: '1px solid rgba(255,255,255,.08)'
              }}>
                <span style={{ color: 'rgba(255,255,255,.4)' }}>y₀ = f(x₀) = </span>
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>{fmt(result.y0)}</span>
                <span style={{ color: 'rgba(255,255,255,.3)', marginLeft: '.5rem' }}>
                  → P = ({fmt(result.x0, 2)}, {fmt(result.y0, 4)})
                </span>
              </div>
            )}

            <button
              onClick={compute}
              style={{
                width: '100%', padding: '.6rem',
                background: '#1e3a5f', border: '1px solid #3b82f6',
                color: '#93c5fd', fontFamily: 'monospace', fontSize: '.82rem',
                borderRadius: '3px', cursor: 'pointer', letterSpacing: '.06em',
                transition: 'background .15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e4080'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e3a5f'}
            >
              ▶ CALCULAR
            </button>

            {error && (
              <div style={{ marginTop: '.75rem', padding: '.55rem .75rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '3px', color: '#fca5a5', fontSize: '.78rem' }}>
                {error}
              </div>
            )}
          </div>

          {/* Ejemplos */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.7rem' }}>
              EJEMPLOS RÁPIDOS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => loadExample(ex)}
                  style={{
                    padding: '.28rem .6rem', background: 'transparent',
                    border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.55)',
                    fontFamily: 'monospace', fontSize: '.72rem', borderRadius: '2px',
                    cursor: 'pointer', transition: 'all .12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.55)'; }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.6rem' }}>
              RANGO DEL GRÁFICO (±{xSpan / 2} unidades desde x₀)
            </div>
            <input
              type="range" min="2" max="40" step="1" value={xSpan}
              onChange={e => setXSpan(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          {/* Resultados resumen */}
          {result && (
            <div style={{ padding: '0 1.25rem 1.25rem', marginTop: 'auto' }}>
              <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.65rem' }}>
                RESUMEN
              </div>
              <div style={{ display: 'grid', gap: '.35rem' }}>
                {[
                  { k: 'Derivada f\'(x₀)', v: fmt(result.slope), c: '#fbbf24' },
                  { k: 'Pendiente (m)', v: fmt(result.slope), c: '#34d399' },
                  { k: 'Tangente', v: result.tangentEq, c: '#93c5fd' },
                  { k: 'Normal', v: result.normalEq, c: '#c4b5fd' },
                ].map(item => (
                  <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', fontSize: '.72rem', padding: '.3rem 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,.38)' }}>{item.k}</span>
                    <span style={{ color: item.c, fontWeight: 700, textAlign: 'right', maxWidth: '140px', wordBreak: 'break-all' }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Panel derecho ─── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Pasos a–d */}
          {result && (
            <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.8rem' }}>
                DESARROLLO PASO A PASO
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {steps.map((step, i) => {
                  const open = activeStep === i;
                  return (
                    <div key={i} style={{ borderRadius: '3px', overflow: 'hidden', border: `1px solid ${step.color}30` }}>
                      <button
                        onClick={() => setActiveStep(open ? null : i)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '.55rem .85rem',
                          background: open ? `${step.color}18` : 'transparent',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: '.65rem', color: step.color,
                          fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: step.color, color: '#000',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '.65rem', fontWeight: 900, flexShrink: 0
                        }}>
                          {['a','b','c','d'][i]}
                        </span>
                        {step.label}
                        <span style={{ marginLeft: 'auto', fontSize: '.7rem', opacity: .5 }}>{open ? '▲' : '▼'}</span>
                      </button>
                      {open && (
                        <div style={{ padding: '.75rem .85rem', background: `${step.color}08`, borderTop: `1px solid ${step.color}20` }}>
                          {step.content}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setActiveStep(activeStep === 4 ? null : 4)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '.55rem .85rem',
                    background: activeStep === 4 ? 'rgba(100,255,180,.08)' : 'transparent',
                    border: '1px solid rgba(100,255,180,.2)', borderRadius: '3px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '.65rem', color: '#6ee7b7',
                    fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700
                  }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6ee7b7', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 900, flexShrink: 0 }}>e</span>
                  e) Gráfico de la función
                  <span style={{ marginLeft: 'auto', fontSize: '.7rem', opacity: .5 }}>{activeStep === 4 ? '▲' : '▼'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Canvas — e) Gráfico */}
          <div style={{ flex: 1, padding: '1rem 1.25rem 1.25rem' }}>
            {!result && !error && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.2)', fontStyle: 'italic', fontSize: '.88rem' }}>
                Ingrese una función y presione Calcular
              </div>
            )}
            {result && (
              <>
                <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', marginBottom: '.7rem' }}>
                  e) GRÁFICO
                </div>
                <canvas
                  ref={canvasRef}
                  width={660}
                  height={340}
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '3px' }}
                />
                <div style={{ marginTop: '.6rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.7rem', color: 'rgba(255,255,255,.35)' }}>
                  <span><span style={{ color: '#f1f5f9' }}>━━</span> f(x)</span>
                  <span><span style={{ color: '#fbbf24' }}>╍╍</span> Tangente</span>
                  <span><span style={{ color: '#60a5fa' }}>╍╍</span> Normal</span>
                  <span><span style={{ color: '#ef4444' }}>●</span> Punto P</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
