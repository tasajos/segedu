import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const POR_DEFECTO = {
  nombre: 'Mi Institución',
  sigla: 'SEGEDU',
  tipo: 'instituto',
  lema: 'Seguimiento académico simple y ordenado',
  logo_url: null,
  color_primario: '#1f6f5c',
  color_acento: '#f2b705',
  terminos: {
    programa: 'Carrera', programas: 'Carreras', periodo: 'Semestre', periodos: 'Semestres',
    asignatura: 'Materia', asignaturas: 'Materias', docente: 'Docente', docentes: 'Docentes',
    estudiante: 'Estudiante', estudiantes: 'Estudiantes', jefe: 'Coordinador académico', plan: 'Plan'
  }
};

const InstitucionContext = createContext({ institucion: POR_DEFECTO, t: (k) => k, recargar: () => {} });

const aplicarColores = (inst) => {
  const raiz = document.documentElement;
  if (inst.color_primario) raiz.style.setProperty('--brand', inst.color_primario);
  if (inst.color_acento) raiz.style.setProperty('--accent', inst.color_acento);
  window.__SEGEDU_LOGO__ = inst.logo_url || null;
  window.__SEGEDU_NOMBRE__ = inst.nombre;
  document.title = `${inst.sigla || 'SEGEDU'} · ${inst.nombre}`;
};

export const InstitucionProvider = ({ children }) => {
  const [institucion, setInstitucion] = useState(POR_DEFECTO);

  const recargar = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/institucion');
      const inst = { ...POR_DEFECTO, ...data, terminos: { ...POR_DEFECTO.terminos, ...(data.terminos || {}) } };
      setInstitucion(inst);
      aplicarColores(inst);
    } catch {
      aplicarColores(POR_DEFECTO);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  // t('programas') → "Carreras", "Niveles", etc. según el tipo de institución.
  const t = useCallback((clave) => institucion.terminos[clave] || clave, [institucion]);

  return (
    <InstitucionContext.Provider value={{ institucion, t, recargar, setInstitucion: (i) => { setInstitucion(i); aplicarColores(i); } }}>
      {children}
    </InstitucionContext.Provider>
  );
};

export const useInstitucion = () => useContext(InstitucionContext);

// Logo de la institución, o sus iniciales si todavía no subió uno.
export function LogoInstitucion({ size = 40 }) {
  const { institucion } = useInstitucion();
  if (institucion.logo_url) {
    return <img src={institucion.logo_url} alt={institucion.nombre} className="inst-logo" style={{ width: size, height: size }} />;
  }
  const iniciales = (institucion.sigla || institucion.nombre || 'S').slice(0, 3).toUpperCase();
  return (
    <span className="inst-logo inst-logo-letras" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-label={institucion.nombre}>
      {iniciales}
    </span>
  );
}
