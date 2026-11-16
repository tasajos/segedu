import pool from '../config/db.js';

// Términos que cambian según el tipo de institución.
// El administrador puede sobreescribir cualquiera desde "Mi institución".
export const TERMINOS_POR_TIPO = {
  universidad: {
    programa: 'Carrera', programas: 'Carreras',
    periodo: 'Semestre', periodos: 'Semestres',
    asignatura: 'Materia', asignaturas: 'Materias',
    docente: 'Docente', docentes: 'Docentes',
    estudiante: 'Estudiante', estudiantes: 'Estudiantes',
    jefe: 'Jefe de carrera', plan: 'PGO'
  },
  instituto: {
    programa: 'Carrera técnica', programas: 'Carreras técnicas',
    periodo: 'Semestre', periodos: 'Semestres',
    asignatura: 'Módulo', asignaturas: 'Módulos',
    docente: 'Docente', docentes: 'Docentes',
    estudiante: 'Estudiante', estudiantes: 'Estudiantes',
    jefe: 'Coordinador académico', plan: 'Plan de módulo'
  },
  colegio: {
    programa: 'Nivel', programas: 'Niveles',
    periodo: 'Curso', periodos: 'Cursos',
    asignatura: 'Materia', asignaturas: 'Materias',
    docente: 'Profesor', docentes: 'Profesores',
    estudiante: 'Estudiante', estudiantes: 'Estudiantes',
    jefe: 'Director', plan: 'Plan anual'
  }
};

const DEFAULTS = {
  nombre: 'Mi Institución',
  sigla: 'SEGEDU',
  tipo: 'instituto',
  lema: 'Seguimiento académico simple y ordenado',
  logo_url: null,
  color_primario: '#1f6f5c',
  color_acento: '#f2b705',
  ciudad: null,
  telefono: null,
  terminos: {}
};

const parseTerminos = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value) || {}; } catch { return {}; }
};

export const leerInstitucion = async () => {
  try {
    const [[row]] = await pool.query('SELECT * FROM institucion ORDER BY id LIMIT 1');
    if (!row) return { ...DEFAULTS, terminos: TERMINOS_POR_TIPO[DEFAULTS.tipo] };
    const tipo = TERMINOS_POR_TIPO[row.tipo] ? row.tipo : DEFAULTS.tipo;
    return {
      nombre: row.nombre,
      sigla: row.sigla,
      tipo,
      lema: row.lema,
      logo_url: row.logo_url,
      color_primario: row.color_primario || DEFAULTS.color_primario,
      color_acento: row.color_acento || DEFAULTS.color_acento,
      ciudad: row.ciudad,
      telefono: row.telefono,
      terminos: { ...TERMINOS_POR_TIPO[tipo], ...parseTerminos(row.terminos) }
    };
  } catch {
    return { ...DEFAULTS, terminos: TERMINOS_POR_TIPO[DEFAULTS.tipo] };
  }
};

// Público: el login necesita nombre, logo y colores antes de iniciar sesión.
export const obtenerInstitucion = async (req, res) => {
  res.json(await leerInstitucion());
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export const actualizarInstitucion = async (req, res) => {
  try {
    if (req.file && req.file.mimetype !== 'image/png') {
      return res.status(400).json({ error: 'El logo debe ser una imagen PNG' });
    }
    const actual = await leerInstitucion();
    const body = req.body || {};
    const tipo = TERMINOS_POR_TIPO[body.tipo] ? body.tipo : actual.tipo;
    const nombre = String(body.nombre || actual.nombre).trim().slice(0, 200);
    if (!nombre) return res.status(400).json({ error: 'El nombre de la institución es obligatorio' });

    // Solo se guardan los términos que difieren del valor por defecto del tipo.
    const recibidos = parseTerminos(body.terminos);
    const terminos = {};
    for (const key of Object.keys(TERMINOS_POR_TIPO[tipo])) {
      const valor = String(recibidos[key] ?? '').trim().slice(0, 60);
      if (valor && valor !== TERMINOS_POR_TIPO[tipo][key]) terminos[key] = valor;
    }

    const datos = {
      nombre,
      sigla: String(body.sigla || actual.sigla || '').trim().slice(0, 30),
      tipo,
      lema: String(body.lema ?? actual.lema ?? '').trim().slice(0, 250) || null,
      logo_url: req.file ? `/uploads/${req.file.filename}` : actual.logo_url,
      color_primario: HEX.test(body.color_primario || '') ? body.color_primario : actual.color_primario,
      color_acento: HEX.test(body.color_acento || '') ? body.color_acento : actual.color_acento,
      ciudad: String(body.ciudad ?? actual.ciudad ?? '').trim().slice(0, 100) || null,
      telefono: String(body.telefono ?? actual.telefono ?? '').trim().slice(0, 40) || null,
      terminos: JSON.stringify(terminos)
    };

    const [[row]] = await pool.query('SELECT id FROM institucion ORDER BY id LIMIT 1');
    if (row) {
      await pool.query('UPDATE institucion SET ? WHERE id = ?', [datos, row.id]);
    } else {
      await pool.query('INSERT INTO institucion SET ?', [datos]);
    }
    res.json(await leerInstitucion());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo guardar la configuración de la institución' });
  }
};
