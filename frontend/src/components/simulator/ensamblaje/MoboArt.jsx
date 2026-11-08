import { LAYOUTS, SOCKET_C, dimmXs } from './catalog';

// ═══════════════════════════════════════════════════ DEFINICIONES GLOBALES ══
// Se monta una sola vez; los url(#id) se resuelven a nivel de documento.

export function SharedDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
      <defs>
        <pattern id="asm-pcb" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 4h7l3 3h8M0 13h4l3-3h4l2 2h5M9 0v3M14 18v-4" stroke="rgba(255,255,255,.045)" strokeWidth=".35" fill="none" />
          <circle cx="7" cy="4" r=".5" fill="rgba(255,255,255,.07)" />
          <circle cx="14" cy="14" r=".5" fill="rgba(255,255,255,.07)" />
          <circle cx="4" cy="13" r=".35" fill="rgba(210,170,90,.12)" />
        </pattern>
        <pattern id="asm-fins-v" width="1.8" height="10" patternUnits="userSpaceOnUse">
          <rect width=".7" height="10" fill="rgba(0,0,0,.35)" />
          <rect x=".7" width=".25" height="10" fill="rgba(255,255,255,.18)" />
        </pattern>
        <pattern id="asm-fins-h" width="10" height="1.8" patternUnits="userSpaceOnUse">
          <rect width="10" height=".7" fill="rgba(0,0,0,.35)" />
          <rect y=".7" width="10" height=".25" fill="rgba(255,255,255,.18)" />
        </pattern>
        <pattern id="asm-fins-px" width="10" height="3" patternUnits="userSpaceOnUse">
          <rect width="10" height="1.2" fill="rgba(0,0,0,.45)" />
          <rect y="1.2" width="10" height=".4" fill="rgba(255,255,255,.14)" />
        </pattern>
        <pattern id="asm-lga" width="1.1" height="1.1" patternUnits="userSpaceOnUse">
          <rect width="1.1" height="1.1" fill="#3a2f1e" />
          <circle cx=".55" cy=".55" r=".32" fill="#d9b25a" />
        </pattern>
        <pattern id="asm-pga" width="1.27" height="1.27" patternUnits="userSpaceOnUse">
          <rect width="1.27" height="1.27" fill="#ece6d4" />
          <circle cx=".63" cy=".63" r=".28" fill="#8f877a" />
        </pattern>
        <pattern id="asm-mesh" width="8" height="7" patternUnits="userSpaceOnUse">
          <rect width="8" height="7" fill="#0b0c0e" />
          <path d="M2 0.5h4l2 3-2 3H2L0 3.5z" fill="#1d2026" />
        </pattern>
        <pattern id="asm-honey" width="9" height="8" patternUnits="userSpaceOnUse">
          <rect width="9" height="8" fill="#050506" />
          <path d="M2.2 .6h4.6l2.2 3.4-2.2 3.4H2.2L0 4z" fill="#26282c" />
        </pattern>
        <pattern id="asm-perf" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#1a1c20" />
          <circle cx="3" cy="3" r="1.5" fill="#07080a" />
        </pattern>
        <pattern id="asm-tex" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#141518" />
          <circle cx="1" cy="1" r=".45" fill="#1d1f23" />
          <circle cx="3" cy="3" r=".45" fill="#101114" />
        </pattern>
        <pattern id="asm-braid" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill="#161616" />
          <rect width="3" height="6" fill="#222" />
        </pattern>

        <linearGradient id="asm-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset=".45" stopColor="#b7bdc4" />
          <stop offset=".55" stopColor="#d8dde2" />
          <stop offset="1" stopColor="#8a9097" />
        </linearGradient>
        <linearGradient id="asm-ihs" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef0f2" />
          <stop offset=".35" stopColor="#c3c8cd" />
          <stop offset=".6" stopColor="#e3e6e9" />
          <stop offset="1" stopColor="#9ea4ab" />
        </linearGradient>
        <linearGradient id="asm-alu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe2e6" />
          <stop offset=".5" stopColor="#aeb4bb" />
          <stop offset="1" stopColor="#cfd3d8" />
        </linearGradient>
        <linearGradient id="asm-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a87a1f" />
          <stop offset=".5" stopColor="#f2cf6b" />
          <stop offset="1" stopColor="#a87a1f" />
        </linearGradient>
        <linearGradient id="asm-black" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2e33" />
          <stop offset="1" stopColor="#0d0e10" />
        </linearGradient>
        <linearGradient id="asm-blackh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0c0d0f" />
          <stop offset=".5" stopColor="#25282d" />
          <stop offset="1" stopColor="#0c0d0f" />
        </linearGradient>
        <linearGradient id="asm-case" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#24272d" />
          <stop offset="1" stopColor="#101114" />
        </linearGradient>
        <linearGradient id="asm-tray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262a31" />
          <stop offset=".6" stopColor="#1c1f25" />
          <stop offset="1" stopColor="#15171b" />
        </linearGradient>
        <linearGradient id="asm-rgb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3b6b" />
          <stop offset=".25" stopColor="#ffb13b" />
          <stop offset=".5" stopColor="#3bff9d" />
          <stop offset=".75" stopColor="#3bb7ff" />
          <stop offset="1" stopColor="#b43bff" />
        </linearGradient>
        <linearGradient id="asm-rgbh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3b6b" />
          <stop offset=".25" stopColor="#ffb13b" />
          <stop offset=".5" stopColor="#3bff9d" />
          <stop offset=".75" stopColor="#3bb7ff" />
          <stop offset="1" stopColor="#b43bff" />
        </linearGradient>
        <linearGradient id="asm-copper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0b48a" />
          <stop offset=".5" stopColor="#b8693a" />
          <stop offset="1" stopColor="#e2a079" />
        </linearGradient>
        <radialGradient id="asm-paste" cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#e9ebee" />
          <stop offset=".7" stopColor="#a9aeb4" />
          <stop offset="1" stopColor="#7d838a" />
        </radialGradient>
        <radialGradient id="asm-fanhub" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#3a3d42" />
          <stop offset="1" stopColor="#0d0e10" />
        </radialGradient>

        <filter id="asm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity=".55" />
        </filter>
        <filter id="asm-shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx=".6" dy="1.2" stdDeviation=".9" floodColor="#000" floodOpacity=".6" />
        </filter>
        <filter id="asm-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="asm-glow-sm" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation=".9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════ PIEZAS BASE ══

