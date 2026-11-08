// ═══════════════════════════════════════════════════════════════════════════
//  Taller de Ensamblaje de PC — catálogo, geometría y diagnóstico
//  La placa se dibuja en milímetros; la escena lateral usa S px por mm.
// ═══════════════════════════════════════════════════════════════════════════

export const S = 1.6;
export const BX = 80;
export const BY = 70;
export const sx = mm => BX + mm * S;
export const sy = mm => BY + mm * S;
export const SOCKET_C = { x: 82, y: 74 };

// ─────────────────────────────────────────────────────────── PLACAS MADRE ──

export const BOARDS = [
  {
    id: 'a520m', name: 'ASRock A520M-HDV', chipset: 'AMD A520', socket: 'AM4', ramType: 'DDR4',
    form: 'mATX', dimms: 2, maxRam: 64, wifi: false, video: ['HDMI', 'DVI-D', 'VGA'],
    pcb: '#2a2c2f', hs: ['#dfe3e7', '#8d959c'], accent: '#d4d9de', slot: '#1c1c1c', armor: false,
    vrm: 'small', logo: 'asrock', silk: 'A520M-HDV', price: 65,
  },
  {
    id: 'b560m', name: 'ASUS PRIME B560M-A', chipset: 'Intel B560', socket: 'LGA1200', ramType: 'DDR4',
    form: 'mATX', dimms: 4, maxRam: 128, wifi: false, video: ['HDMI', 'DP', 'DVI-D'],
    pcb: '#2c3036', hs: ['#f1f3f5', '#a9b0b7'], accent: '#ffffff', slot: '#e9ecef', armor: false,
    vrm: 'mid', logo: 'prime', silk: 'PRIME B560M-A', price: 95,
  },
  {
    id: 'b760m', name: 'MSI PRO B760M-A DDR4', chipset: 'Intel B760', socket: 'LGA1700', ramType: 'DDR4',
    form: 'mATX', dimms: 4, maxRam: 128, wifi: false, video: ['HDMI', 'DP', 'DP'],
    pcb: '#1e2023', hs: ['#cfd3d7', '#717880'], accent: '#c3c8cd', slot: '#2b2d30', armor: false,
    vrm: 'mid', logo: 'msi', silk: 'PRO B760M-A DDR4', price: 120,
  },
  {
    id: 'z790', name: 'ASUS ROG STRIX Z790-F GAMING WIFI', chipset: 'Intel Z790', socket: 'LGA1700', ramType: 'DDR5',
    form: 'ATX', dimms: 4, maxRam: 192, wifi: true, video: ['HDMI', 'DP'],
    pcb: '#111214', hs: ['#4a4e55', '#16171a'], accent: '#ff2b44', slot: '#141414', armor: true,
    vrm: 'big', logo: 'rog', silk: 'ROG STRIX Z790-F', price: 330,
  },
  {
    id: 'b550', name: 'GIGABYTE B550 AORUS ELITE V2', chipset: 'AMD B550', socket: 'AM4', ramType: 'DDR4',
    form: 'ATX', dimms: 4, maxRam: 128, wifi: false, video: ['HDMI', 'DP'],
    pcb: '#17181a', hs: ['#6a7078', '#24272b'], accent: '#ff7d1f', slot: '#1d1e20', armor: true,
    vrm: 'big', logo: 'aorus', silk: 'B550 AORUS ELITE V2', price: 150,
  },
  {
    id: 'b650', name: 'MSI MAG B650 TOMAHAWK WIFI', chipset: 'AMD B650', socket: 'AM5', ramType: 'DDR5',
    form: 'ATX', dimms: 4, maxRam: 192, wifi: true, video: ['HDMI', 'DP'],
    pcb: '#1a1b1d', hs: ['#7b7666', '#2f2d28'], accent: '#c9c2a6', slot: '#202022', armor: true,
    vrm: 'big', logo: 'msi', silk: 'MAG B650 TOMAHAWK WIFI', price: 220,
  },
];

