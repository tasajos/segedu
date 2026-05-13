import { useState, useMemo } from 'react';
import './PCBuilderSimulator.css';

// ═══════════════════════════════════════════════════════ CATALOG ══════════════

const CATALOG = {
  cpu: [
    { id:'i3-12100',  name:'Intel Core i3-12100',   socket:'LGA1700', tdp:89,  cores:4,  threads:8,  ghz:3.3, turbo:4.3, score:3,  price:130, igpu:true,  brand:'Intel' },
    { id:'i5-12600k', name:'Intel Core i5-12600K',  socket:'LGA1700', tdp:125, cores:10, threads:16, ghz:3.7, turbo:4.9, score:5,  price:220, igpu:true,  brand:'Intel' },
    { id:'i7-13700k', name:'Intel Core i7-13700K',  socket:'LGA1700', tdp:125, cores:16, threads:24, ghz:3.4, turbo:5.4, score:7,  price:380, igpu:true,  brand:'Intel' },
    { id:'i9-13900k', name:'Intel Core i9-13900K',  socket:'LGA1700', tdp:253, cores:24, threads:32, ghz:3.0, turbo:5.8, score:9,  price:550, igpu:true,  brand:'Intel' },
    { id:'r5-5600',   name:'AMD Ryzen 5 5600',      socket:'AM4',     tdp:65,  cores:6,  threads:12, ghz:3.5, turbo:4.4, score:4,  price:140, igpu:false, brand:'AMD'   },
    { id:'r7-5800x',  name:'AMD Ryzen 7 5800X',     socket:'AM4',     tdp:105, cores:8,  threads:16, ghz:3.8, turbo:4.7, score:6,  price:250, igpu:false, brand:'AMD'   },
    { id:'r9-7900x',  name:'AMD Ryzen 9 7900X',     socket:'AM5',     tdp:170, cores:12, threads:24, ghz:4.7, turbo:5.6, score:8,  price:400, igpu:true,  brand:'AMD'   },
    { id:'r9-7950x',  name:'AMD Ryzen 9 7950X',     socket:'AM5',     tdp:170, cores:16, threads:32, ghz:4.5, turbo:5.7, score:10, price:600, igpu:true,  brand:'AMD'   },
  ],
  motherboard: [
    { id:'b660m',  name:'MSI B660M Pro-A DDR4',     socket:'LGA1700', ramType:'DDR4', maxRam:64,  form:'mATX', slots:2, price:100 },
    { id:'z690',   name:'ASUS ROG STRIX Z690-F',    socket:'LGA1700', ramType:'DDR5', maxRam:128, form:'ATX',  slots:4, price:200 },
    { id:'b550',   name:'Gigabyte B550M DS3H',      socket:'AM4',     ramType:'DDR4', maxRam:128, form:'mATX', slots:2, price:80  },
    { id:'x570',   name:'MSI MEG X570 ACE',         socket:'AM4',     ramType:'DDR4', maxRam:128, form:'ATX',  slots:4, price:180 },
    { id:'b650',   name:'MSI MAG B650 Tomahawk',    socket:'AM5',     ramType:'DDR5', maxRam:128, form:'ATX',  slots:4, price:150 },
    { id:'x670e',  name:'MSI MEG X670E Ace',        socket:'AM5',     ramType:'DDR5', maxRam:256, form:'ATX',  slots:4, price:280 },
  ],
  ram: [
    { id:'ddr4-8',   name:'8 GB DDR4-3200',    type:'DDR4', gb:8,   mhz:3200, score:1, price:25  },
    { id:'ddr4-16',  name:'16 GB DDR4-3200',   type:'DDR4', gb:16,  mhz:3200, score:2, price:45  },
    { id:'ddr4-32',  name:'32 GB DDR4-3600',   type:'DDR4', gb:32,  mhz:3600, score:3, price:85  },
    { id:'ddr5-16',  name:'16 GB DDR5-5200',   type:'DDR5', gb:16,  mhz:5200, score:2, price:60  },
    { id:'ddr5-32',  name:'32 GB DDR5-6000',   type:'DDR5', gb:32,  mhz:6000, score:3, price:110 },
    { id:'ddr5-64',  name:'64 GB DDR5-6000',   type:'DDR5', gb:64,  mhz:6000, score:4, price:200 },
  ],
  storage: [
    { id:'sata256', name:'256 GB SSD SATA',     type:'SATA SSD', gb:256,  score:1, price:30  },
    { id:'nvme500', name:'500 GB SSD NVMe M.2', type:'NVMe SSD', gb:500,  score:2, price:45  },
    { id:'nvme1tb', name:'1 TB SSD NVMe M.2',   type:'NVMe SSD', gb:1024, score:3, price:80  },
    { id:'nvme2tb', name:'2 TB SSD NVMe M.2',   type:'NVMe SSD', gb:2048, score:3, price:140 },
    { id:'hdd1tb',  name:'1 TB HDD 7200 RPM',   type:'HDD',      gb:1024, score:1, price:45  },
    { id:'hdd4tb',  name:'4 TB HDD 7200 RPM',   type:'HDD',      gb:4096, score:1, price:80  },
  ],
  gpu: [
    { id:'igpu',     name:'Gráficos Integrados (iGPU)', vram:0,  watt:15,  score:0,  price:0,    tier:'igpu' },
    { id:'gtx1650',  name:'NVIDIA GeForce GTX 1650',    vram:4,  watt:75,  score:2,  price:160,  tier:'low'  },
    { id:'rx6600',   name:'AMD Radeon RX 6600',          vram:8,  watt:132, score:3,  price:230,  tier:'mid'  },
    { id:'rtx3060',  name:'NVIDIA GeForce RTX 3060',    vram:12, watt:170, score:4,  price:290,  tier:'mid'  },
    { id:'rx6800xt', name:'AMD Radeon RX 6800 XT',      vram:16, watt:300, score:6,  price:480,  tier:'high' },
    { id:'rtx3080',  name:'NVIDIA GeForce RTX 3080',    vram:10, watt:320, score:7,  price:600,  tier:'high' },
    { id:'rtx4090',  name:'NVIDIA GeForce RTX 4090',    vram:24, watt:450, score:10, price:1500, tier:'elite'},
  ],
  psu: [
    { id:'450b',  name:'450W 80+ Bronze',    watt:450,  eff:'Bronze',   price:45  },
    { id:'550b',  name:'550W 80+ Bronze',    watt:550,  eff:'Bronze',   price:55  },
    { id:'650g',  name:'650W 80+ Gold',      watt:650,  eff:'Gold',     price:75  },
    { id:'750g',  name:'750W 80+ Gold',      watt:750,  eff:'Gold',     price:90  },
    { id:'850p',  name:'850W 80+ Platinum',  watt:850,  eff:'Platinum', price:120 },
    { id:'1000p', name:'1000W 80+ Platinum', watt:1000, eff:'Platinum', price:160 },
    { id:'1200t', name:'1200W 80+ Titanium', watt:1200, eff:'Titanium', price:220 },
  ],
  cooler: [
    { id:'stock65',  name:'Disipador Stock 65W',             tdp:65,  type:'Aire',    price:0   },
    { id:'wraith',   name:'AMD Wraith Stealth',              tdp:95,  type:'Aire',    price:0   },
    { id:'air125',   name:'Cooler Master Hyper 212 (125W)',  tdp:125, type:'Aire',    price:35  },
    { id:'nhd15',    name:'Noctua NH-D15 (250W)',            tdp:250, type:'Aire',    price:100 },
    { id:'aio240',   name:'AIO Refrigeración Líquida 240mm',tdp:200, type:'Líquido', price:90  },
    { id:'aio360',   name:'AIO Refrigeración Líquida 360mm',tdp:350, type:'Líquido', price:155 },
  ],
  pcCase: [
    { id:'matx',   name:'Gabinete Compacto mATX',      fits:['mATX'],       fans:2, price:55  },
    { id:'midatx', name:'Gabinete ATX Mid Tower',       fits:['mATX','ATX'], fans:3, price:75  },
    { id:'midpro', name:'Gabinete ATX Mid — Vidrio',    fits:['mATX','ATX'], fans:4, price:105 },
    { id:'full',   name:'Gabinete ATX Full Tower',      fits:['mATX','ATX'], fans:6, price:185 },
  ],
  monitor: [
    { id:'fhd60',  name:'21" Full HD 1080p 60Hz',             res:'1920×1080', hz:60,  inch:21, price:120 },
    { id:'fhd144', name:'24" Full HD 1080p 144Hz',            res:'1920×1080', hz:144, inch:24, price:185 },
    { id:'qhd165', name:'27" QHD 1440p 165Hz',                res:'2560×1440', hz:165, inch:27, price:285 },
    { id:'4k60',   name:'27" 4K UHD 60Hz',                    res:'3840×2160', hz:60,  inch:27, price:360 },
    { id:'4k144',  name:'32" 4K UHD 144Hz',                   res:'3840×2160', hz:144, inch:32, price:620 },
    { id:'uw144',  name:'34" Ultrawide QHD 1440p 144Hz',      res:'3440×1440', hz:144, inch:34, price:455 },
  ],
  peripherals: [
    { id:'basic',  name:'Teclado Membrana + Ratón óptico',    price:30  },
    { id:'gaming', name:'Teclado Gaming + Ratón 6400 DPI',    price:85  },
    { id:'mech',   name:'Teclado Mecánico + Ratón Pro 25600 DPI', price:190 },
  ],
};