function Heatsink({ b, x, y, w, h, rx = 1.6, fins = 'v', children }) {
  return (
    <g>
      <rect x={x + .7} y={y + 1} width={w} height={h} rx={rx} fill="rgba(0,0,0,.5)" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#hs-${b.id})`} stroke="rgba(255,255,255,.22)" strokeWidth=".3" />
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={rx * .7} fill={`url(#asm-fins-${fins})`} opacity=".55" />
      {children}
    </g>
  );
}

function Chokes({ x, y, n, dir = 'h' }) {
  return Array.from({ length: n }, (_, i) => {
    const cx = dir === 'h' ? x + i * 8.2 : x;
    const cy = dir === 'h' ? y : y + i * 8.2;
    return (
      <g key={i}>
        <rect x={cx} y={cy} width="6.6" height="6.6" rx=".6" fill="#3d4044" stroke="#55595e" strokeWidth=".25" />
        <text x={cx + 3.3} y={cy + 4.2} fontSize="1.9" fill="#9aa0a6" textAnchor="middle" fontFamily="monospace">R22</text>
      </g>
    );
  });
}

function Caps({ pts }) {
  return pts.map(([x, y], i) => (
    <g key={i}>
      <circle cx={x} cy={y} r="2.2" fill="#1b1b1d" stroke="#5e6166" strokeWidth=".3" />
      <path d={`M${x - 1.2} ${y}h2.4M${x} ${y - 1.2}v2.4`} stroke="#6c7076" strokeWidth=".35" />
    </g>
  ));
}

function PinHeader({ x, y, cols, rows = 2, pitch = 2.54, color = '#121212', pin = '#d9b25a', missing = -1 }) {
  return (
    <g>
      <rect x={x} y={y} width={cols * pitch + .6} height={rows * pitch + .6} fill={color} rx=".3" />
      {Array.from({ length: cols * rows }, (_, i) => {
        if (i === missing) return null;
        const c = i % cols, r = Math.floor(i / cols);
        return <rect key={i} x={x + .55 + c * pitch} y={y + .55 + r * pitch} width="1.2" height="1.2" fill={pin} />;
      })}
    </g>
  );
}