export const LAYOUTS = {
  ATX: {
    w: 244, h: 305,
    holes: [[7, 10], [165, 10], [236, 10], [7, 160], [165, 160], [236, 160], [7, 296], [165, 296], [236, 296]],
    pcie: [
      { y: 158, len: 89, x16: true },
      { y: 180, len: 25 },
      { y: 203, len: 89, x16: true },
      { y: 226, len: 25 },
      { y: 248, len: 89, x16: true },
    ],
    chipset: { x: 150, y: 214, w: 58, h: 44 },
    sata: { x: 229, y: 206 },
    fpanel: { x: 190, y: 293 },
    battery: { x: 128, y: 238 },
    audio: { x: 0, y: 262, w: 46, h: 43 },
    m2b: { y: 189 },
    headersY: 297,
  },
  mATX: {
    w: 244, h: 244,
    holes: [[7, 10], [165, 10], [236, 10], [7, 160], [165, 160], [236, 160], [7, 235], [165, 235]],
    pcie: [
      { y: 158, len: 89, x16: true },
      { y: 180, len: 25 },
      { y: 200, len: 89, x16: true },
    ],
    chipset: { x: 150, y: 174, w: 50, h: 36 },
    sata: { x: 229, y: 176 },
    fpanel: { x: 190, y: 233 },
    battery: { x: 126, y: 224 },
    audio: { x: 0, y: 212, w: 42, h: 32 },
    m2b: null,
    headersY: 236,
  },
};

export const dimmXs = b => (b.dimms === 4 ? [140, 149, 160, 169] : [146, 160]);

// ─────────────────────────────────────────────────────────── COMPONENTES ──

export const CPUS = {
  'i3-10105':  { name: 'Intel Core i3-10105',  brand: 'intel', model: 'CORE i3', socket: 'LGA1200', tdp: 65,  peak: 90,  igpu: true,  specs: ['LGA1200', '4N / 8H', '65 W', 'UHD 630'] },
  'i5-12400f': { name: 'Intel Core i5-12400F', brand: 'intel', model: 'CORE i5', socket: 'LGA1700', tdp: 65,  peak: 117, igpu: false, specs: ['LGA1700', '6N / 12H', '65 W', 'Sin gráficos'] },
  'i7-13700k': { name: 'Intel Core i7-13700K', brand: 'intel', model: 'CORE i7', socket: 'LGA1700', tdp: 125, peak: 253, igpu: true,  specs: ['LGA1700', '16N / 24H', '125 W', 'UHD 770'] },
  'r5-5600g':  { name: 'AMD Ryzen 5 5600G',    brand: 'amd',   model: 'RYZEN 5', socket: 'AM4',     tdp: 65,  peak: 88,  igpu: true,  specs: ['AM4', '6N / 12H', '65 W', 'Radeon Vega 7'] },
  'r7-5700x':  { name: 'AMD Ryzen 7 5700X',    brand: 'amd',   model: 'RYZEN 7', socket: 'AM4',     tdp: 65,  peak: 76,  igpu: false, specs: ['AM4', '8N / 16H', '65 W', 'Sin gráficos'] },
  'r7-7700x':  { name: 'AMD Ryzen 7 7700X',    brand: 'amd',   model: 'RYZEN 7', socket: 'AM5',     tdp: 105, peak: 142, igpu: true,  specs: ['AM5', '8N / 16H', '105 W', 'Radeon 2CU'] },
};