// ═══════════════════════════════════════════════════════ SLOT DEFS ════════════

const SLOTS = [
  {
    key: 'cpu', label: 'Procesador (CPU)', icon: '🧠', required: true,
    specs: c => [`${c.cores} núcleos / ${c.threads} hilos`, `${c.ghz}–${c.turbo} GHz`, `TDP ${c.tdp}W`, `Socket ${c.socket}`, c.igpu ? 'iGPU integrada' : 'Sin iGPU'],
  },
  {
    key: 'motherboard', label: 'Tarjeta Madre', icon: '🖥️', required: true,
    specs: c => [`Socket ${c.socket}`, c.ramType, `${c.slots} slots RAM`, `Máx. ${c.maxRam} GB`, c.form],
  },
  {
    key: 'ram', label: 'Memoria RAM', icon: '💾', required: true,
    specs: c => [`${c.gb} GB`, c.type, `${c.mhz} MHz`],
  },
  {
    key: 'storage', label: 'Almacenamiento', icon: '💿', required: true,
    specs: c => [c.gb >= 1000 ? `${c.gb/1000} TB` : `${c.gb} GB`, c.type],
  },
  {
    key: 'gpu', label: 'Tarjeta de Video (GPU)', icon: '🎮', required: false,
    specs: c => c.vram ? [`${c.vram} GB VRAM`, `${c.watt}W TDP`] : ['Gráficos integrados'],
  },
  {
    key: 'psu', label: 'Fuente de Poder (PSU)', icon: '⚡', required: true,
    specs: c => [`${c.watt}W`, `Eficiencia ${c.eff}`],
  },
  {
    key: 'cooler', label: 'Disipador / Cooling', icon: '❄️', required: false,
    specs: c => [c.type, `Hasta ${c.tdp}W TDP`],
  },
  {
    key: 'pcCase', label: 'Gabinete', icon: '🗄️', required: false,
    specs: c => [`${c.fans} ventiladores`, `Formatos: ${c.fits.join(', ')}`],
  },
  {
    key: 'monitor', label: 'Monitor', icon: '🖥️', required: false,
    specs: c => [c.res, `${c.hz} Hz`, `${c.inch} pulgadas`],
  },
  {
    key: 'peripherals', label: 'Periféricos', icon: '⌨️', required: false,
    specs: () => [],
  },
];

