// Cliente mínimo de Google Drive v3 para los videotutoriales.
// Autentica con una cuenta de servicio que es miembro de una unidad compartida.

import jwt from 'jsonwebtoken';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const FOLDER_NAME = 'videotutoriales_unicen';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export class DriveError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

let accessToken = null;
let accessTokenExpiresAt = 0;
let folderIdPromise = null;

const getSharedDriveId = () => {
  const { GOOGLE_SHARED_DRIVE_ID: driveId } = process.env;
  if (!driveId) throw new DriveError('Google Drive no está configurado en el servidor', 503);
  return driveId;
};

// Reconstruye el PEM sin importar cómo lo guardó el panel de hosting:
// con comillas, con "\n" literal, con saltos reales o con espacios.
const normalizePrivateKey = (rawKey) => {
  const body = rawKey
    .replace(/\\n/g, '')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/[\s"']/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`;
};

const getAccessToken = async () => {
  if (accessToken && Date.now() < accessTokenExpiresAt) return accessToken;

  if (typeof fetch !== 'function') throw new DriveError('El servidor necesita Node.js 18 o superior', 503);

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL: email, GOOGLE_PRIVATE_KEY: rawKey } = process.env;
  if (!email || !rawKey) throw new DriveError('Google Drive no está configurado en el servidor', 503);

  let assertion;
  try {
    assertion = jwt.sign({ scope: SCOPE }, normalizePrivateKey(rawKey), {
      algorithm: 'RS256',
      issuer: email,
      audience: TOKEN_URL,
      expiresIn: 3600
    });
  } catch (err) {
    console.error('[Google Drive] Clave privada inválida:', err.message);
    throw new DriveError('La clave privada de la cuenta de servicio no es válida', 503);
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[Google Drive] Error al obtener el token:', data.error, data.error_description);
    throw new DriveError('No se pudo autenticar con Google Drive', 503);
  }

  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
};

const driveFetch = async (url, options = {}) => {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new DriveError(data.error?.message || `Google Drive respondió ${res.status}`, res.status);
  }
  return res;
};

const sendJson = (method, url, body, headers = {}) => driveFetch(url, {
  method,
  headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
  body: JSON.stringify(body)
});

const findOrCreateFolder = async () => {
  const driveId = getSharedDriveId();
  const query = new URLSearchParams({
    q: `name = '${FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and '${driveId}' in parents and trashed = false`,
    fields: 'files(id)',
    pageSize: '1',
    corpora: 'drive',
    driveId,
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true'
  });
  const found = await (await driveFetch(`${API_URL}/files?${query}`)).json();
  if (found.files?.length) return found.files[0].id;

  const created = await sendJson('POST', `${API_URL}/files?fields=id&supportsAllDrives=true`, {
    name: FOLDER_NAME,
    mimeType: FOLDER_MIME,
    parents: [driveId]
  });
  return (await created.json()).id;
};

// La promesa compartida evita crear carpetas duplicadas con subidas simultáneas.
export const getFolderId = () => {
  folderIdPromise ??= findOrCreateFolder().catch((err) => {
    folderIdPromise = null;
    throw err;
  });
  return folderIdPromise;
};

// Comprueba lo que haría fallar la publicación al terminar una subida de horas.
export const assertSharedDriveReady = async () => {
  const res = await driveFetch(
    `${API_URL}/drives/${encodeURIComponent(getSharedDriveId())}?fields=restrictions,capabilities(canManageMembers)`
  );
  const { restrictions, capabilities } = await res.json();
  // El reproductor embebido necesita compartir por enlace con personas sin cuenta del dominio.
  if (restrictions?.domainUsersOnly) {
    throw new DriveError('La unidad compartida no permite compartir fuera de la organización', 503);
  }
  // Google solo deja bloquear descargas a un Administrador de la unidad.
  if (!capabilities?.canManageMembers) {
    throw new DriveError('La cuenta de servicio debe tener el rol de Administrador en la unidad compartida', 503);
  }
};

// Devuelve una URL de subida reanudable que el navegador usa directamente.
// El header Origin es lo que habilita CORS en esa URL para el frontend.
export const createUploadSession = async ({ name, mimeType, size, origin }) => {
  const folderId = await getFolderId();
  const res = await sendJson(
    'POST',
    `${UPLOAD_URL}?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,mimeType`,
    { name, parents: [folderId] },
    {
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
      ...(origin ? { Origin: origin } : {})
    }
  );
  const uploadUrl = res.headers.get('location');
  if (!uploadUrl) throw new DriveError('Google Drive no devolvió la URL de subida');
  return uploadUrl;
};

export const getFile = async (fileId) => {
  const res = await driveFetch(
    `${API_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,size,mimeType,parents,trashed`
  );
  return res.json();
};

// Quita a los lectores las opciones de descargar, copiar e imprimir el archivo.
export const disableDownloadForViewers = (fileId) => sendJson(
  'PATCH',
  `${API_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id`,
  { copyRequiresWriterPermission: true }
);

export const makeViewableByLink = (fileId) => sendJson(
  'POST',
  `${API_URL}/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`,
  { role: 'reader', type: 'anyone', allowFileDiscovery: false }
);

// Papelera y no borrado definitivo: este último exige el rol de Administrador de la unidad.
export const trashFile = async (fileId) => {
  try {
    await sendJson('PATCH', `${API_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id`, { trashed: true });
  } catch (err) {
    if (err.status !== 404) throw err;
  }
};
