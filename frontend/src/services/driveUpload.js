// Sube un archivo directamente a una sesión reanudable de Google Drive.
// No usa la instancia de axios: el JWT de SEGEDU nunca debe enviarse a Google.

export const MAX_VIDEO_BYTES = 3 * 1024 * 1024 * 1024;

const MAX_CONSECUTIVE_FAILURES = 10;
const FATAL_STATUSES = new Set([400, 401, 403, 404, 410]);

export const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
};

const abortError = () => new DOMException('Subida cancelada', 'AbortError');

const wait = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(abortError());
  }, { once: true });
});

const send = (url, { headers, body = null, onUploadProgress, signal }) => new Promise((resolve, reject) => {
  if (signal.aborted) {
    reject(abortError());
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', url);
  Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
  if (onUploadProgress) xhr.upload.onprogress = (event) => onUploadProgress(event.loaded);

  const abort = () => xhr.abort();
  signal.addEventListener('abort', abort, { once: true });
  const settle = (callback) => () => {
    signal.removeEventListener('abort', abort);
    callback();
  };
  xhr.onload = settle(() => resolve(xhr));
  xhr.onerror = settle(() => resolve(xhr)); // status 0: red caída, se reintenta
  xhr.onabort = settle(() => reject(abortError()));
  xhr.send(body);
});

const isComplete = (xhr) => xhr.status === 200 || xhr.status === 201;

const assertNotFatal = (xhr) => {
  if (FATAL_STATUSES.has(xhr.status)) {
    throw new Error(`Google Drive rechazó la subida (código ${xhr.status}). Inténtalo de nuevo.`);
  }
};

// "Range: bytes=0-1234" indica el último byte guardado; sin header no hay ninguno.
const nextOffset = (xhr) => {
  const match = /bytes=0-(\d+)/.exec(xhr.getResponseHeader('Range') || '');
  return match ? Number(match[1]) + 1 : 0;
};

export async function uploadToDrive(uploadUrl, file, { contentType, onProgress, signal }) {
  const size = file.size;
  let offset = 0;
  let failures = 0;

  for (;;) {
    const startedAt = offset;
    const response = await send(uploadUrl, {
      headers: {
        'Content-Type': contentType,
        ...(startedAt > 0 ? { 'Content-Range': `bytes ${startedAt}-${size - 1}/${size}` } : {})
      },
      body: startedAt > 0 ? file.slice(startedAt) : file,
      onUploadProgress: (loaded) => onProgress(Math.min((startedAt + loaded) / size, 1)),
      signal
    });
    if (isComplete(response)) return JSON.parse(response.responseText);
    assertNotFatal(response);

    // Interrumpida: preguntar a Drive cuánto guardó y continuar desde ahí.
    for (;;) {
      failures += 1;
      if (failures > MAX_CONSECUTIVE_FAILURES) {
        throw new Error('Se perdió la conexión con Google Drive. Revisa tu internet e inténtalo de nuevo.');
      }
      await wait(Math.min(2 ** failures, 30) * 1000, signal);

      const status = await send(uploadUrl, { headers: { 'Content-Range': `bytes */${size}` }, signal });
      if (isComplete(status)) return JSON.parse(status.responseText);
      assertNotFatal(status);
      if (status.status === 308) {
        const resumeAt = nextOffset(status);
        if (resumeAt > offset) failures = 0;
        offset = resumeAt;
        onProgress(offset / size);
        break;
      }
    }
  }
}