// ═══════════════════════════════════════════════════════ LOGIC ════════════════

function analyzeBuild(build) {
  const { cpu, motherboard, ram, storage, gpu, psu, cooler, pcCase } = build;
  const missing = [];
  const errors  = [];
  const warnings = [];

  if (!cpu)         missing.push('Procesador (CPU)');
  if (!motherboard) missing.push('Tarjeta Madre');
  if (!ram)         missing.push('Memoria RAM');
  if (!storage)     missing.push('Almacenamiento');
  if (!psu)         missing.push('Fuente de Poder');

  if (cpu && motherboard && cpu.socket !== motherboard.socket)
    errors.push(`Socket del CPU (${cpu.socket}) no coincide con la placa madre (${motherboard.socket})`);

  if (ram && motherboard && ram.type !== motherboard.ramType)
    errors.push(`RAM tipo ${ram.type} es incompatible con la placa madre (requiere ${motherboard.ramType})`);

  if (ram && motherboard && ram.gb > motherboard.maxRam)
    errors.push(`RAM ${ram.gb}GB supera el máximo de la placa madre (${motherboard.maxRam}GB)`);

  if (gpu?.id === 'igpu' && cpu && !cpu.igpu)
    errors.push(`El CPU ${cpu.name} no tiene gráficos integrados — se requiere GPU dedicada`);

  if (psu && cpu && gpu) {
    const needed = cpu.tdp + (gpu.id !== 'igpu' ? gpu.watt : 0) + 100;
    if (psu.watt < needed)
      errors.push(`Fuente ${psu.watt}W insuficiente — consumo estimado del sistema: ~${needed}W`);
    else if (psu.watt < needed * 1.2)
      warnings.push(`Fuente con margen ajustado (${psu.watt}W vs ~${needed}W requeridos) — considera una más potente`);
  }

  if (cooler && cpu && cooler.tdp < cpu.tdp)
    errors.push(`El disipador soporta ${cooler.tdp}W pero el CPU genera ${cpu.tdp}W de calor`);
  else if (cooler && cpu && cooler.tdp < cpu.tdp * 1.1)
    warnings.push(`El disipador tiene poco margen térmico para este CPU`);

  if (pcCase && motherboard && !pcCase.fits.includes(motherboard.form))
    errors.push(`El gabinete no admite placa madre ${motherboard.form} (soporta: ${pcCase.fits.join(', ')})`);

  const canPowerOn = missing.length === 0 && errors.length === 0;
  return { missing, errors, warnings, canPowerOn };
}