export const COOLERS = {
  'intel-rm1':    { name: 'Intel Laminar RM1 (de caja)', type: 'stock-intel',     mounts: ['LGA1700'],                         tdp: 65,  specs: ['LGA1700', 'Hasta 65 W'] },
  'intel-e97379': { name: 'Intel E97379 (de caja)',      type: 'stock-intel-old', mounts: ['LGA1200'],                         tdp: 65,  specs: ['LGA1200 / 115x', 'Hasta 65 W'] },
  'wraith':       { name: 'AMD Wraith Stealth (de caja)', type: 'stock-amd',      mounts: ['AM4', 'AM5'],                      tdp: 65,  specs: ['AM4 / AM5', 'Hasta 65 W'] },
  'hyper212':     { name: 'Cooler Master Hyper 212',     type: 'tower',           mounts: ['LGA1200', 'LGA1700', 'AM4', 'AM5'], tdp: 150, specs: ['Universal', 'Torre 120 mm', 'Hasta 150 W'] },
  'aio240':       { name: 'Refrigeración líquida AIO 240 mm', type: 'aio',        mounts: ['LGA1200', 'LGA1700', 'AM4', 'AM5'], tdp: 250, specs: ['Universal', 'Radiador 240 mm', 'Hasta 250 W'] },
};

export const RAMS = {
  'ddr4-8':  { name: 'Kingston FURY Beast 8 GB DDR4-3200',   type: 'DDR4', gb: 8,  qty: 2, rgb: false, specs: ['DDR4', '8 GB', '3200 MHz', '288 pines'] },
  'ddr5-16': { name: 'Corsair Vengeance RGB 16 GB DDR5-5600', type: 'DDR5', gb: 16, qty: 2, rgb: true,  specs: ['DDR5', '16 GB', '5600 MHz', '288 pines'] },
};

export const STORAGE = {
  'nvme1tb': { name: 'Samsung 980 1 TB NVMe M.2', kind: 'm2',   size: 931.5, label: 'Samsung SSD 980 1TB', specs: ['M.2 2280', 'NVMe PCIe 3.0', '1 TB'] },
  'sata480': { name: 'Kingston A400 480 GB SATA 2.5"', kind: 'sata', size: 447.1, label: 'KINGSTON SA400S37480G', specs: ['2.5"', 'SATA III', '480 GB'] },
};

export const GPUS = {
  'gtx1650':  { name: 'NVIDIA GeForce GTX 1650 4 GB', style: 'nv-basic', watt: 75,  pcie: 0, len: 170, thick: 36, label: 'GEFORCE GTX 1650', specs: ['75 W', 'Sin conector extra', '2 slots'] },
  'rtx3060':  { name: 'NVIDIA GeForce RTX 3060 12 GB', style: 'nv',      watt: 170, pcie: 1, len: 242, thick: 40, label: 'GEFORCE RTX 3060', specs: ['170 W', '1× PCIe 8 pines', '2 slots'] },
  'rx7800xt': { name: 'AMD Radeon RX 7800 XT 16 GB',   style: 'amd',     watt: 263, pcie: 2, len: 267, thick: 50, label: 'RADEON RX 7800 XT', specs: ['263 W', '2× PCIe 8 pines', '2.5 slots'] },
};

export const PSUS = {
  'psu450': { name: 'Fuente EVGA 450 BR 450 W 80+ Bronze', brand: 'EVGA', model: '450 BR', watt: 450, pcie: 1, amps: '37.5', specs: ['450 W', '80+ Bronze', '1× PCIe'] },
  'psu750': { name: 'Fuente Corsair RM750e 750 W 80+ Gold', brand: 'CORSAIR', model: 'RM750e', watt: 750, pcie: 2, amps: '62.5', specs: ['750 W', '80+ Gold', '2× PCIe'] },
};

export const EXTRAS = {
  paste:  { name: 'Pasta térmica Arctic MX-4', specs: ['4 g', 'Jeringa'] },
  c24:    { name: 'Cable ATX 24 pines', specs: ['Fuente → Placa'] },
  ceps:   { name: 'Cable EPS 8 pines (CPU)', specs: ['Fuente → CPU_PWR'] },
  cpcie:  { name: 'Cable PCIe 8 pines (6+2)', specs: ['Fuente → GPU'] },
  csatap: { name: 'Cable de energía SATA', specs: ['Fuente → Disco'] },
  csatad: { name: 'Cable de datos SATA III', specs: ['Placa → Disco'] },
  cpufan: { name: 'Conector del ventilador (4 pines)', specs: ['Disipador → Placa'] },
  fpanel: { name: 'Conectores del panel frontal', specs: ['POWER SW', 'RESET', 'LED'] },
  usb:    { name: 'Memoria USB — Instalador Windows 11', specs: ['16 GB', 'Booteable'] },
  hdmi:   { name: 'Cable HDMI del monitor', specs: ['HDMI 2.0'] },
  cord:   { name: 'Cable de alimentación 220 V', specs: ['IEC C13'] },
};