function Silk({ x, y, children, size = 2.6, anchor = 'start', rot = 0, op = .45 }) {
  return (
    <text x={x} y={y} fontSize={size} fill={`rgba(255,255,255,${op})`} fontFamily="Arial, sans-serif"
      textAnchor={anchor} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} style={{ letterSpacing: '.05em' }}>
      {children}
    </text>
  );
}

function BrandMark({ b, x, y, size = 6, color }) {
  const c = color || b.accent;
  switch (b.logo) {
    case 'rog':
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d={`M0 0 l${size * 1.6} ${-size * .55} l${size * .5} ${size * .35} l${-size * .9} ${size * .25} z`} fill={c} />
          <text x={size * .2} y={size * 1.05} fontSize={size * .8} fontWeight="900" fontStyle="italic" fill={c} fontFamily="Arial Black, Arial">ROG</text>
        </g>
      );
    case 'aorus':
      return <text x={x} y={y} fontSize={size} fontWeight="900" fill={c} fontFamily="Arial Black, Arial" style={{ letterSpacing: '.12em' }}>AORUS</text>;
    case 'prime':
      return <text x={x} y={y} fontSize={size} fontWeight="300" fill={c} fontFamily="Arial, sans-serif" style={{ letterSpacing: '.28em' }}>PRIME</text>;
    case 'asrock':
      return <text x={x} y={y} fontSize={size} fontWeight="700" fill={c} fontFamily="Arial, sans-serif">ASRock</text>;
    default:
      return <text x={x} y={y} fontSize={size} fontWeight="900" fontStyle="italic" fill={c} fontFamily="Arial Black, Arial">msi</text>;
  }
}

// ═══════════════════════════════════════════════════════════════ SOCKET ══