function getTier(build) {
  const { cpu, gpu, ram, storage, monitor } = build;
  if (!cpu || !ram) return null;
  const score = (cpu?.score||0) + (gpu?.score||0) + (ram?.score||0) + (storage?.score||0) + (monitor ? 1 : 0);

  if (score >= 22) return { label:'GAMA ALTA',  sub:'Estación de trabajo / Gaming Elite', color:'#a855f7', glow:'rgba(168,85,247,.3)', emoji:'🚀',
    uses:['Gaming 4K 144Hz', 'Renderizado 3D profesional', 'Edición de video 8K', 'Machine Learning / IA', 'Streaming en vivo'],
    nota: 'Configuración de primer nivel, sin compromisos. Ideal para profesionales y gamers exigentes.' };
  if (score >= 15) return { label:'GAMA ALTA',  sub:'Gaming / Creación de Contenido',     color:'#6366f1', glow:'rgba(99,102,241,.3)',  emoji:'🎮',
    uses:['Gaming 1440p–4K', 'Edición de video 4K', 'Diseño gráfico', 'Streaming 1080p/1440p'],
    nota: 'Excelente rendimiento para gaming y trabajo creativo a resoluciones altas.' };
  if (score >= 9)  return { label:'GAMA MEDIA', sub:'Gaming / Oficina Avanzada',           color:'#3b82f6', glow:'rgba(59,130,246,.3)',  emoji:'💻',
    uses:['Gaming 1080p–1440p', 'Programación', 'Multitarea con apps pesadas', 'Edición de video 1080p'],
    nota: 'Buen equilibrio entre costo y rendimiento. Cubre la mayoría de necesidades cotidianas.' };
  if (score >= 5)  return { label:'GAMA BAJA',  sub:'Oficina / Estudio',                   color:'#22c55e', glow:'rgba(34,197,94,.3)',   emoji:'🖥️',
    uses:['Ofimática (Word, Excel)', 'Navegación web', 'Reproducción multimedia', 'Programación básica'],
    nota: 'Cubre necesidades básicas y ofimáticas con buen rendimiento en tareas cotidianas.' };
  return        { label:'BÁSICA',     sub:'Uso muy básico',                        color:'#f59e0b', glow:'rgba(245,158,11,.3)',  emoji:'⌨️',
    uses:['Correo electrónico', 'Documentos básicos', 'Navegación web ligera'],
    nota: 'Configuración mínima funcional. Ideal solo para tareas muy simples.' };
}

const totalPrice = b => Object.values(b).filter(Boolean).reduce((s, c) => s + (c.price || 0), 0);

function compPowerUse(build) {
  const { cpu, gpu } = build;
  return (cpu?.tdp || 0) + (gpu && gpu.id !== 'igpu' ? gpu.watt : 0) + 100;
}

// ═══════════════════════════════════════════════════════ PICKER MODAL ═════════

function getCompatNote(key, comp, build) {
  const { cpu, motherboard, ram, gpu } = build;
  if (key === 'motherboard' && cpu && comp.socket !== cpu.socket)
    return `Socket ${comp.socket} ≠ CPU (${cpu.socket})`;
  if (key === 'cpu' && motherboard && comp.socket !== motherboard.socket)
    return `Socket ${comp.socket} ≠ Placa (${motherboard.socket})`;
  if (key === 'ram' && motherboard && comp.type !== motherboard.ramType)
    return `${comp.type} ≠ placa (${motherboard.ramType})`;
  if (key === 'gpu' && comp.id === 'igpu' && cpu && !cpu.igpu)
    return `${cpu.name} no tiene iGPU`;
  if (key === 'pcCase' && motherboard && !comp.fits.includes(motherboard.form))
    return `No admite ${motherboard.form}`;
  if (key === 'psu' && cpu && gpu) {
    const needed = cpu.tdp + (gpu.id !== 'igpu' ? gpu.watt : 0) + 100;
    if (comp.watt < needed) return `${comp.watt}W < ~${needed}W requeridos`;
  }
  if (key === 'cooler' && cpu && comp.tdp < cpu.tdp)
    return `${comp.tdp}W < CPU TDP ${cpu.tdp}W`;
  return null;
}