// ─────────────────────────────────────────────────────────── ESTADO ──

export const EMPTY_BUILD = {
  mobo: false, cpu: null, paste: false, cooler: null, cpufan: false,
  ram: [null, null, null, null], m2: null, sata: null, gpu: null, psu: null,
  c24: false, ceps: false, cpcie: [false, false], csatap: false, csatad: false,
  fpanel: false, usb: false, hdmi: null, cord: false, psuOn: false,
};

// ─────────────────────────────────────────────────────────── ZONAS ──
// Una zona sólo valida el *tipo físico* de pieza, nunca la compatibilidad.

export function gpuGeom(g) {
  const x0 = 36;
  const y0 = sy(LAYOUTS.ATX.pcie[0].y) - 5;
  const L = g.len * S;
  const T = g.thick * S;
  const conns = Array.from({ length: g.pcie }, (_, i) => ({ x: x0 + L - 52 - i * 34, y: y0 + 9, w: 28, h: 13 }));
  return { x0, y0, L, T, conns };
}

export const SSD_BAY = { x: 654, y: 398, w: 112, h: 160 };
export const SSD_PWR = { x: 664, y: 556, w: 38, h: 10 };
export const SSD_DATA = { x: 712, y: 556, w: 20, h: 10 };
export const PSU_BOX = { x: 40, y: 660, w: 240, h: 136 };

export function getZones(st, board) {
  const L = LAYOUTS[board.form];
  const z = [];
  const add = (id, kind, view, x, y, w, h, ok) => ok && z.push({ id, kind, view, x, y, w, h });

  add('mobo', 'mobo', 'side', BX, BY, L.w * S, L.h * S, !st.mobo);
  add('cpu', 'cpu', 'side', sx(SOCKET_C.x - 26), sy(SOCKET_C.y - 30), 52 * S, 60 * S, st.mobo && !st.cpu);
  add('paste', 'paste', 'side', sx(SOCKET_C.x - 22), sy(SOCKET_C.y - 24), 44 * S, 48 * S, !!st.cpu && !st.paste && !st.cooler);
  add('cooler', 'cooler', 'side', sx(SOCKET_C.x - 50), sy(SOCKET_C.y - 50), 100 * S, 100 * S, !!st.cpu && !st.cooler);
  add('cpufan', 'cpufan', 'side', sx(113), sy(-3), 22 * S, 15 * S, !!st.cooler && !st.cpufan);
  dimmXs(board).forEach((x, i) =>
    add(`ram-${i}`, 'ram', 'side', sx(x - 2), sy(12), 10 * S, 138 * S, st.mobo && !st.ram[i]));
  add('m2', 'm2', 'side', sx(28), sy(125), 92 * S, 28 * S, st.mobo && !st.m2);
  add('gpu', 'gpu', 'side', 26, sy(L.pcie[0].y) - 18, sx(110) - 26, 40, st.mobo && !st.gpu);
  add('psu', 'psu', 'side', PSU_BOX.x, PSU_BOX.y, PSU_BOX.w, PSU_BOX.h, !st.psu);
  add('sata', 'sata', 'side', SSD_BAY.x - 14, SSD_BAY.y - 14, SSD_BAY.w + 28, SSD_BAY.h + 28, !st.sata);
  add('c24', 'c24', 'side', sx(226), sy(66), 20 * S, 62 * S, st.mobo && !!st.psu && !st.c24);
  add('ceps', 'ceps', 'side', sx(10), sy(-4), 26 * S, 18 * S, st.mobo && !!st.psu && !st.ceps);
  if (st.gpu) {
    gpuGeom(GPUS[st.gpu]).conns.forEach((c, i) =>
      add(`cpcie-${i}`, 'cpcie', 'side', c.x - 6, c.y - 6, c.w + 12, c.h + 12, !!st.psu && !st.cpcie[i]));
  }
  add('csatap', 'csatap', 'side', SSD_PWR.x - 8, SSD_PWR.y - 10, SSD_PWR.w + 14, 30, !!st.sata && !!st.psu && !st.csatap);
  add('csatad', 'csatad', 'side', SSD_DATA.x - 4, SSD_DATA.y - 10, SSD_DATA.w + 12, 30, !!st.sata && st.mobo && !st.csatad);
  add('fpanel', 'fpanel', 'side', sx(L.fpanel.x - 5), sy(L.fpanel.y - 6), 30 * S, 17 * S, st.mobo && !st.fpanel);

  add('io-usb', 'usb', 'rear', REAR.io.x - 4, REAR.io.y + 64, REAR.io.w + 8, 26, st.mobo && !st.usb);
  add('io-video', 'hdmi', 'rear', REAR.io.x - 4, REAR.io.y + 34, REAR.io.w + 8, 26, st.mobo && !st.hdmi);
  add('gpu-video', 'hdmi', 'rear', REAR.slotX - 4, REAR.slotY - 4, REAR.slotW + 8, 30, !!st.gpu && !st.hdmi);
  add('psu-socket', 'cord', 'rear', REAR.psu.x + 176, REAR.psu.y + 18, 54, 42, !!st.psu && !st.cord);
  return z;
}

