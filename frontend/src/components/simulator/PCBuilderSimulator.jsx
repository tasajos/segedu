import { useState, useMemo, useEffect, useRef } from 'react';
import './PCBuilderSimulator.css';
import { PCCaseView, MonitorDisplay, generatePostLines } from './PCVisualizer';

// ═══════════════════════════════════════════════════════ CATALOG ══════════════

const CATALOG = {
  cpu: [
    // ── Gama económica / Bolivia mercado local ───────────────────────────────
    { id:'celeron-g5905', name:'Intel Celeron G5905',      socket:'LGA1200', tdp:58,  cores:2,  threads:2,  ghz:3.5, turbo:3.5, score:1,  price:45,  igpu:true,  brand:'Intel' },
    { id:'g6400',         name:'Intel Pentium Gold G6400', socket:'LGA1200', tdp:58,  cores:2,  threads:4,  ghz:4.0, turbo:4.0, score:1,  price:60,  igpu:true,  brand:'Intel' },
    { id:'i3-10100f',     name:'Intel Core i3-10100F',    socket:'LGA1200', tdp:65,  cores:4,  threads:8,  ghz:3.6, turbo:4.3, score:2,  price:80,  igpu:false, brand:'Intel' },
    { id:'i5-10400',      name:'Intel Core i5-10400',     socket:'LGA1200', tdp:65,  cores:6,  threads:12, ghz:2.9, turbo:4.3, score:4,  price:145, igpu:true,  brand:'Intel' },
    { id:'r3-3100',       name:'AMD Ryzen 3 3100',        socket:'AM4',     tdp:65,  cores:4,  threads:8,  ghz:3.6, turbo:3.9, score:2,  price:75,  igpu:false, brand:'AMD'   },
    { id:'r5-5500',       name:'AMD Ryzen 5 5500',        socket:'AM4',     tdp:65,  cores:6,  threads:12, ghz:3.6, turbo:4.2, score:3,  price:115, igpu:false, brand:'AMD'   },
    // ── Gama media ────────────────────────────────────────────────────────────
    { id:'i3-12100',      name:'Intel Core i3-12100',     socket:'LGA1700', tdp:89,  cores:4,  threads:8,  ghz:3.3, turbo:4.3, score:3,  price:130, igpu:true,  brand:'Intel' },
    { id:'i5-13400f',     name:'Intel Core i5-13400F',   socket:'LGA1700', tdp:65,  cores:10, threads:16, ghz:2.5, turbo:4.6, score:5,  price:200, igpu:false, brand:'Intel' },
    { id:'i5-12600k',     name:'Intel Core i5-12600K',   socket:'LGA1700', tdp:125, cores:10, threads:16, ghz:3.7, turbo:4.9, score:5,  price:220, igpu:true,  brand:'Intel' },
    { id:'r5-5600',       name:'AMD Ryzen 5 5600',        socket:'AM4',     tdp:65,  cores:6,  threads:12, ghz:3.5, turbo:4.4, score:4,  price:140, igpu:false, brand:'AMD'   },
    { id:'r7-5700x',      name:'AMD Ryzen 7 5700X',       socket:'AM4',     tdp:65,  cores:8,  threads:16, ghz:3.4, turbo:4.6, score:6,  price:200, igpu:false, brand:'AMD'   },
    { id:'r7-5800x',      name:'AMD Ryzen 7 5800X',       socket:'AM4',     tdp:105, cores:8,  threads:16, ghz:3.8, turbo:4.7, score:6,  price:250, igpu:false, brand:'AMD'   },
    // ── Gama alta ─────────────────────────────────────────────────────────────
    { id:'i7-13700k',     name:'Intel Core i7-13700K',   socket:'LGA1700', tdp:125, cores:16, threads:24, ghz:3.4, turbo:5.4, score:7,  price:380, igpu:true,  brand:'Intel' },
    { id:'i9-13900k',     name:'Intel Core i9-13900K',   socket:'LGA1700', tdp:253, cores:24, threads:32, ghz:3.0, turbo:5.8, score:9,  price:550, igpu:true,  brand:'Intel' },
    { id:'r9-7900x',      name:'AMD Ryzen 9 7900X',       socket:'AM5',     tdp:170, cores:12, threads:24, ghz:4.7, turbo:5.6, score:8,  price:400, igpu:true,  brand:'AMD'   },
    { id:'r9-7950x',      name:'AMD Ryzen 9 7950X',       socket:'AM5',     tdp:170, cores:16, threads:32, ghz:4.5, turbo:5.7, score:10, price:600, igpu:true,  brand:'AMD'   },
  ],
  motherboard: [
    // LGA1200 (economía Bolivia)
    { id:'h510m',  name:'MSI H510M PRO',              socket:'LGA1200', ramType:'DDR4', maxRam:64,  form:'mATX', slots:2, price:70  },
    { id:'b560m',  name:'ASUS PRIME B560M-A',         socket:'LGA1200', ramType:'DDR4', maxRam:64,  form:'mATX', slots:4, price:90  },
    // LGA1700
    { id:'b660m',  name:'MSI B660M Pro-A DDR4',       socket:'LGA1700', ramType:'DDR4', maxRam:64,  form:'mATX', slots:2, price:100 },
    { id:'z690',   name:'ASUS ROG STRIX Z690-F',      socket:'LGA1700', ramType:'DDR5', maxRam:128, form:'ATX',  slots:4, price:200 },
    // AM4
    { id:'b450m',  name:'Gigabyte B450M DS3H',        socket:'AM4',     ramType:'DDR4', maxRam:64,  form:'mATX', slots:2, price:65  },
    { id:'b550',   name:'Gigabyte B550M DS3H',        socket:'AM4',     ramType:'DDR4', maxRam:128, form:'mATX', slots:2, price:80  },
    { id:'x570',   name:'MSI MEG X570 ACE',           socket:'AM4',     ramType:'DDR4', maxRam:128, form:'ATX',  slots:4, price:180 },
    // AM5
    { id:'b650',   name:'MSI MAG B650 Tomahawk',      socket:'AM5',     ramType:'DDR5', maxRam:128, form:'ATX',  slots:4, price:150 },
    { id:'x670e',  name:'MSI MEG X670E Ace',          socket:'AM5',     ramType:'DDR5', maxRam:256, form:'ATX',  slots:4, price:280 },
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
  entrada: [
    { id:'kb-basic',  name:'Teclado Membrana + Ratón Óptico',          specs:['USB', 'Plug & Play'],                        price:30  },
    { id:'kb-gaming', name:'Teclado Gaming RGB + Ratón 6400 DPI',      specs:['RGB', 'Polling 1000Hz', 'Antighostin'],     price:85  },
    { id:'kb-mech',   name:'Teclado Mecánico Cherry MX + Ratón Pro',   specs:['Switches mec.', 'Wireless 2.4GHz'],         price:190 },
    { id:'webcam-hd', name:'Cámara Web Full HD 1080p 30fps',           specs:['1920×1080', '30fps', 'USB 2.0'],            price:45  },
    { id:'webcam-4k', name:'Cámara Web 4K 60fps (streaming)',          specs:['3840×2160', '60fps', 'USB 3.0'],            price:120 },
    { id:'mic-usb',   name:'Micrófono USB Condensador Cardioide',      specs:['USB Plug&Play', '48kHz', 'Cardioide'],      price:40  },
    { id:'gamepad',   name:'Control Gamepad USB/Bluetooth',            specs:['Dual vibración', 'Inalámbrico', 'PC/PS'],   price:40  },
    { id:'scanner',   name:'Escáner de Documentos A4 600dpi',          specs:['A4', '600dpi', 'USB', 'Color'],             price:75  },
    { id:'wacom',     name:'Tableta Digitalizadora 10×6"',             specs:['8192 niveles', 'Stylus incluido', 'USB'],   price:90  },
  ],
  salida: [
    { id:'spk-20',    name:'Altavoces 2.0 Escritorio 20W',             specs:['20W RMS', 'Jack 3.5mm', 'Control volumen'], price:30  },
    { id:'spk-21',    name:'Altavoces 2.1 + Subwoofer 40W',           specs:['40W RMS', 'Subwoofer 20cm', 'RCA'],        price:65  },
    { id:'spk-51',    name:'Sistema 5.1 Surround 120W',                specs:['120W RMS', 'Dolby Digital', '6 canal'],    price:130 },
    { id:'headset',   name:'Auriculares Gaming 7.1 Surround',          specs:['Cancelación ruido', 'Mic retráctil'],       price:55  },
    { id:'headset-p', name:'Auriculares Hi-Fi 50mm + DAC USB',         specs:['Hi-Fi', '50mm drivers', 'DAC 24bit'],      price:95  },
    { id:'printer-i', name:'Impresora Multifunción Tinta + WiFi',      specs:['Color', 'WiFi', 'Escan/Copia/Imp'],        price:80  },
    { id:'printer-l', name:'Impresora Láser Monocromática Red',        specs:['B&N', '30ppm', 'Red LAN', 'Dúplex'],      price:145 },
    { id:'ups',       name:'UPS 650VA Protección Eléctrica',           specs:['650VA/360W', 'AVR', '6 tomas', 'USB'],    price:55  },
    { id:'hub-usb',   name:'Hub USB 3.0 de 7 puertos con carga',       specs:['USB 3.0', '7 puertos', '5Gbps'],           price:22  },
    { id:'ext-hdd',   name:'Disco Externo USB 3.0 — 1TB',             specs:['1TB', 'USB 3.0', '5Gbps', 'Plug&Play'],   price:55  },
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
    specs: c => [c.res, `${c.hz} Hz`, `${c.inch}"`],
  },
  {
    key: 'entrada', label: 'Periféricos Entrada', icon: '⌨️', required: false,
    specs: c => c.specs || [],
  },
  {
    key: 'salida', label: 'Periféricos Salida', icon: '🔊', required: false,
    specs: c => c.specs || [],
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
          {/* Sin componente — siempre disponible */}
          <button
            onClick={() => onSelect(null)}
            style={{ padding:'.75rem 1rem', background:'rgba(255,255,255,.03)', border:'1px dashed rgba(255,255,255,.12)', borderRadius:4, cursor:'pointer', color:'rgba(255,255,255,.35)', fontFamily:'monospace', fontSize:'.78rem', textAlign:'left' }}
          >
            — Sin componente {slotDef.required ? <span style={{ color:'rgba(239,68,68,.6)', fontSize:'.7rem' }}>(la PC no encenderá)</span> : '(quitar)'} —
          </button>
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

// ═══════════════════════════════════════════════════════ CABLES ══════════════

function CableConnector({ powered, hasMonitor }) {
  const on = powered && hasMonitor;
  const c = (r, g, b, a) => `rgba(${r},${g},${b},${on ? a : a * 0.12})`;
  return (
    <svg width="52" height="290" viewBox="0 0 52 290" style={{ flexShrink:0, overflow:'visible' }}>
      {/* HDMI / DisplayPort — GPU output (~y155) → monitor input (~y80) */}
      <path d="M 2,158 C 26,158 26,82 50,82"
        stroke={c(96,165,250,.9)} strokeWidth="3" fill="none" strokeLinecap="round"
        style={{ transition:'stroke .6s' }} />
      <circle cx="2"  cy="158" r="3" fill={c(96,165,250,.7)} style={{ transition:'fill .6s' }} />
      <circle cx="50" cy="82"  r="3" fill={c(96,165,250,.7)} style={{ transition:'fill .6s' }} />
      <text x="26" y="112" textAnchor="middle" fill={c(96,165,250,.55)} fontSize="6"
        fontFamily="monospace" transform="rotate(-62,26,112)" style={{ transition:'fill .6s' }}>
        HDMI
      </text>

      {/* USB cable — PC (~y200) → peripheral */}
      <path d="M 2,200 C 26,200 26,155 50,155"
        stroke={c(34,197,94,.65)} strokeWidth="1.8" fill="none" strokeLinecap="round"
        strokeDasharray={on ? '0' : '4 3'} style={{ transition:'stroke .6s' }} />
      <circle cx="50" cy="155" r="2.5" fill={c(34,197,94,.6)} style={{ transition:'fill .6s' }} />
      <text x="26" y="175" textAnchor="middle" fill={c(34,197,94,.4)} fontSize="5.5"
        fontFamily="monospace" transform="rotate(-55,26,175)" style={{ transition:'fill .6s' }}>
        USB
      </text>

      {/* Power cable — PSU (~y235) → monitor power */}
      <path d="M 2,235 C 26,235 26,220 50,220"
        stroke={c(251,191,36,.7)} strokeWidth="2.2" fill="none" strokeLinecap="round"
        style={{ transition:'stroke .6s' }} />
      <circle cx="50" cy="220" r="2.5" fill={c(251,191,36,.6)} style={{ transition:'fill .6s' }} />
      <text x="26" y="232" textAnchor="middle" fill={c(251,191,36,.4)} fontSize="5.5"
        fontFamily="monospace" transform="rotate(-10,26,232)" style={{ transition:'fill .6s' }}>
        PWR
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════ MAIN ════════════════

const EMPTY_BUILD = {
  cpu: null, motherboard: null, ram: null, storage: null,
  gpu: CATALOG.gpu[0],
  psu: null, cooler: null, pcCase: null, monitor: null,
  entrada: null, salida: null,
};

const PRESET_BASIC = {
  cpu: CATALOG.cpu[2], motherboard: CATALOG.motherboard[0], ram: CATALOG.ram[0],
  storage: CATALOG.storage[0], gpu: CATALOG.gpu[0], psu: CATALOG.psu[0],
  cooler: CATALOG.cooler[0], pcCase: CATALOG.pcCase[0], monitor: CATALOG.monitor[0],
  entrada: CATALOG.entrada[0], salida: CATALOG.salida[0],
};
const PRESET_MID = {
  cpu: CATALOG.cpu[9], motherboard: CATALOG.motherboard[5], ram: CATALOG.ram[2],
  storage: CATALOG.storage[2], gpu: CATALOG.gpu[3], psu: CATALOG.psu[2],
  cooler: CATALOG.cooler[2], pcCase: CATALOG.pcCase[1], monitor: CATALOG.monitor[1],
  entrada: CATALOG.entrada[1], salida: CATALOG.salida[0],
};
const PRESET_HIGH = {
  cpu: CATALOG.cpu[12], motherboard: CATALOG.motherboard[7], ram: CATALOG.ram[4],
  storage: CATALOG.storage[3], gpu: CATALOG.gpu[5], psu: CATALOG.psu[4],
  cooler: CATALOG.cooler[4], pcCase: CATALOG.pcCase[2], monitor: CATALOG.monitor[3],
  entrada: CATALOG.entrada[2], salida: CATALOG.salida[1],
};

export default function PCBuilderSimulator() {
  const [build, setBuild]           = useState(EMPTY_BUILD);
  const [picker, setPicker]         = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [powered, setPowered]       = useState(false);
  const [bootState, setBootState]   = useState('off'); // off | booting | bios | bsod | nosignal
  const [postLines, setPostLines]   = useState([]);
  const postTimers = useRef([]);

  const analysis = useMemo(() => analyzeBuild(build), [build]);
  const tier      = useMemo(() => getTier(build), [build]);
  const price     = useMemo(() => totalPrice(build), [build]);

  // Power off when build changes while powered
  useEffect(() => {
    if (powered) handlePowerOff();
  }, [build]); // eslint-disable-line

  const clearTimers = () => {
    postTimers.current.forEach(clearTimeout);
    postTimers.current = [];
  };

  const handlePowerOff = () => {
    clearTimers();
    setPowered(false);
    setBootState('off');
    setPostLines([]);
  };

  const handlePowerOn = () => {
    if (!build.monitor) {
      setPowered(true);
      setBootState('nosignal');
      return;
    }
    if (!analysis.canPowerOn) {
      setPowered(true);
      setBootState('bsod');
      return;
    }
    // Normal boot sequence
    setPowered(true);
    setBootState('booting');
    setPostLines([]);
    const lines = generatePostLines(build);
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        setPostLines(prev => [...prev, line]);
        if (i === lines.length - 1) {
          const t2 = setTimeout(() => setBootState('bios'), 600);
          postTimers.current.push(t2);
        }
      }, i * 120);
      postTimers.current.push(t);
    });
  };

  const selectComp = (key, comp) => {
    setBuild(b => ({ ...b, [key]: comp }));
    setPicker(null);
  };

  const loadPreset = (preset) => {
    setBuild(preset);
    setShowReport(false);
  };

  const resetBuild = () => {
    handlePowerOff();
    setBuild(EMPTY_BUILD);
    setShowReport(false);
  };

  return (
    <div style={{ background:'#0a0a15', color:'#e2e8f0', borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,.08)', fontFamily:'var(--mono, monospace)' }}>

      {/* ── Header ─── */}
      <div style={{ padding:'.85rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,.08)', background:'#0d0d22', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.75rem' }}>
        <div>
          <div style={{ fontSize:'.58rem', letterSpacing:'.14em', color:'rgba(255,255,255,.28)', marginBottom:'.2rem' }}>SIMULADOR · HARDWARE</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'1rem', fontWeight:700 }}>🖥️ Armado de PC — Constructor Interactivo</div>
        </div>
        <div style={{ display:'flex', gap:'.45rem', flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.28)' }}>Presets:</span>
          {[['Básica', PRESET_BASIC, '#22c55e'], ['Media', PRESET_MID, '#3b82f6'], ['Alta', PRESET_HIGH, '#a855f7']].map(([label, preset, color]) => (
            <button key={label} onClick={() => loadPreset(preset)}
              style={{ padding:'.24rem .6rem', background:'transparent', border:`1px solid ${color}55`, color, borderRadius:2, cursor:'pointer', fontSize:'.68rem', fontFamily:'monospace' }}
              onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{label}</button>
          ))}
          <button onClick={resetBuild} style={{ padding:'.24rem .6rem', background:'transparent', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.35)', borderRadius:2, cursor:'pointer', fontSize:'.68rem', fontFamily:'monospace' }}>↺</button>
        </div>
      </div>

      {/* ══ MAIN: componentes (izq) + visual (der) ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(320px,1fr) 480px' }}>

        {/* ── Izquierda: slots ── */}
        <div style={{ borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'.6rem 1rem', borderBottom:'1px solid rgba(255,255,255,.05)', fontSize:'.58rem', letterSpacing:'.12em', color:'rgba(255,255,255,.22)' }}>
            COMPONENTES
          </div>
          <div style={{ padding:'.6rem .75rem', display:'flex', flexDirection:'column', gap:'.4rem', overflowY:'auto' }}>
            {SLOTS.map(slot => (
              <SlotRow key={slot.key} slotDef={slot} build={build} analysis={analysis} onOpen={() => setPicker(slot)} />
            ))}
          </div>
        </div>

        {/* ── Derecha: visual ── */}
        <div style={{ background:'#070712', display:'flex', flexDirection:'column' }}>

          {/* Subheader visual */}
          <div style={{ padding:'.55rem 1rem', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
              <div className={analysis.canPowerOn ? 'pc-led-on' : 'pc-led-off'} style={{ width:10, height:10, borderRadius:'50%', background: analysis.canPowerOn ? '#22c55e' : '#374151', flexShrink:0 }} />
              <span style={{ fontSize:'.7rem', fontWeight:700, color: analysis.canPowerOn ? '#4ade80' : '#ef4444' }}>
                {analysis.canPowerOn ? '✓ ENCIENDE' : '✕ NO ENCIENDE'}
              </span>
              {tier && <span style={{ fontSize:'.62rem', padding:'.1rem .45rem', background:tier.glow, border:`1px solid ${tier.color}55`, color:tier.color, borderRadius:2, marginLeft:'.25rem' }}>{tier.label}</span>}
              {price > 0 && <span style={{ fontSize:'.68rem', color:'#fbbf24', fontWeight:700, marginLeft:'.5rem' }}>${price.toLocaleString()}</span>}
            </div>
            <button
              onClick={powered ? handlePowerOff : handlePowerOn}
              style={{
                padding:'.28rem .75rem', fontFamily:'monospace', fontSize:'.72rem',
                background: powered ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
                border: `1px solid ${powered ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.35)'}`,
                color: powered ? '#f87171' : '#4ade80',
                borderRadius:2, cursor:'pointer', letterSpacing:'.04em', transition:'all .2s', flexShrink:0,
              }}>
              {powered ? '⏻ Apagar' : '⏻ Encender PC'}
            </button>
          </div>

          {/* Case + cables + Monitor — fila central */}
          <div style={{ flex:1, padding:'1rem .75rem', display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
            {/* PC Case */}
            <div style={{ flexShrink:0, width:180 }}>
              <div style={{ fontSize:'.52rem', letterSpacing:'.1em', color:'rgba(255,255,255,.18)', textAlign:'center', marginBottom:'.4rem' }}>INTERIOR DEL EQUIPO</div>
              <PCCaseView build={build} powered={powered} />
            </div>

            {/* Cables SVG */}
            <CableConnector powered={powered} hasMonitor={!!build.monitor} />

            {/* Monitor */}
            <div style={{ flexShrink:0 }}>
              <div style={{ fontSize:'.52rem', letterSpacing:'.1em', color:'rgba(255,255,255,.18)', textAlign:'center', marginBottom:'.4rem' }}>MONITOR</div>
              <MonitorDisplay bootState={bootState} postLines={postLines} build={build} analysis={analysis} />
            </div>
          </div>

          {/* Barra inferior: estado + alertas + reporte */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'.65rem 1rem', display:'flex', flexDirection:'column', gap:'.45rem' }}>
            {/* Boot state hint */}
            {!powered && (
              <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.22)', fontFamily:'monospace', textAlign:'center' }}>
                {!build.monitor ? '⚠ Sin monitor conectado — agrega uno para ver la pantalla'
                  : !analysis.canPowerOn && analysis.missing.length > 0 ? `Faltan: ${analysis.missing.join(', ')}`
                  : !analysis.canPowerOn ? 'Hay incompatibilidades — enciende para ver el error'
                  : '✓ Equipo listo — presiona ⏻ Encender PC'}
              </div>
            )}
            {powered && (
              <div style={{ fontSize:'.65rem', fontFamily:'monospace', textAlign:'center', color: bootState === 'bsod' ? '#f87171' : bootState === 'bios' ? '#4ade80' : '#fbbf24' }}>
                { bootState === 'booting' ? '⟳ POST iniciando...' : bootState === 'bios' ? '✓ Sistema operativo cargado correctamente' : bootState === 'bsod' ? '✕ Error de hardware — pantalla azul' : '⚠ Sin señal de video' }
              </div>
            )}
            {/* Errors inline */}
            {analysis.errors.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                {analysis.errors.map((e, i) => (
                  <span key={i} style={{ fontSize:'.6rem', color:'#fca5a5', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:2, padding:'.1rem .4rem' }}>✕ {e}</span>
                ))}
              </div>
            )}
            {/* Report button */}
            <button onClick={() => setShowReport(r => !r)}
              style={{ padding:'.3rem', background: showReport ? 'rgba(99,102,241,.25)' : 'transparent', border:'1px solid rgba(99,102,241,.3)', color:'#a5b4fc', borderRadius:2, cursor:'pointer', fontFamily:'monospace', fontSize:'.68rem', transition:'background .15s' }}>
              {showReport ? '▲ Ocultar reporte' : '▼ Ver reporte completo'}
            </button>
          </div>
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
