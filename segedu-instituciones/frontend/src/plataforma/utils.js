export const mensajeError = err => err.response?.data?.message || err.response?.data?.error || 'No se pudo completar la acción. Intente nuevamente.';

export const sugerirSubdominio = nombre => nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/g, '');

export const fecha = valor => valor ? new Date(valor).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const tipos = { colegio: 'Colegio', instituto: 'Instituto', universidad: 'Universidad' };
