import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './LogicCircuitSimulator.css';

// ── Component definitions ─────────────────────────────────────────────────────
// ins/outs: port positions relative to component top-left corner

const DEFS = {
  input:   { label:'Input',   cat:'Input',   w:62, h:34, ins:[],                               outs:[{x:62,y:17}], hasState:true },
  button:  { label:'Button',  cat:'Input',   w:46, h:46, ins:[],                               outs:[{x:46,y:23}], hasState:true },
  power:   { label:'Power',   cat:'Input',   w:48, h:34, ins:[],                               outs:[{x:48,y:17}]               },
  and:     { label:'AND',     cat:'Gates',   w:72, h:52, ins:[{x:0,y:16},{x:0,y:36}],          outs:[{x:72,y:26}]               },
  or:      { label:'OR',      cat:'Gates',   w:74, h:52, ins:[{x:4,y:16},{x:4,y:36}],          outs:[{x:74,y:26}]               },
  not:     { label:'NOT',     cat:'Gates',   w:66, h:36, ins:[{x:0,y:18}],                     outs:[{x:66,y:18}]               },
  xor:     { label:'XOR',     cat:'Gates',   w:80, h:52, ins:[{x:8,y:16},{x:8,y:36}],          outs:[{x:80,y:26}]               },
  nand:    { label:'NAND',    cat:'Gates',   w:80, h:52, ins:[{x:0,y:16},{x:0,y:36}],          outs:[{x:80,y:26}]               },
  nor:     { label:'NOR',     cat:'Gates',   w:82, h:52, ins:[{x:4,y:16},{x:4,y:36}],          outs:[{x:82,y:26}]               },
  xnor:    { label:'XNOR',    cat:'Gates',   w:86, h:52, ins:[{x:8,y:16},{x:8,y:36}],          outs:[{x:86,y:26}]               },
  led:     { label:'Digital LED', cat:'Output', w:46, h:46, ins:[{x:0,y:23}],                  outs:[]                          },
  rgb_led: { label:'RGB LED', cat:'Output',  w:56, h:74, ins:[{x:0,y:18},{x:0,y:37},{x:0,y:56}], outs:[]                       },
};

const PALETTE_ORDER = ['Input','Gates','Output'];

// ── Evaluate gates ────────────────────────────────────────────────────────────

function evalGate(type, inputs) {
  const a = inputs[0] ?? 0, b = inputs[1] ?? 0;
  switch (type) {
    case 'and':  return [a & b];
    case 'or':   return [a | b];
    case 'not':  return [a === 1 ? 0 : 1];
    case 'xor':  return [a ^ b];
    case 'nand': return [(a & b) === 1 ? 0 : 1];
    case 'nor':  return [(a | b) === 1 ? 0 : 1];
    case 'xnor': return [(a ^ b) === 0 ? 1 : 0];
    case 'input':
    case 'button': return [inputs[0] ?? 0]; // driven by state, handled in simulate
    case 'power': return [1];
    case 'led':   return [a];
    case 'rgb_led': return inputs.map(v => v ?? 0);
    default: return [0];
  }
}

// ── Simulation ────────────────────────────────────────────────────────────────

function simulate(components, wires) {
  const wireMap = {};
  wires.forEach(w => { wireMap[`${w.toId}:${w.toPort}`] = w; });

  const vals = {};
  Object.values(components).forEach(c => {
    if (c.type === 'power')  vals[c.id] = [1];
    else if (c.type === 'input' || c.type === 'button') vals[c.id] = [c.state ?? 0];
    else vals[c.id] = Array(Math.max(1, DEFS[c.type]?.outs?.length || 1)).fill(0);
  });

  const comps = Object.values(components);
  for (let iter = 0; iter <= comps.length + 1; iter++) {
    let changed = false;
    comps.forEach(c => {
      const def = DEFS[c.type];
      if (!def || ['power','input','button'].includes(c.type)) return;
      const inVals = def.ins.map((_, pi) => {
        const w = wireMap[`${c.id}:${pi}`];
        return w ? ((vals[w.fromId] ?? [0])[w.fromPort] ?? 0) : 0;
      });
      const newVals = evalGate(c.type, inVals);
      if (JSON.stringify(vals[c.id]) !== JSON.stringify(newVals)) {
        vals[c.id] = newVals;
        changed = true;
      }
    });
    if (!changed) break;
  }
  return vals;
}

