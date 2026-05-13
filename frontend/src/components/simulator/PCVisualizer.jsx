import { useState, useEffect, useRef } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fade = (on) => ({
  opacity: on ? 1 : 0,
  transition: 'opacity 0.45s ease',
  pointerEvents: 'none',
});

// Fan blade paths around a center
function FanBlades({ cx, cy, r, color = '#475569', n = 6, powered }) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n;
    const rad = (a * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * (r * 0.35);
    const y1 = cy + Math.sin(rad) * (r * 0.35);
    const x2 = cx + Math.cos(rad) * (r * 0.9);
    const y2 = cy + Math.sin(rad) * (r * 0.9);
    return (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'stroke .3s' }}
      />
    );
  });
}

// Slot placeholder when component not selected
function EmptySlot({ x, y, w, h, label, rx = 2 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx}
        fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.08)"
        strokeWidth="1" strokeDasharray="4 3"
      />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle"
        fill="rgba(255,255,255,.15)" fontSize="6.5" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

// ─── PC Case SVG ──────────────────────────────────────────────────────────────

export function PCCaseView({ build, powered }) {
  const has = (k) => !!build[k];
  const ramColor = build.ram?.type === 'DDR5' ? ['#1e3a5f', '#3b82f6'] : ['#0f302a', '#0d9488'];
  const cpuColor = build.cpu?.brand === 'AMD' ? ['#14532d', '#16a34a'] : ['#3b2e0a', '#ca8a04'];

  return (
    <svg viewBox="0 0 210 300" style={{ width: '100%', maxWidth: 200, display: 'block' }}>

      {/* ── Case body ── */}
      <rect x="3" y="3" width="178" height="290" rx="9"
        fill="#0c111d" stroke="#1e2d40" strokeWidth="2" />

      {/* Front panel strip */}
      <rect x="3" y="3" width="14" height="290" rx="7"
        fill="#111827" stroke="#1e2d40" strokeWidth="1" />

      {/* Side glass window */}
      <rect x="150" y="18" width="25" height="258" rx="3"
        fill="rgba(147,210,255,.04)" stroke="#1e3a5f" strokeWidth="1" />

      {/* ── Motherboard PCB ── */}
      {has('motherboard') ? (
        <g style={fade(true)}>
          <rect x="22" y="12" width="122" height="195" rx="3"
            fill="#061a0d" stroke="#15803d" strokeWidth="1.5" />
          {/* PCB trace lines */}
          {[45, 70, 95, 120, 145].map(y => (
            <line key={y} x1="22" y1={y} x2="144" y2={y}
              stroke="#166534" strokeWidth="0.4" opacity="0.35" />
          ))}
          {[55, 90, 115].map(x => (
            <line key={x} x1={x} y1="12" x2={x} y2="207"
              stroke="#166534" strokeWidth="0.4" opacity="0.25" />
          ))}
        </g>
      ) : (
        <EmptySlot x="22" y="12" w="122" h="195" label="TARJETA MADRE" rx="3" />
      )}

      {/* ── CPU socket ── */}
      {has('motherboard') && (
        <rect x="28" y="28" width="50" height="50" rx="2"
          fill="#141414" stroke="#44403c" strokeWidth="1" />
      )}

      {/* ── CPU chip ── */}
      {has('cpu') ? (
        <g style={fade(true)}>
          <rect x="34" y="34" width="38" height="38" rx="1.5"
            fill={cpuColor[0]} stroke={cpuColor[1]} strokeWidth="1.5" />
          <rect x="38" y="38" width="30" height="30" rx="1"
            fill={cpuColor[0]} opacity=".7" />
          {/* Die matrix */}
          {[0, 1, 2].map(row => [0, 1, 2].map(col => (
            <rect key={`${row}-${col}`}
              x={40 + col * 9} y={40 + row * 9}
              width="7" height="7" rx="0.5"
              fill={cpuColor[1]} opacity=".5" />
          )))}
          <text x="53" y="56" textAnchor="middle" fill="rgba(255,255,255,.7)"
            fontSize="5" fontFamily="monospace" fontWeight="bold">
            {build.cpu?.brand?.toUpperCase()}
          </text>
        </g>
      ) : has('motherboard') && (
        <EmptySlot x="34" y="34" w="38" h="38" label="CPU" rx="2" />
      )}

      {/* ── Cooler ── */}
      {has('cooler') ? (
        <g style={fade(true)}>
          {/* Heatsink base */}
          <rect x="18" y="18" width="70" height="70" rx="35"
            fill="#1e293b" stroke="#475569" strokeWidth="1.5" opacity=".9" />
          {/* Heatsink fins */}
          {[-18, -12, -6, 0, 6, 12, 18].map(offset => (
            <line key={offset}
              x1={53 + offset} y1="24" x2={53 + offset} y2="82"
              stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          ))}
          {/* Fan ring */}
          <circle cx="53" cy="53" r="26"
            fill="none" stroke="#475569" strokeWidth="1.5" />
          <FanBlades cx={53} cy={53} r={22}
            color={powered ? '#94a3b8' : '#475569'} powered={powered} />
          <circle cx="53" cy="53" r="5" fill="#334155" stroke="#475569" />
        </g>
      ) : has('motherboard') && (
        <EmptySlot x="24" y="24" w="58" h="58" label="COOLER" rx="29" />
      )}

      {/* ── RAM sticks ── */}
      {has('ram') ? (
        <g style={fade(true)}>
          {/* Stick 1 */}
          <rect x="84" y="13" width="13" height="90" rx="1.5"
            fill={ramColor[0]} stroke={ramColor[1]} strokeWidth="1.5" />
          {[18, 30, 42, 54, 66, 78, 88].map(y => (
            <rect key={y} x="86" y={y} width="9" height="8" rx="0.5"
              fill={ramColor[1]} opacity=".5" />
          ))}
          {/* Stick 2 */}
          <rect x="101" y="13" width="13" height="90" rx="1.5"
            fill={ramColor[0]} stroke={ramColor[1]} strokeWidth="1.5" />
          {[18, 30, 42, 54, 66, 78, 88].map(y => (
            <rect key={y} x="103" y={y} width="9" height="8" rx="0.5"
              fill={ramColor[1]} opacity=".5" />
          ))}
          {/* RGB edge */}
          <rect x="84" y="13" width="13" height="3" rx="1"
            fill={powered ? ramColor[1] : 'transparent'} opacity=".8" />
          <rect x="101" y="13" width="13" height="3" rx="1"
            fill={powered ? ramColor[1] : 'transparent'} opacity=".8" />
        </g>
      ) : has('motherboard') && (
        <>
          <EmptySlot x="84" y="13" w="13" h="90" label="" rx="1" />
          <EmptySlot x="101" y="13" w="13" h="90" label="" rx="1" />
        </>
      )}

      {/* ── PCIe x16 slot ── */}
      {has('motherboard') && (
        <rect x="22" y="162" width="122" height="5" rx="1"
          fill="#0f1a0f" stroke="#166534" strokeWidth="1" />
      )}

      {/* ── GPU ── */}
      {has('gpu') && build.gpu?.id !== 'igpu' ? (
        <g style={fade(true)}>
          <rect x="22" y="146" width="138" height="26" rx="2"
            fill="#111827" stroke="#374151" strokeWidth="1.5" />
          {/* Shroud */}
          <rect x="22" y="146" width="88" height="26" rx="2"
            fill="#1e293b" />
          {/* Fan 1 */}
          <circle cx="48" cy="159" r="10" fill="#0f172a" stroke="#374151" />
          <FanBlades cx={48} cy={159} r={8} color={powered ? '#64748b' : '#334155'} n={5} />
          <circle cx="48" cy="159" r="3" fill="#1e293b" />
          {/* Fan 2 */}
          <circle cx="78" cy="159" r="10" fill="#0f172a" stroke="#374151" />
          <FanBlades cx={78} cy={159} r={8} color={powered ? '#64748b' : '#334155'} n={5} />
          <circle cx="78" cy="159" r="3" fill="#1e293b" />
          {/* RGB strip */}
          <rect x="22" y="170" width="138" height="2.5" rx="1"
            fill={powered ? '#7c3aed' : '#1e1b4b'} style={{ transition: 'fill .5s' }} />
          {/* Label */}
          <text x="118" y="162" textAnchor="middle" fill="#4b5563"
            fontSize="6" fontFamily="monospace">
            {build.gpu?.vram}GB
          </text>
        </g>
      ) : has('motherboard') && (
        <EmptySlot x="22" y="146" w="138" h="26" label="GPU" rx="2" />
      )}

      {/* ── Storage ── */}
      {has('storage') ? (
        <g style={fade(true)}>
          <rect x="22" y="184" width="82" height="15" rx="2"
            fill="#1e293b" stroke="#374151" strokeWidth="1.5" />
          {/* NVMe chips */}
          {[24, 36, 48, 60, 72].map(x => (
            <rect key={x} x={x} y="187" width="8" height="9" rx="0.5"
              fill="#111827" stroke="#1d4ed8" strokeWidth=".5" opacity=".8" />
          ))}
          <text x="63" y="195" textAnchor="middle" fill="#4b5563"
            fontSize="5.5" fontFamily="monospace">
            {build.storage?.type}
          </text>
        </g>
      ) : has('motherboard') && (
        <EmptySlot x="22" y="184" w="82" h="15" label="STORAGE" rx="2" />
      )}

      {/* ── PSU ── */}
      {has('psu') ? (
        <g style={fade(true)}>
          <rect x="22" y="215" width="140" height="40" rx="3"
            fill="#111827" stroke="#374151" strokeWidth="1.5" />
          {/* PSU fan */}
          <circle cx="145" cy="235" r="14" fill="#0a0f1a" stroke="#1e293b" />
          <FanBlades cx={145} cy={235} r={11} color={powered ? '#475569' : '#1e293b'} n={7} />
          <circle cx="145" cy="235" r="4" fill="#111827" stroke="#374151" />
          {/* Label */}
          <text x="75" y="232" textAnchor="middle" fill="#374151"
            fontSize="7" fontFamily="monospace" fontWeight="bold">
            {build.psu?.watt}W
          </text>
          <text x="75" y="243" textAnchor="middle" fill="#374151"
            fontSize="5.5" fontFamily="monospace">
            80+ {build.psu?.eff}
          </text>
          {/* Cables */}
          {powered && [40, 60, 80, 100].map(x => (
            <line key={x} x1={x} y1="215" x2={x - 5} y2="205"
              stroke="#fbbf24" strokeWidth=".8" opacity=".4" />
          ))}
        </g>
      ) : (
        <EmptySlot x="22" y="215" w="140" h="40" label="FUENTE DE PODER (PSU)" rx="3" />
      )}

      {/* ── Case fans (rear) ── */}
      {has('pcCase') && (
        <g style={fade(true)}>
          <circle cx="185" cy="65" r="16" fill="#0a0f1a" stroke="#1e293b" />
          <FanBlades cx={185} cy={65} r={13} color={powered ? '#475569' : '#1e293b'} n={7} />
          <circle cx="185" cy="65" r="4" fill="#111827" />
          <circle cx="185" cy="120" r="16" fill="#0a0f1a" stroke="#1e293b" />
          <FanBlades cx={185} cy={120} r={13} color={powered ? '#475569' : '#1e293b'} n={7} />
          <circle cx="185" cy="120" r="4" fill="#111827" />
        </g>
      )}

      {/* ── Front panel: power LED + button ── */}
      <circle cx="12" cy="40" r="4"
        fill={powered ? '#22c55e' : '#1e293b'} stroke="#374151"
        style={{ transition: 'fill .5s' }}>
        {powered && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
      </circle>
      <rect x="8" y="52" width="8" height="8" rx="4"
        fill="#111827" stroke={powered ? '#22c55e' : '#374151'}
        strokeWidth="1.5" style={{ transition: 'stroke .3s' }} />

      {/* ── Labels ── */}
      <text x="3" y="298" fill="#1e293b" fontSize="6" fontFamily="monospace">
        PC BUILDER SIMULATOR
      </text>
    </svg>
  );
}

// ─── POST lines generator ─────────────────────────────────────────────────────

export function generatePostLines(build) {
  const lines = [
    '═══════════════════════════════',
    'UEFI BIOS v5.0.1  |  POST',
    `© 2025  ${build.motherboard?.name?.split(' ').slice(0, 3).join(' ')}`,
    '═══════════════════════════════',
    '',
    'Iniciando detección de hardware...',
    '',
    `CPU: ${build.cpu?.name}`,
    `     ${build.cpu?.cores}C/${build.cpu?.threads}T  ${build.cpu?.ghz}–${build.cpu?.turbo} GHz  [OK]`,
    '',
    `RAM: ${build.ram?.gb}GB ${build.ram?.type}-${build.ram?.mhz}`,
    `     Frecuencia efectiva verificada  [OK]`,
    '',
    build.gpu?.id !== 'igpu'
      ? `GPU: ${build.gpu?.name}  ${build.gpu?.vram}GB VRAM  [OK]`
      : 'GPU: Gráficos integrados detectados  [OK]',
    '',
    `STO: ${build.storage?.name}  [OK]`,
    '',
    `PSU: ${build.psu?.watt}W 80+ ${build.psu?.eff}  [OK]`,
    '',
    '─── Hardware check completo ───',
    '',
    'Cargando sistema operativo...',
  ];
  return lines;
}

// ─── Monitor display ──────────────────────────────────────────────────────────

function ScreenContent({ bootState, postLines, build, analysis }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [postLines]);

  if (bootState === 'off') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#1e293b', fontSize: 11, fontFamily: 'monospace' }}>■ SIN SEÑAL</div>
      </div>
    );
  }

  if (bootState === 'nosignal') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>NO SIGNAL</div>
        <div style={{ color: '#374151', fontSize: 8, fontFamily: 'monospace' }}>Conecta un monitor para ver la salida</div>
      </div>
    );
  }

  if (bootState === 'booting') {
    return (
      <div style={{ padding: '10px 12px', height: '100%', overflowY: 'hidden', fontFamily: 'monospace', fontSize: 8.5, color: '#00e676', lineHeight: 1.65, background: '#030d03' }}>
        {postLines.map((line, i) => (
          <div key={i} style={{ opacity: 1 }}>
            {line === '' ? <br /> : line}
          </div>
        ))}
        <span style={{ animation: 'pc-cursor 1s steps(1) infinite' }}>▮</span>
        <div ref={endRef} />
      </div>
    );
  }

  if (bootState === 'bios') {
    return (
      <div style={{ height: '100%', fontFamily: 'monospace', fontSize: 8, color: '#cbd5e1', background: '#0a0f1a', overflowY: 'auto' }}>
        {/* BIOS header bar */}
        <div style={{ background: '#1e40af', color: '#fff', padding: '3px 8px', fontSize: 8.5, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>UEFI BIOS Setup Utility</span>
          <span style={{ opacity: .6 }}>v5.0.1</span>
        </div>
        {/* Nav tabs */}
        <div style={{ background: '#0f172a', display: 'flex', gap: 1, borderBottom: '1px solid #1e3a5f', padding: '0 2px' }}>
          {['Main', 'Advanced', 'Boot', 'Security', 'Exit'].map((tab, i) => (
            <div key={tab} style={{ padding: '2px 7px', fontSize: 7, background: i === 0 ? '#1e3a5f' : 'transparent', color: i === 0 ? '#fff' : '#64748b' }}>
              {tab}
            </div>
          ))}
        </div>

        <div style={{ padding: '6px 10px', display: 'grid', gap: 3 }}>
          <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 2 }}>
            {build.motherboard?.name}  ·  {build.motherboard?.socket}
          </div>

          {[
            ['Procesador',  `${build.cpu?.name}`],
            ['Velocidad',   `${build.cpu?.ghz}–${build.cpu?.turbo} GHz   Núcleos: ${build.cpu?.cores}C/${build.cpu?.threads}T`],
            ['Temperatura', `${28 + (build.cpu?.tdp || 65) / 10 | 0}°C (idle)`],
            ['Memoria',     `${build.ram?.gb}GB ${build.ram?.type}-${build.ram?.mhz}`],
            ['Gráficos',    build.gpu?.id !== 'igpu' ? `${build.gpu?.name}  ${build.gpu?.vram}GB VRAM` : 'Integrados'],
            ['Almacenamiento', build.storage?.name],
            ['PSU',         `${build.psu?.watt}W 80+ ${build.psu?.eff}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', borderBottom: '1px solid rgba(30,58,95,.5)', paddingBottom: 2 }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ color: '#22c55e' }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: 5, padding: '4px 6px', background: '#0a2a12', border: '1px solid #166534', borderRadius: 2, color: '#4ade80', fontSize: 7 }}>
            ✓ Sistema iniciado correctamente — Todos los componentes detectados
          </div>
          <div style={{ color: '#475569', fontSize: 7, marginTop: 2 }}>
            [DEL] BIOS Setup  ·  [F12] Boot Menu  ·  [F8] Flash BIOS
          </div>
        </div>
      </div>
    );
  }

  if (bootState === 'bsod') {
    return (
      <div style={{ height: '100%', background: '#0050ef', color: '#fff', fontFamily: '"Segoe UI", Arial, sans-serif', padding: '14px 16px', overflow: 'hidden' }}>
        {/* Windows logo area */}
        <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1 }}>:(</div>
        <div style={{ fontSize: 9.5, marginBottom: 10, lineHeight: 1.5, maxWidth: 200 }}>
          Tu PC tuvo un problema de hardware y necesita reiniciarse.
          Estamos recopilando información del error.
        </div>

        <div style={{ fontSize: 20, fontWeight: 300, marginBottom: 10, opacity: .4 }}>
          0%
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 7.5, fontFamily: 'monospace', color: '#add8e6', marginBottom: 4, letterSpacing: '.05em' }}>
            STOP CODE:
          </div>
          <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>
            HARDWARE_INCOMPATIBILITY_ERROR
          </div>
        </div>

        <div style={{ fontSize: 7, fontFamily: 'monospace', color: '#add8e6', lineHeight: 1.7 }}>
          {analysis.errors.map((e, i) => (
            <div key={i}>⚠ {e}</div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 10, left: 16, right: 16, fontSize: 7, fontFamily: 'monospace', color: 'rgba(255,255,255,.4)' }}>
          Para más información: segedu.chakuy.online/soporte
        </div>
      </div>
    );
  }

  return null;
}

export function MonitorDisplay({ bootState, postLines, build, analysis }) {
  const isOn = bootState !== 'off';
  const screenBg = {
    off: '#050508',
    nosignal: '#080a10',
    booting: '#030d03',
    bios: '#0a0f1a',
    bsod: '#0050ef',
  }[bootState] || '#000';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      {/* Monitor outer frame */}
      <div style={{
        width: '100%', maxWidth: 230,
        background: '#0f172a',
        border: '2px solid #1e293b',
        borderRadius: '8px 8px 0 0',
        padding: '8px 8px 6px',
        position: 'relative',
        boxShadow: isOn ? '0 0 20px rgba(56,189,248,.1)' : 'none',
        transition: 'box-shadow .5s',
      }}>
        {/* Brand dot + power LED */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#1e293b' }} />
        <div style={{ position: 'absolute', top: 6, right: 12, width: 7, height: 7, borderRadius: '50%', background: isOn ? '#22c55e' : '#1e293b', transition: 'background .4s', boxShadow: isOn ? '0 0 6px #22c55e' : 'none' }} />

        {/* Screen */}
        <div style={{
          background: screenBg,
          borderRadius: 4,
          overflow: 'hidden',
          height: 155,
          position: 'relative',
          transition: 'background .3s',
          border: '1px solid #0f172a',
        }}>
          {/* Scanline overlay (CRT effect on BIOS) */}
          {(bootState === 'booting' || bootState === 'bios') && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px)',
            }} />
          )}
          {/* Screen flicker on boot */}
          {bootState === 'booting' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(0,255,100,.03)', animation: 'pc-flicker 4s linear infinite', pointerEvents: 'none' }} />
          )}
          <ScreenContent bootState={bootState} postLines={postLines} build={build} analysis={analysis} />
        </div>
      </div>

      {/* Monitor neck */}
      <div style={{ width: 32, height: 16, background: '#0f172a', borderLeft: '2px solid #1e293b', borderRight: '2px solid #1e293b' }} />
      {/* Monitor base */}
      <div style={{ width: 90, height: 9, background: '#0f172a', borderRadius: '0 0 6px 6px', border: '2px solid #1e293b', borderTop: 'none' }} />

      {/* Monitor label */}
      {build.monitor && (
        <div style={{ marginTop: 5, fontSize: '.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,.25)', letterSpacing: '.06em' }}>
          {build.monitor.res} · {build.monitor.hz}Hz
        </div>
      )}
    </div>
  );
}