function AmdBracket({ cx, cy }) {
  return (
    <g>
      {[-1, 1].map(s => (
        <g key={s}>
          <rect x={cx - 27} y={cy + s * 36.5 - 4.5} width="54" height="9" rx="2.2" fill="#0d0d0e" stroke="#2c2c2e" strokeWidth=".4" filter="url(#asm-shadow-sm)" />
          <rect x={cx - 4} y={cy + s * 36.5 - (s > 0 ? -2.5 : 4.5)} width="8" height="2" fill="#1d1d20" />
          {[-21, 21].map(dx => (
            <g key={dx}>
              <circle cx={cx + dx} cy={cy + s * 36.5} r="2.2" fill="url(#asm-metal)" />
              <path d={`M${cx + dx - 1.2} ${cy + s * 36.5}h2.4M${cx + dx} ${cy + s * 36.5 - 1.2}v2.4`} stroke="#555" strokeWidth=".45" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

export function SocketArt({ b, hasCpu }) {
  const { x: cx, y: cy } = SOCKET_C;
  if (b.socket === 'AM4') {
    return (
      <g>
        <AmdBracket cx={cx} cy={cy} />
        <rect x={cx - 21.5} y={cy - 21.5} width="43" height="43" rx="1" fill="#e2dcc8" stroke="#bfb8a2" strokeWidth=".4" filter="url(#asm-shadow-sm)" />
        <rect x={cx - 19} y={cy - 19} width="38" height="38" fill="url(#asm-pga)" />
        <path d={`M${cx - 19} ${cy - 19} l4 0 l-4 4 z`} fill="#c7a34b" />
        <rect x={cx + 22.5} y={cy - 22} width="1.6" height="40" fill="url(#asm-metal)" />
        <rect x={cx + 21} y={cy + 17} width="4.5" height="2" rx=".8" fill="url(#asm-metal)" />
        <Silk x={cx} y={cy + 28} anchor="middle" size={2.4}>SOCKET AM4</Silk>
      </g>
    );
  }
  const isAm5 = b.socket === 'AM5';
  const w = b.socket === 'LGA1700' ? 45 : isAm5 ? 44 : 41;
  const h = b.socket === 'LGA1700' ? 52 : isAm5 ? 44 : 41;
  const holes = b.socket === 'LGA1700' ? 39 : 37.5;
  return (
    <g>
      {isAm5
        ? <AmdBracket cx={cx} cy={cy} />
        : [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
          <g key={i}>
            <circle cx={cx + dx * holes} cy={cy + dy * holes} r="2.4" fill="#0b0b0b" stroke="url(#asm-gold)" strokeWidth=".9" />
          </g>
        ))}
      <rect x={cx - w / 2 - 3} y={cy - h / 2 - 3} width={w + 6} height={h + 6} rx="1" fill="#0e0e10" filter="url(#asm-shadow-sm)" />
      <rect x={cx - w / 2 + 3} y={cy - h / 2 + 3} width={w - 6} height={h - 6} fill="url(#asm-lga)" />
      {/* placa de carga metálica */}
      <path
        d={`M${cx - w / 2} ${cy - h / 2} h${w} v${h} h${-w} z M${cx - w / 2 + 4.5} ${cy - h / 2 + 5} v${h - 10} h${w - 9} v${-(h - 10)} z`}
        fill="url(#asm-metal)" fillRule="evenodd" stroke="#6f757c" strokeWidth=".3" />
      <rect x={cx - w / 2 + 1.5} y={cy + h / 2 - 3} width="3" height="2.2" rx=".5" fill="#555a60" />
      <rect x={cx - w / 2 + 1.5} y={cy - h / 2 + .8} width="3" height="2.2" rx=".5" fill="#555a60" />
      {/* palanca */}
      <rect x={cx + w / 2 + 2} y={cy - h / 2} width="1.5" height={h + 2} fill="url(#asm-metal)" />
      <rect x={cx + w / 2 + .5} y={cy + h / 2 + .5} width="5" height="2.4" rx="1" fill="url(#asm-metal)" />
      {!hasCpu && (
        <g>
          <rect x={cx - w / 2 + 5.5} y={cy - h / 2 + 6} width={w - 11} height={h - 12} rx="1" fill="#16171a" stroke="#2a2c30" strokeWidth=".4" />
          <rect x={cx - 6} y={cy - 2.5} width="12" height="5" rx="1" fill="#25272b" />
          <text x={cx} y={cy + 1} fontSize="2.2" fill="#7f858c" textAnchor="middle" fontFamily="Arial">PnP CAP</text>
        </g>
      )}
      <Silk x={cx} y={cy + h / 2 + 7} anchor="middle" size={2.4}>{isAm5 ? 'SOCKET AM5' : b.socket}</Silk>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════ PLACA MADRE ══

export function MoboArt({ b, debug = {}, lights = false, ramFilled = [], hasCpu = false }) {
  const L = LAYOUTS[b.form];
  const dx = dimmXs(b);
  const big = b.vrm === 'big';
  const ledColor = s => (s === 'red' ? '#ff2a2a' : s === 'amber' ? '#ffb020' : '#3a1414');

  return (
    <g>
      <defs>
        <linearGradient id={`hs-${b.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b.hs[0]} />
          <stop offset=".55" stopColor={b.hs[1]} />
          <stop offset="1" stopColor={b.hs[0]} stopOpacity=".85" />
        </linearGradient>
      </defs>

      {/* PCB */}
      <rect x="0" y="0" width={L.w} height={L.h} rx="2" fill={b.pcb} />
      <rect x="0" y="0" width={L.w} height={L.h} rx="2" fill="url(#asm-pcb)" />
      <rect x=".3" y=".3" width={L.w - .6} height={L.h - .6} rx="2" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth=".6" />

      {/* Orificios de montaje */}
      {L.holes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.4" fill="url(#asm-gold)" opacity=".75" />
          <circle cx={x} cy={y} r="1.9" fill="url(#asm-metal)" />
          <path d={`M${x - 1.1} ${y}h2.2M${x} ${y - 1.1}v2.2`} stroke="#4b4f55" strokeWidth=".4" />
        </g>
      ))}

      {/* Fases VRM: bobinas y capacitores */}
      <Chokes x={30} y={big ? 26 : 22} n={big ? 10 : 6} />
      <Chokes x={big ? 27 : 24} y={34} n={big ? 8 : 5} dir="v" />
      <Caps pts={big ? [] : [[30, 30], [36, 30], [42, 30], [48, 30], [30, 74], [30, 80]]} />

      {/* Cubierta I/O + disipador VRM izquierdo */}
      {big ? (
        <Heatsink b={b} x={0} y={8} w={26} h={112} fins="h">
          <rect x="3" y="14" width="2" height="96" rx="1" fill={b.accent} opacity=".85" />
          <g transform="translate(14 64) rotate(-90)">
            <BrandMark b={b} x={-22} y={2.5} size={6.5} color={b.logo === 'rog' && lights ? '#ff3355' : undefined} />
          </g>
          {lights && b.logo === 'rog' && (
            <rect x="2.6" y="14" width="2.8" height="96" rx="1.4" fill="#ff2b44" filter="url(#asm-glow-sm)" className="asm-rgb-shift" />
          )}
        </Heatsink>
      ) : (
        <g>
          <rect x="0" y="10" width="20" height="104" rx="1" fill="#0f1011" stroke="#2c2f33" strokeWidth=".3" />
          <rect x="2" y="16" width="16" height="10" fill="#1b1c1f" />
          <rect x="2" y="30" width="16" height="12" fill="#1b1c1f" />
          <rect x="2" y="48" width="16" height="8" fill="#1b1c1f" />
          <Silk x={10} y={100} anchor="middle" rot={-90} size={2.2}>REAR I/O</Silk>
        </g>
      )}

      {/* Disipador VRM superior */}
      {b.vrm === 'small' ? (
        <Heatsink b={b} x={30} y={5} w={40} h={14} fins="v" />
      ) : (
        <Heatsink b={b} x={28} y={4} w={big ? 90 : 72} h={big ? 20 : 16} fins="v">
          {big && <rect x="32" y="20.5" width={80} height="1.3" fill={b.accent} opacity=".7" />}
          {b.logo === 'prime' && <BrandMark b={b} x={40} y={14} size={5} color="#5a6066" />}
        </Heatsink>
      )}
      {big ? null : <Heatsink b={b} x={20} y={b.vrm === 'small' ? 24 : 22} w={9} h={60} fins="h" />}

      {/* Conector EPS 8 pines */}
      <g>
        <rect x="14" y="1.4" width="18.5" height="8.6" rx=".6" fill="#0c0c0d" stroke="#2b2b2e" strokeWidth=".3" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={15 + (i % 4) * 4.3} y={2.4 + Math.floor(i / 4) * 3.8} width="3.4" height="3" rx=".4" fill="#1f1f22" stroke="#333" strokeWidth=".2" />
        ))}
        <Silk x={23} y={13.6} anchor="middle" size={2}>CPU_PWR1</Silk>
      </g>

      {/* CPU_FAN */}
      <PinHeader x={118} y={3} cols={4} rows={1} color="#e8e8e8" pin="#c79a3e" />
      <Silk x={123.5} y={10.6} anchor="middle" size={2}>CPU_FAN</Silk>

      <SocketArt b={b} hasCpu={hasCpu} />

      {/* DIMM */}
      {dx.map((x, i) => {
        const filled = !!ramFilled[i];
        const latch = filled ? 0 : 1.6;
        const slotC = i % 2 === 0 && b.slot === '#e9ecef' ? '#2a2d31' : b.slot;
        return (
          <g key={i}>
            <rect x={x} y={14} width="6" height="133" rx=".5" fill={slotC} stroke="rgba(0,0,0,.6)" strokeWidth=".3" filter="url(#asm-shadow-sm)" />
            <rect x={x + 2.2} y={16} width="1.6" height="129" fill="#050505" />
            <rect x={x + 1.8} y={b.ramType === 'DDR5' ? 80 : 75} width="2.4" height="1.2" fill={slotC} />
            <rect x={x - .4 - latch / 2} y={9.5 - latch} width="6.8" height="5" rx=".6" fill={slotC} stroke="rgba(0,0,0,.6)" strokeWidth=".3" />
            <rect x={x - .4 - latch / 2} y={146.5 + latch} width="6.8" height="5" rx=".6" fill={slotC} stroke="rgba(0,0,0,.6)" strokeWidth=".3" />
            <Silk x={x + 3} y={157 + latch} anchor="middle" size={1.8}>{['A1', 'A2', 'B1', 'B2'][b.dimms === 4 ? i : i * 2 + 1]}</Silk>
          </g>
        );
      })}
      <Silk x={dx[0] - 3} y={80} anchor="middle" rot={-90} size={2.3}>{b.ramType} DIMM</Silk>

      {/* LEDs de diagnóstico */}
      {['CPU', 'DRAM', 'VGA', 'BOOT'].map((k, i) => {
        const s = debug[k];
        return (
          <g key={k}>
            <rect x="221" y={22 + i * 8} width="3.6" height="2.4" rx=".5" fill={ledColor(s)} filter={s ? 'url(#asm-glow-sm)' : undefined} />
            <Silk x={219.5} y={24 + i * 8} anchor="end" size={2.2} op={.55}>{k}</Silk>
          </g>
        );
      })}

      {/* ATX 24 pines */}
      <g>
        <rect x="230" y="70" width="12" height="54" rx=".6" fill="#0c0c0d" stroke="#2c2c2f" strokeWidth=".3" filter="url(#asm-shadow-sm)" />
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={231 + (i % 2) * 5.2} y={71.2 + Math.floor(i / 2) * 4.4} width="4.4" height="3.6" rx=".5" fill="#1d1d20" stroke="#353538" strokeWidth=".2" />
        ))}
        <Silk x={228} y={97} anchor="middle" rot={-90} size={2.2}>ATX_PWR</Silk>
      </g>

      {/* Ranuras M.2 */}
      <g>
        <rect x="30" y="129" width="6" height="18" rx=".5" fill="#0d0d0e" stroke="#2c2c2f" strokeWidth=".3" />
        <rect x="31.5" y="131" width="1.2" height="14" fill="#c7a34b" opacity=".6" />
        <rect x="36" y="128" width="80" height="22" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".35" strokeDasharray="1.4 1.2" />
        <circle cx="114" cy="139" r="2.2" fill="url(#asm-gold)" />
        <circle cx="114" cy="139" r="1" fill="#2a2a2a" />
        <Silk x={74} y={141} anchor="middle" size={2.6} op={.3}>M.2_1 (PCIe / SATA) 2280</Silk>
      </g>
      {L.m2b && (
        <Heatsink b={b} x={30} y={L.m2b.y} w={88} h={13} fins="v">
          <BrandMark b={b} x={62} y={L.m2b.y + 8.5} size={4} />
        </Heatsink>
      )}

      {/* PCIe */}
      {L.pcie.map((p, i) => (
        <g key={i}>
          <rect x="18" y={p.y} width={p.len} height="7.5" rx=".6" fill="#0b0b0c" stroke="#2a2a2d" strokeWidth=".3" />
          <rect x="20" y={p.y + 3} width={p.len - 4} height="1.5" fill="#000" />
          {p.x16 && (b.armor || i === 0) && (
            <rect x="17.3" y={p.y - .7} width={p.len + 1.4} height="8.9" rx=".8" fill="none" stroke="url(#asm-metal)" strokeWidth=".9" />
          )}
          {p.x16 && <rect x={18 + p.len - 6} y={p.y - 1.4} width="7" height="2.2" rx=".5" fill="#0b0b0c" stroke="#3b3b3f" strokeWidth=".3" />}
          <Silk x={18 + p.len + 3} y={p.y + 5.6} size={2.2}>{p.x16 ? (i === 0 ? 'PCIEX16_1' : `PCIEX16_${i}`) : `PCIEX1_${i}`}</Silk>
        </g>
      ))}

      {/* Chipset */}
      <Heatsink b={b} x={L.chipset.x} y={L.chipset.y} w={L.chipset.w} h={L.chipset.h} fins="h">
        <rect x={L.chipset.x + 3} y={L.chipset.y + L.chipset.h / 2 - 5} width={L.chipset.w - 6} height="10" rx="1" fill="rgba(0,0,0,.55)" />
        <BrandMark b={b} x={L.chipset.x + 6} y={L.chipset.y + L.chipset.h / 2 + 2.2} size={5} />
        <text x={L.chipset.x + L.chipset.w - 3} y={L.chipset.y + L.chipset.h - 3} fontSize="2.4" textAnchor="end" fill="rgba(255,255,255,.75)" fontFamily="Arial">{b.chipset.split(' ')[1]}</text>
        {lights && b.armor && (
          <rect x={L.chipset.x + 2} y={L.chipset.y + L.chipset.h - 1.6} width={L.chipset.w - 4} height=".9" fill={b.accent} filter="url(#asm-glow-sm)" />
        )}
      </Heatsink>

      {/* SATA */}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <rect x={L.sata.x} y={L.sata.y + i * 8} width="13" height="6.4" rx=".5" fill="#0c0c0d" stroke="#2d2d30" strokeWidth=".3" />
          <path d={`M${L.sata.x + 2} ${L.sata.y + i * 8 + 2}h8v2.4h-6.5v-1z`} fill="#000" />
        </g>
      ))}
      <Silk x={L.sata.x + 6.5} y={L.sata.y - 2} anchor="middle" size={2}>SATA6G_1-4</Silk>

      {/* Batería CMOS */}
      <circle cx={L.battery.x} cy={L.battery.y} r="10.4" fill="#1a1a1a" />
      <circle cx={L.battery.x} cy={L.battery.y} r="9.6" fill="url(#asm-metal)" />
      <text x={L.battery.x} y={L.battery.y + 1} fontSize="2.6" textAnchor="middle" fill="#5d636a" fontFamily="Arial">CR2032</text>
      <text x={L.battery.x} y={L.battery.y - 4} fontSize="3" textAnchor="middle" fill="#5d636a" fontFamily="Arial">+</text>

      {/* Audio */}
      <path d={`M${L.audio.x} ${L.audio.y} h${L.audio.w} v${L.audio.h}`} stroke={b.accent} strokeWidth=".5" fill="none" opacity=".6" strokeDasharray="2 1" />
      <rect x={L.audio.x + 6} y={L.audio.y + 6} width="9" height="9" fill="#0d0d0e" stroke="#444" strokeWidth=".3" />
      <text x={L.audio.x + 10.5} y={L.audio.y + 11.3} fontSize="1.6" fill="#888" textAnchor="middle" fontFamily="Arial">ALC</text>
      {[[22, 8], [28, 8], [22, 14], [28, 14], [34, 11]].map(([x, y], i) => (
        <circle key={i} cx={L.audio.x + x} cy={L.audio.y + y} r="2" fill="#c8a43c" stroke="#7b6224" strokeWidth=".3" />
      ))}

      {/* Panel frontal */}
      <PinHeader x={L.fpanel.x} y={L.fpanel.y} cols={5} rows={2} missing={9} />
      <Silk x={L.fpanel.x + 6.5} y={L.fpanel.y - 1.6} anchor="middle" size={2}>F_PANEL</Silk>

      {/* Cabezales inferiores */}
      <PinHeader x={60} y={L.headersY} cols={5} rows={2} missing={9} color="#0f0f10" />
      <PinHeader x={92} y={L.headersY} cols={5} rows={2} missing={9} color="#0f0f10" />
      <PinHeader x={128} y={L.headersY + 1} cols={4} rows={1} color="#e8e8e8" pin="#c79a3e" />
      <Silk x={70} y={L.headersY - 1.4} anchor="middle" size={1.8}>USB_E12</Silk>
      <Silk x={104} y={L.headersY - 1.4} anchor="middle" size={1.8}>USB_E34</Silk>
      <Silk x={133} y={L.headersY - 1.4} anchor="middle" size={1.8}>CHA_FAN1</Silk>

      {/* Super I/O y chips */}
      <rect x="196" y="146" width="12" height="12" fill="#121213" stroke="#3a3a3d" strokeWidth=".3" />
      <rect x="182" y="168" width="8" height="5" fill="#121213" />
      <rect x="36" y="112" width="10" height="7" fill="#121213" />
      <Silk x={b.form === 'ATX' ? 150 : 150} y={b.form === 'ATX' ? 285 : 223} size={3.6} op={.55}>{b.silk}</Silk>
    </g>
  );
}

// ═══════════════════════════════════════════════════════ VISTA PREVIA ══

export function MoboPreview({ b, style }) {
  const L = LAYOUTS[b.form];
  return (
    <svg viewBox={`-6 -6 ${L.w + 12} ${305 + 12}`} style={style} role="img" aria-label={b.name}>
      <g transform={`translate(0 ${(305 - L.h) / 2})`} filter="url(#asm-shadow)">
        <MoboArt b={b} />
      </g>
    </svg>
  );
}