function CompPicker({ slotDef, build, onSelect, onClose }) {
  const options = CATALOG[slotDef.key] || [];
  const current = build[slotDef.key];

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'5vh 1rem', overflowY:'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width:'100%', maxWidth:760, background:'#0f0f23', border:'1px solid rgba(255,255,255,.12)', borderRadius:6, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#111130' }}>
          <div>
            <div style={{ fontSize:'.62rem', letterSpacing:'.14em', color:'rgba(255,255,255,.35)' }}>SELECCIONAR COMPONENTE</div>
            <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', marginTop:'.2rem' }}>{slotDef.icon} {slotDef.label}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:'1.3rem', cursor:'pointer', padding:'.3rem .6rem' }}>✕</button>
        </div>

        {/* Options grid */}
        <div style={{ padding:'1.1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(330px, 1fr))', gap:'.75rem', maxHeight:'65vh', overflowY:'auto' }}>
          {/* Clear option for optional slots */}
          {!slotDef.required && (
            <button
              onClick={() => onSelect(null)}
              style={{ padding:'.75rem 1rem', background:'rgba(255,255,255,.04)', border:'1px dashed rgba(255,255,255,.15)', borderRadius:4, cursor:'pointer', color:'rgba(255,255,255,.4)', fontFamily:'monospace', fontSize:'.8rem', textAlign:'left' }}
            >
              — Sin componente (quitar)
            </button>
          )}
          {options.map(comp => {
            const incompatNote = getCompatNote(slotDef.key, comp, build);
            const isSelected = current?.id === comp.id;
            const specs = slotDef.specs(comp);
            return (
              <button
                key={comp.id}
                onClick={() => onSelect(comp)}
                style={{
                  padding:'.9rem 1rem', border:`1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,.1)'}`,
                  borderRadius:4, cursor:'pointer',
                  background: isSelected ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.03)',
                  textAlign:'left', transition:'border .15s, background .15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.07)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.5rem' }}>
                  <div style={{ fontWeight:700, fontSize:'.88rem', color:'#f1f5f9', lineHeight:1.3 }}>{comp.name}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'.82rem', color:'#fbbf24', whiteSpace:'nowrap', fontWeight:700 }}>
                    {comp.price === 0 ? 'Incluido' : `$${comp.price.toLocaleString()}`}
                  </div>
                </div>
                {specs.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem', marginTop:'.5rem' }}>
                    {specs.map((s, i) => (
                      <span key={i} style={{ padding:'.15rem .45rem', background:'rgba(255,255,255,.08)', borderRadius:2, fontSize:'.7rem', color:'rgba(255,255,255,.6)', fontFamily:'monospace' }}>{s}</span>
                    ))}
                  </div>
                )}
                {incompatNote && (
                  <div style={{ marginTop:'.4rem', fontSize:'.7rem', color:'rgba(251,191,36,.7)', fontFamily:'monospace' }}>
                    ⚠ {incompatNote}
                  </div>
                )}
                {isSelected && (
                  <div style={{ marginTop:'.4rem', fontSize:'.7rem', color:'#818cf8', fontFamily:'monospace' }}>✓ Actualmente seleccionado</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════ SLOT ROW ═════════════

function SlotRow({ slotDef, build, analysis, onOpen }) {
  const comp = build[slotDef.key];
  const hasIssue = analysis.errors.some(e =>
    e.toLowerCase().includes(slotDef.key === 'pcCase' ? 'gabinete' : slotDef.label.toLowerCase().split(' ')[0].toLowerCase())
  );
  const isEmpty = !comp;
  const status = isEmpty
    ? (slotDef.required ? 'required' : 'optional')
    : (hasIssue ? 'error' : 'ok');

  const dotColor = { required:'#6b7280', optional:'#374151', error:'#ef4444', ok:'#22c55e' }[status];
  const dotTitle = { required:'Requerido — sin seleccionar', optional:'Opcional', error:'Incompatible', ok:'Compatible' }[status];

  const specs = comp ? slotDef.specs(comp) : [];

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'32px 1fr auto',
      gap:'.75rem', alignItems:'center',
      padding:'.7rem .9rem',
      background: status === 'error' ? 'rgba(239,68,68,.05)' : 'rgba(255,255,255,.025)',
      border:`1px solid ${status === 'error' ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.07)'}`,
      borderRadius:3, transition:'background .15s'
    }}>
      {/* Icon */}
      <div style={{ fontSize:'1.3rem', textAlign:'center', lineHeight:1 }}>{slotDef.icon}</div>

      {/* Content */}
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom: comp ? '.25rem' : 0 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:dotColor, flexShrink:0 }} title={dotTitle} />
          <span style={{ fontSize:'.68rem', fontFamily:'monospace', color:'rgba(255,255,255,.35)', letterSpacing:'.06em', textTransform:'uppercase' }}>{slotDef.label}</span>
        </div>
        {comp ? (
          <>
            <div style={{ fontWeight:700, fontSize:'.87rem', color:'#f1f5f9', lineHeight:1.3 }}>{comp.name}</div>
            {specs.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.25rem', marginTop:'.3rem' }}>
                {specs.map((s, i) => (
                  <span key={i} style={{ padding:'.1rem .38rem', background:'rgba(255,255,255,.07)', borderRadius:2, fontSize:'.67rem', color:'rgba(255,255,255,.5)', fontFamily:'monospace' }}>{s}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.22)', fontStyle:'italic' }}>
            {slotDef.required ? '— Requerido, sin seleccionar —' : '— Opcional —'}
          </div>
        )}
      </div>

      {/* Price + button */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.35rem', flexShrink:0 }}>
        {comp && (
          <div style={{ fontFamily:'monospace', fontSize:'.78rem', color:'#fbbf24', fontWeight:700 }}>
            {comp.price === 0 ? '—' : `$${comp.price.toLocaleString()}`}
          </div>
        )}
        <button
          onClick={onOpen}
          style={{
            padding:'.25rem .65rem', background:'rgba(99,102,241,.15)',
            border:'1px solid rgba(99,102,241,.3)', color:'#a5b4fc',
            borderRadius:2, cursor:'pointer', fontFamily:'monospace', fontSize:'.7rem',
            whiteSpace:'nowrap', transition:'background .12s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,.15)'}
        >
          {comp ? 'Cambiar' : 'Seleccionar →'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════ REPORT ═══════════════

function ReportPanel({ build, analysis, tier, price }) {
  const powerUse = compPowerUse(build);

  const specRows = SLOTS
    .filter(s => build[s.key])
    .map(s => ({ label: s.label, comp: build[s.key], specs: s.specs(build[s.key]) }));

  return (
    <div className="pc-report" style={{ marginTop:'1.5rem', background:'#0a0a18', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,.08)', background:'#0d0d22', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ fontSize:'.6rem', letterSpacing:'.14em', color:'rgba(255,255,255,.3)' }}>REPORTE DE ENSAMBLAJE</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'1.15rem', marginTop:'.2rem' }}>
            {analysis.canPowerOn ? '✅ Equipo funcional' : '❌ Equipo no funcional'}
          </div>
        </div>
        {tier && (
          <div style={{ padding:'.5rem 1.2rem', background:tier.glow, border:`1px solid ${tier.color}`, borderRadius:4, display:'flex', alignItems:'center', gap:'.6rem' }}>
            <span style={{ fontSize:'1.4rem' }}>{tier.emoji}</span>
            <div>
              <div style={{ fontSize:'.62rem', letterSpacing:'.1em', color:tier.color }}>CLASIFICACIÓN</div>
              <div style={{ fontWeight:900, fontSize:'1.05rem', color:tier.color }}>{tier.label}</div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)' }}>{tier.sub}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'1.25rem 1.5rem', display:'grid', gap:'1.5rem' }}>

        {/* Errors & warnings */}
        {(analysis.errors.length > 0 || analysis.warnings.length > 0 || analysis.missing.length > 0) && (
          <div style={{ display:'grid', gap:'.6rem' }}>
            {analysis.missing.length > 0 && (
              <div style={{ padding:'.75rem 1rem', background:'rgba(107,114,128,.08)', borderLeft:'3px solid #6b7280', borderRadius:2 }}>
                <div style={{ fontSize:'.68rem', fontFamily:'monospace', color:'#9ca3af', letterSpacing:'.08em', marginBottom:'.4rem' }}>COMPONENTES FALTANTES</div>
                {analysis.missing.map((m, i) => <div key={i} style={{ fontSize:'.83rem', color:'#d1d5db' }}>• {m}</div>)}
              </div>
            )}
            {analysis.errors.length > 0 && (
              <div style={{ padding:'.75rem 1rem', background:'rgba(239,68,68,.07)', borderLeft:'3px solid #ef4444', borderRadius:2 }}>
                <div style={{ fontSize:'.68rem', fontFamily:'monospace', color:'#fca5a5', letterSpacing:'.08em', marginBottom:'.4rem' }}>INCOMPATIBILIDADES</div>
                {analysis.errors.map((e, i) => <div key={i} style={{ fontSize:'.83rem', color:'#fca5a5' }}>✕ {e}</div>)}
              </div>
            )}
            {analysis.warnings.length > 0 && (
              <div style={{ padding:'.75rem 1rem', background:'rgba(251,191,36,.07)', borderLeft:'3px solid #fbbf24', borderRadius:2 }}>
                <div style={{ fontSize:'.68rem', fontFamily:'monospace', color:'#fde68a', letterSpacing:'.08em', marginBottom:'.4rem' }}>ADVERTENCIAS</div>
                {analysis.warnings.map((w, i) => <div key={i} style={{ fontSize:'.83rem', color:'#fde68a' }}>⚠ {w}</div>)}
              </div>
            )}
          </div>
        )}

        {/* 2-col: specs + info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          {/* Specs table */}
          <div>
            <div style={{ fontSize:'.62rem', letterSpacing:'.12em', color:'rgba(255,255,255,.3)', marginBottom:'.75rem' }}>ESPECIFICACIONES</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
              {specRows.map((r, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:'.5rem', padding:'.35rem 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ fontSize:'.73rem', color:'rgba(255,255,255,.38)', fontFamily:'monospace' }}>{r.label}</div>
                  <div>
                    <div style={{ fontSize:'.78rem', color:'#e2e8f0', fontWeight:600 }}>{r.comp.name}</div>
                    {r.specs.length > 0 && (
                      <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.4)', fontFamily:'monospace', marginTop:'.1rem' }}>{r.specs.join(' · ')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary + use cases */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Price breakdown */}
            <div>
              <div style={{ fontSize:'.62rem', letterSpacing:'.12em', color:'rgba(255,255,255,.3)', marginBottom:'.75rem' }}>COSTO ESTIMADO</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                {SLOTS.filter(s => build[s.key] && (build[s.key].price || 0) > 0).map(s => (
                  <div key={s.key} style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', padding:'.2rem 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ color:'rgba(255,255,255,.5)', fontFamily:'monospace' }}>{s.label}</span>
                    <span style={{ color:'#fbbf24', fontFamily:'monospace' }}>${build[s.key].price.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'.45rem 0', marginTop:'.3rem', borderTop:'2px solid rgba(255,255,255,.15)' }}>
                  <span style={{ fontWeight:700, fontSize:'.85rem' }}>TOTAL ESTIMADO</span>
                  <span style={{ fontWeight:900, fontSize:'1.1rem', color:'#fbbf24' }}>${price.toLocaleString()}</span>
                </div>
                <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.3)', fontFamily:'monospace' }}>
                  Consumo del sistema: ~{powerUse}W
                </div>
              </div>
            </div>

            {/* Use cases */}
            {tier && (
              <div>
                <div style={{ fontSize:'.62rem', letterSpacing:'.12em', color:'rgba(255,255,255,.3)', marginBottom:'.6rem' }}>RECOMENDADO PARA</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
                  {tier.uses.map((u, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.8rem' }}>
                      <span style={{ color:tier.color, fontSize:'.7rem' }}>▸</span>
                      <span style={{ color:'rgba(255,255,255,.7)' }}>{u}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'.75rem', padding:'.6rem .75rem', background:'rgba(255,255,255,.04)', borderRadius:3, borderLeft:`3px solid ${tier.color}`, fontSize:'.78rem', color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>
                  {tier.nota}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════ MAIN ════════════════

const EMPTY_BUILD = {
  cpu: null, motherboard: null, ram: null, storage: null,
  gpu: CATALOG.gpu[0],  // integrated by default
  psu: null, cooler: null, pcCase: null, monitor: null, peripherals: null,
};

const PRESET_BASIC = {
  cpu: CATALOG.cpu[0], motherboard: CATALOG.motherboard[0], ram: CATALOG.ram[0],
  storage: CATALOG.storage[0], gpu: CATALOG.gpu[0], psu: CATALOG.psu[0],
  cooler: CATALOG.cooler[0], pcCase: CATALOG.pcCase[0], monitor: CATALOG.monitor[0],
  peripherals: CATALOG.peripherals[0],
};
const PRESET_MID = {
  cpu: CATALOG.cpu[4], motherboard: CATALOG.motherboard[2], ram: CATALOG.ram[2],
  storage: CATALOG.storage[2], gpu: CATALOG.gpu[3], psu: CATALOG.psu[2],
  cooler: CATALOG.cooler[2], pcCase: CATALOG.pcCase[1], monitor: CATALOG.monitor[1],
  peripherals: CATALOG.peripherals[1],
};
const PRESET_HIGH = {
  cpu: CATALOG.cpu[6], motherboard: CATALOG.motherboard[4], ram: CATALOG.ram[4],
  storage: CATALOG.storage[3], gpu: CATALOG.gpu[5], psu: CATALOG.psu[4],
  cooler: CATALOG.cooler[4], pcCase: CATALOG.pcCase[2], monitor: CATALOG.monitor[3],
  peripherals: CATALOG.peripherals[2],
};

export default function PCBuilderSimulator() {
  const [build, setBuild] = useState(EMPTY_BUILD);
  const [picker, setPicker] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const analysis = useMemo(() => analyzeBuild(build), [build]);
  const tier      = useMemo(() => getTier(build), [build]);
  const price     = useMemo(() => totalPrice(build), [build]);

  const selectComp = (key, comp) => {
    setBuild(b => ({ ...b, [key]: comp }));
    setPicker(null);
  };

  const loadPreset = (preset) => {
    setBuild(preset);
    setShowReport(false);
  };

  const resetBuild = () => {
    setBuild(EMPTY_BUILD);
    setShowReport(false);
  };

  return (
    <div style={{ background:'#0a0a15', color:'#e2e8f0', borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,.08)', fontFamily:'var(--mono, monospace)' }}>

      {/* ── Header ─── */}
      <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,.08)', background:'#0d0d22', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ fontSize:'.6rem', letterSpacing:'.14em', color:'rgba(255,255,255,.3)', marginBottom:'.25rem' }}>SIMULADOR · HARDWARE</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', fontWeight:700 }}>🖥️ Armado de PC — Constructor Interactivo</div>
        </div>
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.3)', alignSelf:'center' }}>Presets:</span>
          {[['Básica', PRESET_BASIC, '#22c55e'], ['Media', PRESET_MID, '#3b82f6'], ['Alta', PRESET_HIGH, '#a855f7']].map(([label, preset, color]) => (
            <button key={label} onClick={() => loadPreset(preset)} style={{ padding:'.28rem .7rem', background:'transparent', border:`1px solid ${color}55`, color, borderRadius:2, cursor:'pointer', fontSize:'.72rem', fontFamily:'monospace' }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{label}</button>
          ))}
          <button onClick={resetBuild} style={{ padding:'.28rem .7rem', background:'transparent', border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.4)', borderRadius:2, cursor:'pointer', fontSize:'.72rem', fontFamily:'monospace' }}>↺ Reiniciar</button>
        </div>
      </div>

      {/* ── 2-col layout ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 240px' }}>

        {/* Left: slots */}
        <div style={{ padding:'1rem', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', gap:'.5rem' }}>
          <div style={{ fontSize:'.6rem', letterSpacing:'.12em', color:'rgba(255,255,255,.25)', marginBottom:'.25rem' }}>COMPONENTES</div>
          {SLOTS.map(slot => (
            <SlotRow key={slot.key} slotDef={slot} build={build} analysis={analysis} onOpen={() => setPicker(slot)} />
          ))}
        </div>

        {/* Right: status panel */}
        <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
          <div style={{ fontSize:'.6rem', letterSpacing:'.12em', color:'rgba(255,255,255,.25)', alignSelf:'flex-start' }}>ESTADO</div>

          {/* Power LED */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem', padding:'1.25rem', width:'100%', background:'rgba(255,255,255,.025)', borderRadius:4, border:'1px solid rgba(255,255,255,.07)' }}>
            <div
              className={analysis.canPowerOn ? 'pc-led-on' : 'pc-led-off'}
              style={{
                width:52, height:52, borderRadius:'50%',
                background: analysis.canPowerOn ? '#22c55e' : '#374151',
                border:`3px solid ${analysis.canPowerOn ? '#4ade80' : '#4b5563'}`,
                '--c': analysis.canPowerOn ? '#22c55e' : '#ef4444',
                '--c2': analysis.canPowerOn ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.15)',
              }}
            />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:'.88rem', color: analysis.canPowerOn ? '#4ade80' : '#ef4444', letterSpacing:'.06em' }}>
                {analysis.canPowerOn ? '✓ ENCIENDE' : '✕ NO ENCIENDE'}
              </div>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.35)', marginTop:'.15rem' }}>
                {analysis.canPowerOn ? 'Equipo operativo' : analysis.missing.length > 0 ? `Faltan ${analysis.missing.length} componente(s)` : `${analysis.errors.length} incompatibilidad(es)`}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {tier && (
            <div style={{ width:'100%', padding:'.75rem', background: tier.glow, border:`1px solid ${tier.color}44`, borderRadius:4, textAlign:'center' }}>
              <div style={{ fontSize:'1.3rem' }}>{tier.emoji}</div>
              <div style={{ fontWeight:900, color:tier.color, fontSize:'.9rem', letterSpacing:'.05em', marginTop:'.2rem' }}>{tier.label}</div>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.45)', marginTop:'.1rem' }}>{tier.sub}</div>
            </div>
          )}

          {price > 0 && (
            <div style={{ width:'100%', textAlign:'center', padding:'.65rem', background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.2)', borderRadius:4 }}>
              <div style={{ fontSize:'.62rem', letterSpacing:'.1em', color:'rgba(255,255,255,.35)' }}>PRECIO ESTIMADO</div>
              <div style={{ fontWeight:900, fontSize:'1.15rem', color:'#fbbf24', marginTop:'.2rem' }}>${price.toLocaleString()}</div>
              <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.3)', marginTop:'.1rem' }}>USD aprox.</div>
            </div>
          )}

          {/* Issues summary */}
          {analysis.errors.length > 0 && (
            <div style={{ width:'100%', padding:'.6rem .75rem', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.2)', borderRadius:4 }}>
              <div style={{ fontSize:'.62rem', letterSpacing:'.1em', color:'#fca5a5', marginBottom:'.4rem' }}>INCOMPATIBLE</div>
              {analysis.errors.slice(0,2).map((e, i) => (
                <div key={i} style={{ fontSize:'.68rem', color:'#fca5a5', lineHeight:1.4 }}>• {e}</div>
              ))}
            </div>
          )}
          {analysis.missing.length > 0 && (
            <div style={{ width:'100%', padding:'.6rem .75rem', background:'rgba(107,114,128,.07)', border:'1px solid rgba(107,114,128,.2)', borderRadius:4 }}>
              <div style={{ fontSize:'.62rem', letterSpacing:'.1em', color:'#9ca3af', marginBottom:'.4rem' }}>FALTANTES</div>
              {analysis.missing.map((m, i) => (
                <div key={i} style={{ fontSize:'.68rem', color:'#9ca3af', lineHeight:1.4 }}>• {m}</div>
              ))}
            </div>
          )}

          {/* Report button */}
          <button
            onClick={() => setShowReport(r => !r)}
            style={{
              width:'100%', padding:'.6rem', background: showReport ? 'rgba(99,102,241,.3)' : 'rgba(99,102,241,.15)',
              border:'1px solid rgba(99,102,241,.4)', color:'#a5b4fc', borderRadius:3,
              cursor:'pointer', fontFamily:'monospace', fontSize:'.78rem', letterSpacing:'.05em', transition:'background .15s',
            }}
          >
            {showReport ? '▲ Ocultar reporte' : '▼ Ver reporte completo'}
          </button>
        </div>
      </div>

      {/* ── Report ─── */}
      {showReport && (
        <div style={{ padding:'0 1rem 1.25rem' }}>
          <ReportPanel build={build} analysis={analysis} tier={tier} price={price} />
        </div>
      )}

      {/* ── Picker modal ─── */}
      {picker && (
        <CompPicker
          slotDef={picker}
          build={build}
          onSelect={comp => selectComp(picker.key, comp)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
