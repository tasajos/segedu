// Decide, por el host de la petición, si atiende la plataforma (superadmin),
// una institución con subdominio o la instalación por defecto.
//
//   segedu.chakuy.online              → instalación por defecto (DB_NAME)
//   plataforma.segedu.chakuy.online   → panel de Chakuy (superadmin)
//   colegio-x.segedu.chakuy.online    → base de la institución "colegio-x"
//
// En desarrollo, BASE_DOMINIO=localhost y se entra por colegio-x.localhost:5173.
import { conInstitucion, multiInstitucionActiva } from './contexto.js';
import { plataformaPool } from '../plataforma/db.js';

export const SUBDOMINIOS_RESERVADOS = new Set([
  'www', 'plataforma', 'admin', 'api', 'app', 'mail', 'webmail', 'smtp', 'imap', 'pop', 'ftp',
  'cpanel', 'whm', 'webdisk', 'cpcalendars', 'cpcontacts', 'autodiscover', 'autoconfig', 'ns1', 'ns2',
  'static', 'cdn', 'assets', 'uploads', 'soporte', 'chakuy', 'segedu', 'demo', 'test', 'dev', 'staging'
]);

export const subdominioPlataforma = () => (process.env.PLATAFORMA_SUBDOMINIO || 'plataforma').toLowerCase();
export const baseDominio = () => (process.env.BASE_DOMINIO || 'localhost').toLowerCase();

const confiarProxy = () => ['1', 'true'].includes(String(process.env.CONFIAR_PROXY || '').toLowerCase())
  || process.env.NODE_ENV !== 'production';

export const hostDe = (req) => {
  const reenviado = confiarProxy() ? String(req.headers['x-forwarded-host'] || '').split(',')[0].trim() : '';
  return (reenviado || req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
};

/** Devuelve el subdominio del host respecto de BASE_DOMINIO, o null si es el dominio principal. */
export const subdominioDe = (host) => {
  const b = baseDominio();
  if (!host || host === b || !host.endsWith(`.${b}`)) return null;
  const sub = host.slice(0, -(b.length + 1));
  return sub === 'www' ? null : sub;
};

// Caché corta para no consultar la base de la plataforma en cada petición.
const cache = new Map();
const TTL = 30_000;
export const invalidarCacheInstitucion = (subdominio) => (subdominio ? cache.delete(subdominio) : cache.clear());

const buscar = async (sub) => {
  const hit = cache.get(sub);
  if (hit && hit.expira > Date.now()) return hit.fila;
  const [[fila]] = await plataformaPool().query('SELECT * FROM plataforma_instituciones WHERE subdominio = ?', [sub]);
  cache.set(sub, { fila: fila || null, expira: Date.now() + TTL });
  return fila || null;
};

const esApi = (req) => req.path.startsWith('/api/');
const libreEnCualquierHost = (req) => req.path === '/api/health' || req.path === '/api/contexto';

export const resolverInstitucion = async (req, res, next) => {
  if (!multiInstitucionActiva()) {
    if (esApi(req) && req.path.startsWith('/api/plataforma/')) return res.status(404).json({ error: 'Ruta no encontrada' });
    req.contexto = { tipo: 'institucion', subdominio: null };
    return conInstitucion(null, next);
  }

  const sub = subdominioDe(hostDe(req));

  // Panel de la plataforma: solo sus propias rutas de API.
  if (sub === subdominioPlataforma()) {
    req.contexto = { tipo: 'plataforma', subdominio: sub };
    if (esApi(req) && !libreEnCualquierHost(req) && !req.path.startsWith('/api/plataforma/')) {
      return res.status(404).json({ error: 'Esta ruta no existe en el panel de la plataforma' });
    }
    return conInstitucion(null, next);
  }

  // Las rutas de la plataforma no se exponen en los dominios de las instituciones.
  if (esApi(req) && req.path.startsWith('/api/plataforma/')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }

  if (!sub) {
    req.contexto = { tipo: 'institucion', subdominio: null };
    return conInstitucion(null, next);
  }

  let inst;
  try {
    inst = await buscar(sub);
  } catch (err) {
    console.error('No se pudo consultar la plataforma:', err.message);
    return res.status(503).json({ error: 'Servicio no disponible. Intente en unos minutos.' });
  }

  if (!inst) {
    req.contexto = { tipo: 'desconocida', subdominio: sub };
    if (esApi(req) && !libreEnCualquierHost(req)) return res.status(404).json({ error: 'Institución no encontrada' });
    return next();
  }

  req.contexto = { tipo: 'institucion', subdominio: sub, estado: inst.estado, nombre: inst.nombre };
  // Copia en req: algunos callbacks de streams (multer) pierden el AsyncLocalStorage.
  req.institucion = inst.estado === 'activa' ? inst : null;
  if (inst.estado !== 'activa') {
    if (esApi(req) && !libreEnCualquierHost(req)) {
      const mensaje = inst.estado === 'suspendida'
        ? 'El acceso a esta institución está suspendido. Comuníquese con Chakuy Software.'
        : 'Esta institución todavía se está configurando.';
      return res.status(403).json({ error: mensaje, estado: inst.estado });
    }
    return next();
  }
  return conInstitucion(inst, next);
};