export const REAR = {
  frame: { x: 330, y: 20, w: 340, h: 780 },
  io: { x: 356, y: 56, w: 70, h: 254 },
  fan: { cx: 548, cy: 168, r: 96 },
  slotX: 366, slotY: 352, slotW: 236, slotH: 20, slotGap: 27,
  psu: { x: 380, y: 646, w: 240, h: 138 },
};

export function applyInstall(st, zoneId, item, board) {
  const zone = getZones(st, board).find(z => z.id === zoneId);
  if (!zone || zone.kind !== item.kind) return st;
  const n = { ...st, ram: [...st.ram], cpcie: [...st.cpcie] };
  if (zoneId.startsWith('ram-')) { n.ram[+zoneId.slice(4)] = item.id; return n; }
  if (zoneId.startsWith('cpcie-')) { n.cpcie[+zoneId.slice(6)] = true; return n; }
  switch (zoneId) {
    case 'mobo': n.mobo = true; break;
    case 'cpu': n.cpu = item.id; break;
    case 'paste': n.paste = true; break;
    case 'cooler': n.cooler = item.id; break;
    case 'm2': n.m2 = item.id; break;
    case 'gpu': n.gpu = item.id; break;
    case 'psu': n.psu = item.id; break;
    case 'sata': n.sata = item.id; break;
    case 'io-usb': n.usb = true; break;
    case 'io-video': n.hdmi = 'board'; break;
    case 'gpu-video': n.hdmi = 'gpu'; break;
    case 'psu-socket': n.cord = true; break;
    default: n[zoneId] = true;
  }
  return n;
}

export function removePart(st, key) {
  let n = { ...st, ram: [...st.ram], cpcie: [...st.cpcie] };
  const drop = k => { n = removePart(n, k); };
  if (key.startsWith('ram-')) { n.ram[+key.slice(4)] = null; return n; }
  if (key.startsWith('cpcie-')) { n.cpcie[+key.slice(6)] = false; return n; }
  switch (key) {
    case 'mobo':
      ['cpu', 'm2', 'gpu', 'c24', 'ceps', 'csatad', 'fpanel', 'usb', 'hdmi'].forEach(drop);
      n.ram = [null, null, null, null];
      n.mobo = false;
      break;
    case 'cpu': drop('cooler'); n.paste = false; n.cpu = null; break;
    case 'cooler': n.cpufan = false; n.paste = false; n.cooler = null; break;
    case 'gpu': n.cpcie = [false, false]; if (n.hdmi === 'gpu') n.hdmi = null; n.gpu = null; break;
    case 'psu': n.c24 = false; n.ceps = false; n.cpcie = [false, false]; n.csatap = false; n.cord = false; n.psuOn = false; n.psu = null; break;
    case 'sata': n.csatap = false; n.csatad = false; n.sata = null; break;
    case 'hdmi': n.hdmi = null; break;
    case 'm2': n.m2 = null; break;
    default: n[key] = false;
  }
  return n;
}

