// Contexto de la petición: qué institución (y por lo tanto qué base de datos) atiende.
// Se propaga con AsyncLocalStorage, así que controladores y utilidades no cambian:
// siguen importando `pool` y este decide la base según el contexto.
import { AsyncLocalStorage } from 'node:async_hooks';

const almacen = new AsyncLocalStorage();

/** Ejecuta `fn` dentro del contexto de `institucion` (null = instalación por defecto). */
export const conInstitucion = (institucion, fn) => almacen.run({ institucion }, fn);

/** Fila de plataforma_instituciones de la petición actual, o null si es la instalación por defecto. */
export const institucionActual = () => almacen.getStore()?.institucion ?? null;

/** Clave estable de la institución actual: su subdominio o '__default'. */
export const claveInstitucion = () => institucionActual()?.subdominio ?? '__default';

export const multiInstitucionActiva = () => ['1', 'true', 'si', 'sí'].includes(String(process.env.MULTI_INSTITUCION || '').toLowerCase());
