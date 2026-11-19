// Cliente mínimo de la UAPI de cPanel (https://api.docs.cpanel.net/).
// Autenticación con token de API: Authorization: cpanel <usuario>:<token>
const config = () => {
  const host = process.env.CPANEL_HOST;
  const usuario = process.env.CPANEL_USUARIO;
  const token = process.env.CPANEL_TOKEN;
  if (!host || !usuario || !token) {
    throw new Error('Faltan CPANEL_HOST, CPANEL_USUARIO o CPANEL_TOKEN en el .env del backend');
  }
  const puerto = process.env.CPANEL_PUERTO || '2083';
  return { base: `https://${host}:${puerto}/execute`, auth: `cpanel ${usuario}:${token}` };
};

export const uapi = async (modulo, funcion, params = {}) => {
  const { base, auth } = config();
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${base}/${modulo}/${funcion}?${qs}`;
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: auth }, signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    throw new Error(`No se pudo conectar con cPanel (${modulo}/${funcion}): ${err.message}`);
  }
  const texto = await res.text();
  let json;
  try { json = JSON.parse(texto); } catch {
    throw new Error(`cPanel respondió algo inesperado en ${modulo}/${funcion} (HTTP ${res.status})`);
  }
  if (!res.ok || json.status !== 1) {
    const errores = (json.errors || []).join(' · ') || `HTTP ${res.status}`;
    const e = new Error(`cPanel ${modulo}/${funcion}: ${errores}`);
    e.yaExiste = /already exists|ya existe|exists/i.test(errores);
    throw e;
  }
  return json.data;
};

/** Prefijo y largos máximos que impone cPanel a bases y usuarios MySQL. */
export const restriccionesMysql = async () => {
  const d = await uapi('Mysql', 'get_restrictions');
  return {
    prefijo: d.prefix || '',
    largoBase: Number(d.max_database_name_length) || 64,
    largoUsuario: Number(d.max_username_length) || 32
  };
};

/** Ejecuta un paso y lo da por bueno si el recurso ya existía (permite reintentar). */
export const idempotente = async (fn) => {
  try { return await fn(); } catch (err) { if (err.yaExiste) return null; throw err; }
};