export function installedList(st, board) {
  const out = [];
  const push = (key, label) => out.push({ key, label });
  if (st.mobo) push('mobo', board.name);
  if (st.cpu) push('cpu', CPUS[st.cpu].name);
  if (st.paste) push('paste', EXTRAS.paste.name);
  if (st.cooler) push('cooler', COOLERS[st.cooler].name);
  if (st.cpufan) push('cpufan', 'Ventilador → CPU_FAN');
  st.ram.forEach((r, i) => r && push(`ram-${i}`, `${RAMS[r].name} (DIMM ${i + 1})`));
  if (st.m2) push('m2', STORAGE[st.m2].name);
  if (st.gpu) push('gpu', GPUS[st.gpu].name);
  if (st.psu) push('psu', PSUS[st.psu].name);
  if (st.sata) push('sata', STORAGE[st.sata].name);
  if (st.c24) push('c24', EXTRAS.c24.name);
  if (st.ceps) push('ceps', EXTRAS.ceps.name);
  st.cpcie.forEach((c, i) => c && push(`cpcie-${i}`, `${EXTRAS.cpcie.name} #${i + 1}`));
  if (st.csatap) push('csatap', EXTRAS.csatap.name);
  if (st.csatad) push('csatad', EXTRAS.csatad.name);
  if (st.fpanel) push('fpanel', EXTRAS.fpanel.name);
  if (st.usb) push('usb', EXTRAS.usb.name);
  if (st.hdmi) push('hdmi', `${EXTRAS.hdmi.name} (${st.hdmi === 'gpu' ? 'tarjeta de video' : 'placa madre'})`);
  if (st.cord) push('cord', EXTRAS.cord.name);
  return out;
}

// ─────────────────────────────────────────────────────────── DIAGNÓSTICO ──
// Se evalúa sólo al presionar el botón de encendido.

export function diagnose(st, board) {
  const cpu = st.cpu && CPUS[st.cpu];
  const gpu = st.gpu && GPUS[st.gpu];
  const psu = st.psu && PSUS[st.psu];
  const cooler = st.cooler && COOLERS[st.cooler];

  if (!st.mobo || !psu || !st.cord || !st.psuOn || !st.c24 || !st.fpanel) return 'nopower';
  if ((cpu?.peak || 0) + (gpu?.watt || 0) + 80 > psu.watt) return 'overload';
  if (!cpu || cpu.socket !== board.socket || !st.ceps) return 'cpu';

  const sticks = st.ram.filter(Boolean).map(id => RAMS[id]);
  if (!sticks.length || sticks.some(r => r.type !== board.ramType)) return 'dram';

  if (gpu && st.cpcie.filter(Boolean).length < gpu.pcie) return 'vga';
  if (!gpu && !cpu.igpu) return 'vga';
  if (!st.hdmi) return 'vga';
  if (st.hdmi === 'board' && (gpu || !cpu.igpu)) return 'vga';

  if (!cooler || !st.paste || !st.cpufan || !cooler.mounts.includes(cpu.socket) || cooler.tdp < cpu.tdp) return 'thermal';

  const disk = st.m2 || (st.sata && st.csatap && st.csatad);
  if (!disk || !st.usb) return 'boot';
  return 'ok';
}

export function bootDisks(st) {
  const out = [];
  if (st.m2) out.push(STORAGE[st.m2]);
  if (st.sata && st.csatap && st.csatad) out.push(STORAGE[st.sata]);
  return out;
}