// ── Gate SVG shapes ───────────────────────────────────────────────────────────

function GateBody({ type, w, h, isOn }) {
  const fill   = isOn ? '#152a15' : '#1c1c38';
  const stroke = isOn ? '#00e676' : '#5a5a9a';
  const sw = 1.8;
  const tc = isOn ? '#00e676' : '#8888cc';

  switch (type) {
    case 'and': {
      const hw = w / 2;
      return <path d={`M 0,0 L 0,${h} L ${hw},${h} Q ${w},${h} ${w},${h/2} Q ${w},0 ${hw},0 Z`}
                   fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case 'nand': {
      const bw = w - 9;
      const hw = bw / 2;
      return <>
        <path d={`M 0,0 L 0,${h} L ${hw},${h} Q ${bw},${h} ${bw},${h/2} Q ${bw},0 ${hw},0 Z`}
              fill={fill} stroke={stroke} strokeWidth={sw} />
        <circle cx={bw + 5} cy={h/2} r={5} fill={fill} stroke={stroke} strokeWidth={sw} />
      </>;
    }
    case 'or': {
      return <path d={`M 4,0 Q 20,${h/2} 4,${h} Q ${w*0.5},${h} ${w},${h/2} Q ${w*0.5},0 4,0 Z`}
                   fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case 'nor': {
      const bw = w - 9;
      return <>
        <path d={`M 4,0 Q 20,${h/2} 4,${h} Q ${bw*0.5},${h} ${bw},${h/2} Q ${bw*0.5},0 4,0 Z`}
              fill={fill} stroke={stroke} strokeWidth={sw} />
        <circle cx={bw + 5} cy={h/2} r={5} fill={fill} stroke={stroke} strokeWidth={sw} />
      </>;
    }
    case 'xor': {
      return <>
        <path d={`M 8,0 Q 24,${h/2} 8,${h} Q ${w*0.5},${h} ${w},${h/2} Q ${w*0.5},0 8,0 Z`}
              fill={fill} stroke={stroke} strokeWidth={sw} />
        <path d={`M 0,0 Q 16,${h/2} 0,${h}`} fill="none" stroke={stroke} strokeWidth={sw} />
      </>;
    }
    case 'xnor': {
      const bw = w - 10;
      return <>
        <path d={`M 8,0 Q 24,${h/2} 8,${h} Q ${bw*0.5},${h} ${bw},${h/2} Q ${bw*0.5},0 8,0 Z`}
              fill={fill} stroke={stroke} strokeWidth={sw} />
        <path d={`M 0,0 Q 16,${h/2} 0,${h}`} fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx={bw + 5} cy={h/2} r={5} fill={fill} stroke={stroke} strokeWidth={sw} />
      </>;
    }
    case 'not': {
      const tw = w - 12;
      return <>
        <polygon points={`0,0 0,${h} ${tw},${h/2}`} fill={fill} stroke={stroke} strokeWidth={sw} />
        <circle cx={tw + 6} cy={h/2} r={6} fill={fill} stroke={stroke} strokeWidth={sw} />
      </>;
    }
    case 'input': {
      return <>
        <rect x={0} y={0} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />
        <rect x={5} y={5} width={w - 10} height={h - 10} rx={2}
              fill={isOn ? '#1a4a1a' : '#252545'} stroke={isOn ? '#00c853' : '#4040708'} strokeWidth={1} />
        <text x={w/2} y={h/2 + 4} textAnchor="middle" fill={isOn ? '#00e676' : '#7070b0'}
              fontSize="12" fontFamily="monospace" fontWeight="bold">{isOn ? '1' : '0'}</text>
        <text x={w/2} y={h + 13} textAnchor="middle" fill="#5a5a9a" fontSize="8" fontFamily="monospace">INPUT</text>
      </>;
    }
    case 'button': {
      const r = h / 2 - 5;
      return <>
        <rect x={1} y={1} width={w - 2} height={h - 2} rx={5} fill={fill} stroke={stroke} strokeWidth={sw} />
        <circle cx={w/2} cy={h/2} r={r}
                fill={isOn ? '#00c853' : '#2a2a55'} stroke={isOn ? '#00e676' : '#4a4a88'} strokeWidth={2} />
        <text x={w/2} y={h/2 + 4} textAnchor="middle" fill={isOn ? '#fff' : '#6a6aaa'}
              fontSize="11" fontFamily="monospace" fontWeight="bold">{isOn ? '1' : '0'}</text>
        <text x={w/2} y={h + 13} textAnchor="middle" fill="#5a5a9a" fontSize="8" fontFamily="monospace">BUTTON</text>
      </>;
    }
    case 'power': {
      return <>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#1a0a0a" stroke="#cc3333" strokeWidth={sw} />
        <text x={w/2} y={h/2 + 4} textAnchor="middle" fill="#ff5555" fontSize="10" fontFamily="monospace" fontWeight="bold">VCC</text>
        <text x={w/2} y={h + 13} textAnchor="middle" fill="#5a5a9a" fontSize="8" fontFamily="monospace">POWER</text>
      </>;
    }
    case 'led': {
      const r = 16, cx = w/2, cy = h/2;
      return <>
        {isOn && <circle cx={cx} cy={cy} r={r + 8} fill="#ff000022" />}
        <circle cx={cx} cy={cy} r={r} fill={isOn ? '#cc1111' : '#1a0808'} stroke={isOn ? '#ff4444' : '#441111'} strokeWidth={2} />
        {isOn && <circle cx={cx} cy={cy} r={r - 5} fill="#ff6666" opacity={0.5} />}
        <text x={cx} y={cy + 4} textAnchor="middle" fill={isOn ? '#fff' : '#552222'} fontSize="8" fontFamily="monospace">LED</text>
        <text x={cx} y={h + 13} textAnchor="middle" fill="#5a5a9a" fontSize="8" fontFamily="monospace">DIGITAL LED</text>
      </>;
    }
    case 'rgb_led': {
      const pyArr = [18, 37, 56];
      const cfg = [
        { fillOn:'#cc1111', fillOff:'#1a0808', strokeOn:'#ff4444', label:'R' },
        { fillOn:'#11aa11', fillOff:'#081408', strokeOn:'#44ff44', label:'G' },
        { fillOn:'#1111cc', fillOff:'#080814', strokeOn:'#4444ff', label:'B' },
      ];
      return <>
        <rect x={8} y={2} width={w - 8} height={h - 4} rx={4} fill="#0e0e1e" stroke="#3a3a6a" strokeWidth={1.5} />
        {pyArr.map((py, i) => {
          const on = Array.isArray(isOn) ? isOn[i] === 1 : false;
          const { fillOn, fillOff, strokeOn, label } = cfg[i];
          const cx = 8 + (w - 8) / 2, r = 9;
          return <g key={i}>
            {on && <circle cx={cx} cy={py} r={r + 5} fill={fillOn + '22'} />}
            <circle cx={cx} cy={py} r={r} fill={on ? fillOn : fillOff} stroke={on ? strokeOn : '#222'} strokeWidth={1.5} />
            <text x={cx} y={py + 3} textAnchor="middle" fill={on ? '#fff' : '#444'} fontSize="7" fontFamily="monospace">{label}</text>
          </g>;
        })}
        <text x={8 + (w - 8)/2} y={h + 13} textAnchor="middle" fill="#5a5a9a" fontSize="8" fontFamily="monospace">RGB LED</text>
      </>;
    }
    default:
      return <rect x={0} y={0} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

// ── Palette mini icons ────────────────────────────────────────────────────────

function PaletteIcon({ type }) {
  const def = DEFS[type];
  const scale = Math.min(26 / def.w, 20 / def.h);
  const iw = def.w * scale, ih = def.h * scale;
  return (
    <svg width={iw} height={ih} viewBox={`0 0 ${def.w} ${def.h}`} style={{ overflow: 'visible' }}>
      <GateBody type={type} w={def.w} h={def.h} isOn={false} />
    </svg>
  );
}

// ── Wire bezier path ──────────────────────────────────────────────────────────

function wirePath(x1, y1, x2, y2) {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

// ── ID counter ───────────────────────────────────────────────────────────────

let _id = 1;
const uid = () => `e${_id++}`;

// ── Main component ────────────────────────────────────────────────────────────

export default function LogicCircuitSimulator() {
  const [components, setComponents] = useState({});
  const [wires, setWires]           = useState([]);
  const [tool, setTool]             = useState(null);   // type string or null
  const [wireStart, setWireStart]   = useState(null);   // {compId, portIdx, x, y}
  const [mouse, setMouse]           = useState({ x: 0, y: 0 });
  const [selected, setSelected]     = useState(null);
  const [dragging, setDragging]     = useState(null);   // {id, ox, oy}
  const svgRef = useRef(null);

  // ── Simulation ──────────────────────────────────────────────────────────────
  const simVals = useMemo(() => simulate(components, wires), [components, wires]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'Escape') { setTool(null); setWireStart(null); setSelected(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        setComponents(p => { const n = { ...p }; delete n[selected]; return n; });
        setWires(p => p.filter(w => w.fromId !== selected && w.toId !== selected));
        setSelected(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // ── SVG coordinate helper ───────────────────────────────────────────────────
  function svgPos(e) {
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function portAbs(compId, isOut, portIdx) {
    const c = components[compId];
    if (!c) return null;
    const def = DEFS[c.type];
    const p = (isOut ? def.outs : def.ins)[portIdx];
    if (!p) return null;
    return { x: c.x + p.x, y: c.y + p.y };
  }

  // ── Canvas events ───────────────────────────────────────────────────────────
  function onSvgMouseMove(e) {
    const pos = svgPos(e);
    setMouse(pos);
    if (dragging) {
      setComponents(p => ({
        ...p,
        [dragging.id]: { ...p[dragging.id], x: pos.x - dragging.ox, y: pos.y - dragging.oy }
      }));
    }
  }

  function onSvgMouseUp() { setDragging(null); }

  function onSvgClick(e) {
    if (e.target !== svgRef.current && !e.target.closest('.cv-bg')) return;
    if (!tool) { setSelected(null); return; }
    const pos = svgPos(e);
    const def = DEFS[tool];
    const id = uid();
    setComponents(p => ({
      ...p,
      [id]: { id, type: tool, x: pos.x - def.w / 2, y: pos.y - def.h / 2, state: 0 }
    }));
  }

  // ── Component events ────────────────────────────────────────────────────────
  function onCompMouseDown(e, id) {
    if (tool) return;
    e.stopPropagation();
    if (!wireStart) {
      setSelected(id);
      const c = components[id];
      const pos = svgPos(e);
      setDragging({ id, ox: pos.x - c.x, oy: pos.y - c.y });
    }
  }

  function onCompClick(e, id) {
    if (tool || dragging) return;
    e.stopPropagation();
    const c = components[id];
    if (c.type === 'input' || c.type === 'button') {
      setComponents(p => ({ ...p, [id]: { ...p[id], state: (p[id].state ?? 0) === 1 ? 0 : 1 } }));
    }
    setSelected(id);
    setWireStart(null);
  }

  // ── Port events ─────────────────────────────────────────────────────────────
  function onPortClick(e, compId, isOut, portIdx) {
    e.stopPropagation();
    if (tool) return;
    const abs = portAbs(compId, isOut, portIdx);
    if (!abs) return;

    if (!wireStart) {
      if (isOut) setWireStart({ compId, portIdx, x: abs.x, y: abs.y });
      return;
    }
    // Complete wire on an input port
    if (!isOut && wireStart.compId !== compId) {
      const taken = wires.some(w => w.toId === compId && w.toPort === portIdx);
      if (!taken) {
        setWires(p => [...p, {
          id: uid(),
          fromId: wireStart.compId, fromPort: wireStart.portIdx,
          toId: compId, toPort: portIdx
        }]);
      }
      setWireStart(null);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selected) return;
    setComponents(p => { const n = { ...p }; delete n[selected]; return n; });
    setWires(p => p.filter(w => w.fromId !== selected && w.toId !== selected));
    setSelected(null);
  }

  function clearAll() {
    setComponents({}); setWires([]); setSelected(null); setWireStart(null); setTool(null); _id = 1;
  }

  const PORT_R = 5;

  return (
    <div className="cv-wrapper">
      {/* ── Palette ── */}
      <div className="cv-palette">
        <div className="cv-palette-title">CIRCUIT ELEMENTS</div>
        {PALETTE_ORDER.map(cat => (
          <div key={cat} className="cv-cat">
            <div className="cv-cat-label">{cat}</div>
            {Object.entries(DEFS).filter(([, d]) => d.cat === cat).map(([type, def]) => (
              <button
                key={type}
                className={`cv-item ${tool === type ? 'active' : ''}`}
                onClick={() => setTool(t => t === type ? null : type)}
                title={`Colocar ${def.label}`}
              >
                <span className="cv-item-icon"><PaletteIcon type={type} /></span>
                <span>{def.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Canvas ── */}
      <div className="cv-canvas-area">
        {/* Toolbar */}
        <div className="cv-toolbar">
          <button className={`cv-tool-btn ${!tool ? 'active' : ''}`}
            onClick={() => { setTool(null); setWireStart(null); }}>↖ Select</button>
          <div className="cv-sep" />
          <button className="cv-tool-btn" onClick={deleteSelected} disabled={!selected}>⌫ Eliminar</button>
          <button className="cv-tool-btn" onClick={clearAll}>✕ Limpiar todo</button>
          <div className="cv-sep" />
          {tool && (
            <span className="cv-status">
              Colocando: <strong style={{ color: '#00e676' }}>{DEFS[tool]?.label}</strong>
              &nbsp;· Clic en el canvas · Esc cancela
            </span>
          )}
          {wireStart && !tool && (
            <span className="cv-status wire">
              Conectando cable → clic en un puerto de entrada (circulo izquierdo)
            </span>
          )}
          {!tool && !wireStart && (
            <span className="cv-status">Selecciona un componente del panel o arrastra para mover · Delete elimina</span>
          )}
        </div>

        {/* SVG canvas */}
        <svg
          ref={svgRef}
          className={`cv-svg ${tool ? 'placing' : ''} ${wireStart ? 'wiring' : ''}`}
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onClick={onSvgClick}
        >
          {/* Grid */}
          <defs>
            <pattern id="cvgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20,0 L 0,0 0,20" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={0.5} />
            </pattern>
          </defs>
          <rect className="cv-bg" width="100%" height="100%" fill="url(#cvgrid)" />

          {/* Wires */}
          {wires.map(w => {
            const from = portAbs(w.fromId, true, w.fromPort);
            const to   = portAbs(w.toId, false, w.toPort);
            if (!from || !to) return null;
            const active = ((simVals[w.fromId] ?? [0])[w.fromPort] ?? 0) === 1;
            return (
              <path
                key={w.id}
                d={wirePath(from.x, from.y, to.x, to.y)}
                fill="none"
                stroke={active ? '#00e676' : '#3a3a6a'}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setWires(p => p.filter(x => x.id !== w.id)); }}
              />
            );
          })}

          {/* Rubberband wire */}
          {wireStart && (
            <path
              d={wirePath(wireStart.x, wireStart.y, mouse.x, mouse.y)}
              fill="none"
              stroke="#ffcc00"
              strokeWidth={1.5}
              strokeDasharray="7,3"
              pointerEvents="none"
            />
          )}

          {/* Components */}
          {Object.values(components).map(c => {
            const def = DEFS[c.type];
            if (!def) return null;
            const vals   = simVals[c.id] ?? [0];
            const isOn   = c.type === 'rgb_led' ? vals : vals[0] === 1;
            const isSel  = selected === c.id;

            return (
              <g
                key={c.id}
                transform={`translate(${c.x},${c.y})`}
                style={{ cursor: tool ? 'crosshair' : 'grab' }}
                onMouseDown={e => onCompMouseDown(e, c.id)}
                onClick={e => onCompClick(e, c.id)}
              >
                {/* Selection highlight */}
                {isSel && (
                  <rect x={-5} y={-5} width={def.w + 10} height={def.h + 10}
                    rx={5} fill="none" stroke="#ffcc00" strokeWidth={1.5} strokeDasharray="5,3" />
                )}

                <GateBody type={c.type} w={def.w} h={def.h} isOn={isOn} />

                {/* Gate label (inside body for gates) */}
                {['and','or','not','xor','nand','nor','xnor'].includes(c.type) && (
                  <text x={def.w / 2 - (c.type === 'xor' || c.type === 'xnor' ? 4 : 0)}
                        y={def.h / 2 + 4}
                        textAnchor="middle" fill={vals[0]===1?'#00e676':'#7070b0'}
                        fontSize="10" fontFamily="monospace" fontWeight="bold"
                        pointerEvents="none">
                    {def.label}
                  </text>
                )}

                {/* Input ports */}
                {def.ins.map((p, pi) => {
                  const connectedWire = wires.find(w => w.toId === c.id && w.toPort === pi);
                  const portActive = connectedWire
                    ? ((simVals[connectedWire.fromId] ?? [0])[connectedWire.fromPort] ?? 0) === 1
                    : false;
                  const isWireTarget = !!wireStart && !portActive;
                  return (
                    <circle
                      key={pi}
                      cx={p.x} cy={p.y} r={PORT_R}
                      fill={portActive ? '#00e676' : '#1a1a35'}
                      stroke={isWireTarget ? '#ffcc00' : portActive ? '#00e676' : '#5a5a9a'}
                      strokeWidth={isWireTarget ? 2 : 1.5}
                      style={{ cursor: 'crosshair' }}
                      onClick={e => onPortClick(e, c.id, false, pi)}
                    />
                  );
                })}

                {/* Output ports */}
                {def.outs.map((p, pi) => {
                  const outActive = (vals[pi] ?? 0) === 1;
                  return (
                    <circle
                      key={pi}
                      cx={p.x} cy={p.y} r={PORT_R}
                      fill={outActive ? '#00e676' : '#1a1a35'}
                      stroke={outActive ? '#00e676' : '#5a5a9a'}
                      strokeWidth={1.5}
                      style={{ cursor: 'crosshair' }}
                      onClick={e => onPortClick(e, c.id, true, pi)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hint overlay */}
        <div className="cv-hint">
          Clic en componente = colocar · Arrastrar = mover<br />
          Clic en ● derecho = iniciar cable · Clic en ● izquierdo = conectar<br />
          Clic en cable = eliminar cable · Delete = eliminar componente
        </div>
      </div>
    </div>
  );
}
