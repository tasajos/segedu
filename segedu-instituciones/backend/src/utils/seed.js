/**
 * SEGEDU Instituciones — generador de datos de demostración.
 *
 * Todos los nombres, correos, códigos y registros se generan al azar:
 * ningún dato corresponde a personas o instituciones reales.
 *
 * Uso:
 *   npm run seed                              (instituto, 120 estudiantes)
 *   npm run seed -- --tipo=colegio --estudiantes=200
 *   npm run seed -- --tipo=universidad --semilla=42
 *
 * ATENCIÓN: borra todo el contenido de la base de datos configurada en .env.
 */
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.slice(2).split('=');
    return [k, v];
  })
);
const TIPO = ['universidad', 'instituto', 'colegio'].includes(args.tipo) ? args.tipo : 'instituto';
const TOTAL_ESTUDIANTES = Math.max(20, Math.min(2000, Number(args.estudiantes) || 120));
const PASSWORD_DEMO = args.password || 'demo1234';

// --- Aleatorio reproducible (mulberry32) ---------------------------------
let estado = Number(args.semilla) || Math.floor(Math.random() * 2 ** 31);
const SEMILLA = estado;
const rnd = () => {
  estado |= 0; estado = (estado + 0x6d2b79f5) | 0;
  let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entero = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const elegir = (lista) => lista[Math.floor(rnd() * lista.length)];
const prob = (p) => rnd() < p;

const NOMBRES = ['Ana', 'Luis', 'María', 'Jorge', 'Carla', 'Diego', 'Paola', 'Andrés', 'Lucía', 'Marco', 'Sofía', 'Daniel', 'Valeria', 'Rodrigo', 'Camila', 'Fernando', 'Gabriela', 'Sergio', 'Natalia', 'Javier', 'Daniela', 'Pablo', 'Mariana', 'Álvaro', 'Fabiola', 'Gustavo', 'Patricia', 'Ricardo', 'Verónica', 'Mauricio', 'Adriana', 'Hugo', 'Claudia', 'Iván', 'Lorena', 'Óscar', 'Jimena', 'Raúl', 'Noelia', 'Wilson', 'Mónica', 'Franz', 'Roxana', 'Limbert', 'Yesica', 'Edwin', 'Ximena', 'Ronald', 'Karen', 'Boris'];
const APELLIDOS = ['Mamani', 'Quispe', 'Flores', 'Rojas', 'Vargas', 'Gutiérrez', 'Condori', 'Choque', 'Fernández', 'López', 'Torrez', 'Rodríguez', 'Pérez', 'Sánchez', 'Guzmán', 'Camacho', 'Zeballos', 'Montaño', 'Arce', 'Villarroel', 'Claros', 'Salazar', 'Rocha', 'Cardozo', 'Antezana', 'Céspedes', 'Orellana', 'Terrazas', 'Soliz', 'Vera', 'Ledezma', 'Pinto', 'Aguilar', 'Rivera', 'Mercado', 'Olivera', 'Balderrama', 'Escóbar', 'Nogales', 'Ticona'];

const CATALOGO = {
  universidad: {
    institucion: { nombre: 'Universidad Demostrativa del Valle', sigla: 'UDV', lema: 'Formación profesional con seguimiento cercano' },
    programas: [
      { nombre: 'Ingeniería de Sistemas', codigo: 'SIS', materias: [['Introducción a la Programación', 'Matemática Básica', 'Física General', 'Inglés Técnico I'], ['Estructuras de Datos', 'Cálculo I', 'Base de Datos I', 'Inglés Técnico II'], ['Programación Web', 'Estadística', 'Redes de Computadoras', 'Ingeniería de Software']] },
      { nombre: 'Administración de Empresas', codigo: 'ADM', materias: [['Fundamentos de Administración', 'Contabilidad I', 'Matemática Financiera', 'Comunicación Empresarial'], ['Microeconomía', 'Contabilidad II', 'Marketing I', 'Derecho Comercial'], ['Gestión de Talento Humano', 'Finanzas I', 'Investigación de Mercados', 'Emprendimiento']] }
    ]
  },
  instituto: {
    institucion: { nombre: 'Instituto Técnico Demostrativo', sigla: 'ITD', lema: 'Aprender haciendo, con seguimiento día a día' },
    programas: [
      { nombre: 'Sistemas Informáticos', codigo: 'INF', materias: [['Ofimática Aplicada', 'Lógica de Programación', 'Hardware de Computadoras', 'Inglés Técnico'], ['Programación I', 'Redes I', 'Base de Datos', 'Diseño Web'], ['Programación II', 'Soporte Técnico', 'Seguridad Informática', 'Proyecto de Grado']] },
      { nombre: 'Contaduría General', codigo: 'CON', materias: [['Contabilidad Básica', 'Matemática Comercial', 'Legislación Tributaria', 'Redacción Comercial'], ['Contabilidad Intermedia', 'Costos I', 'Sistemas Contables', 'Estadística'], ['Auditoría', 'Costos II', 'Gabinete Contable', 'Práctica Empresarial']] }
    ]
  },
  colegio: {
    institucion: { nombre: 'Unidad Educativa Demostrativa', sigla: 'UED', lema: 'Familias informadas, estudiantes acompañados' },
    programas: [
      { nombre: 'Secundaria', codigo: 'SEC', materias: [['Matemática', 'Lenguaje', 'Ciencias Naturales', 'Ciencias Sociales'], ['Matemática', 'Lenguaje', 'Física', 'Química'], ['Matemática', 'Literatura', 'Biología', 'Filosofía']] },
      { nombre: 'Primaria', codigo: 'PRI', materias: [['Matemática', 'Lenguaje', 'Ciencias de la Vida', 'Artes Plásticas'], ['Matemática', 'Lenguaje', 'Ciencias de la Vida', 'Educación Física'], ['Matemática', 'Lenguaje', 'Tecnología', 'Música']] }
    ]
  }
};

const ESPECIALIDADES = ['Informática educativa', 'Matemática aplicada', 'Gestión empresarial', 'Lingüística', 'Ciencias exactas', 'Pedagogía', 'Contabilidad', 'Redes y telecomunicaciones'];
const TITULOS = ['Lic.', 'Ing.', 'M.Sc.', 'Prof.'];
const TEMAS = ['Presentación y diagnóstico inicial', 'Conceptos fundamentales', 'Taller práctico guiado', 'Resolución de casos', 'Evaluación formativa', 'Trabajo en equipo', 'Repaso general', 'Proyecto integrador'];
const COMENTARIOS = {
  positivo: ['Participa activamente en clase.', 'Entrega sus trabajos con puntualidad.', 'Muestra mejora constante.'],
  felicitacion: ['Excelente exposición grupal.', 'Mejor nota del parcial.'],
  observacion: ['Debe reforzar la práctica fuera de clase.', 'Llega tarde con frecuencia.'],
  alerta: ['Acumula faltas sin justificar.', 'No presentó las dos últimas tareas.']
};
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOQUES = [['07:45:00', '09:15:00'], ['09:30:00', '11:00:00'], ['11:15:00', '12:45:00'], ['14:30:00', '16:00:00'], ['16:15:00', '17:45:00']];

const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const iso = (d) => d.toISOString().slice(0, 10);
const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const insertar = async (conn, tabla, columnas, filas, lote = 500) => {
  for (let i = 0; i < filas.length; i += lote) {
    await conn.query(`INSERT INTO ${tabla} (${columnas.join(',')}) VALUES ?`, [filas.slice(i, i + lote)]);
  }
};

const main = async () => {
  const conn = await pool.getConnection();
  const cat = CATALOGO[TIPO];
  const dominio = `${cat.institucion.sigla.toLowerCase()}.demo`;
  const hash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const periodo = String(new Date().getFullYear());
  const usados = new Set();

  const persona = () => {
    const nombre = elegir(NOMBRES);
    const apellido = `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`;
    let base = `${sinAcentos(nombre)}.${sinAcentos(apellido.split(' ')[0])}`;
    let email = `${base}@${dominio}`;
    for (let n = 2; usados.has(email); n += 1) email = `${base}${n}@${dominio}`;
    usados.add(email);
    return { nombre, apellido, email, ci: String(entero(3000000, 9999999)), telefono: `7${entero(1000000, 9999999)}` };
  };
  const crearUsuario = async (rol, fijo = {}) => {
    const p = { ...persona(), ...fijo };
    usados.add(p.email);
    const [r] = await conn.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, ci, telefono, activo) VALUES (?,?,?,?,?,?,?,1)',
      [p.nombre, p.apellido, p.email, hash, rol, p.ci, p.telefono]
    );
    return { id: r.insertId, ...p };
  };

  try {
    console.log(`Generando demo "${TIPO}" con ${TOTAL_ESTUDIANTES} estudiantes (semilla ${SEMILLA})...`);
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    const [tablas] = await conn.query('SHOW TABLES');
    for (const fila of tablas) await conn.query(`TRUNCATE TABLE \`${Object.values(fila)[0]}\``);
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    await conn.query(
      'INSERT INTO institucion (nombre, sigla, tipo, lema, ciudad) VALUES (?,?,?,?,?)',
      [cat.institucion.nombre, cat.institucion.sigla, TIPO, cat.institucion.lema, 'Ciudad Demo']
    );

    const admin = await crearUsuario('admin', { nombre: 'Admin', apellido: 'Demo', email: `admin@${dominio}` });
    await crearUsuario('auditor', { nombre: 'Auditor', apellido: 'Demo', email: `auditor@${dominio}` });

    // Docentes
    const docentes = [];
    for (let i = 0; i < 12; i += 1) {
      const u = await crearUsuario('docente', i === 0 ? { email: `docente@${dominio}` } : {});
      const [r] = await conn.query('INSERT INTO docentes (usuario_id, especialidad, titulo) VALUES (?,?,?)', [u.id, elegir(ESPECIALIDADES), elegir(TITULOS)]);
      docentes.push({ id: r.insertId, usuario: u });
    }

    // Programas, jefes y materias
    const programas = [];
    const materias = [];
    for (const [idx, prog] of cat.programas.entries()) {
      const jefe = await crearUsuario('jefe', idx === 0 ? { email: `jefe@${dominio}` } : {});
      const [c] = await conn.query('INSERT INTO carreras (nombre, codigo, jefe_id) VALUES (?,?,?)', [prog.nombre, prog.codigo, jefe.id]);
      const programa = { id: c.insertId, jefe, ...prog };
      programas.push(programa);
      for (const [s, lista] of prog.materias.entries()) {
        for (const [m, nombre] of lista.entries()) {
          const docente = docentes[(idx * 6 + s * 2 + m) % docentes.length];
          const codigo = `${prog.codigo}-${s + 1}${String(m + 1).padStart(2, '0')}`;
          const [r] = await conn.query(
            'INSERT INTO materias (nombre, codigo, grupo, carrera_id, docente_id, semestre, creditos) VALUES (?,?,?,?,?,?,?)',
            [nombre, codigo, 'A', programa.id, docente.id, s + 1, entero(3, 5)]
          );
          materias.push({ id: r.insertId, nombre, codigo, programa, semestre: s + 1, docente });
        }
      }
    }

    // Estudiantes e inscripciones. "riesgo" define qué tan seguido falta cada uno.
    const estudiantes = [];
    for (let i = 0; i < TOTAL_ESTUDIANTES; i += 1) {
      const programa = programas[i % programas.length];
      const semestre = (Math.floor(i / programas.length) % 3) + 1;
      const u = await crearUsuario('estudiante', i === 0 ? { email: `estudiante@${dominio}` } : {});
      const codigo = `${programa.codigo}${periodo.slice(2)}${String(i + 1).padStart(4, '0')}`;
      const [r] = await conn.query(
        'INSERT INTO estudiantes (usuario_id, carrera_id, semestre, codigo_estudiante, fecha_ingreso) VALUES (?,?,?,?,?)',
        [u.id, programa.id, semestre, codigo, iso(haceDias(entero(120, 700)))]
      );
      const tirada = rnd();
      const riesgo = tirada < 0.1 ? 0.45 : tirada < 0.3 ? 0.2 : 0.06;
      estudiantes.push({ id: r.insertId, usuario: u, programa, semestre, riesgo });
    }
    const inscritos = new Map(materias.map((m) => [m.id, estudiantes.filter((e) => e.programa.id === m.programa.id && e.semestre === m.semestre)]));
    await insertar(conn, 'inscripciones', ['estudiante_id', 'materia_id', 'fecha_inscripcion'],
      materias.flatMap((m) => inscritos.get(m.id).map((e) => [e.id, m.id, iso(haceDias(90))])));

    // Horarios: dos bloques semanales por materia
    const horarios = [];
    for (const [i, m] of materias.entries()) {
      for (const k of [0, 1]) {
        const dia = DIAS[(i + k * 2) % DIAS.length];
        const [ini, fin] = BLOQUES[(i + k) % BLOQUES.length];
        horarios.push([m.id, m.docente.id, dia, ini, fin, `Aula ${100 + ((i * 3 + k) % 12)}`, periodo, m.programa.jefe.id]);
        m.dias = [...(m.dias || []), dia];
      }
    }
    await insertar(conn, 'horarios', ['materia_id', 'docente_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'aula', 'periodo', 'created_by'], horarios);

    // Asistencias de las últimas 8 semanas
    const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const asistencias = [];
    for (let d = 56; d >= 1; d -= 1) {
      const fecha = haceDias(d);
      const dia = nombreDia[fecha.getDay()];
      for (const m of materias) {
        if (!m.dias.includes(dia)) continue;
        for (const e of inscritos.get(m.id)) {
          const t = rnd();
          let estadoAsist = 'presente';
          let justificacion = null;
          if (t < e.riesgo) estadoAsist = 'falta';
          else if (t < e.riesgo + 0.03) { estadoAsist = 'permiso'; justificacion = 'Permiso presentado por escrito'; }
          else if (t < e.riesgo + 0.07) estadoAsist = 'tarde';
          asistencias.push([e.id, m.id, iso(fecha), estadoAsist, justificacion]);
        }
      }
    }
    await insertar(conn, 'asistencias', ['estudiante_id', 'materia_id', 'fecha', 'estado', 'justificacion'], asistencias, 1000);

    // Planes, avances, tareas y actas
    for (const m of materias) {
      const estadoPlan = elegir(['aprobado', 'aprobado', 'enviado', 'enviado', 'revision', 'rechazado']);
      await conn.query(
        'INSERT INTO pgo (materia_id, docente_id, titulo, descripcion, periodo, estado, observaciones, fecha_revision) VALUES (?,?,?,?,?,?,?,?)',
        [m.id, m.docente.id, `Plan de ${m.nombre}`, `Planificación de contenidos y evaluaciones de ${m.nombre}.`, periodo, estadoPlan,
          estadoPlan === 'rechazado' ? 'Falta detallar el sistema de evaluación.' : null,
          ['aprobado', 'rechazado'].includes(estadoPlan) ? haceDias(entero(20, 50)) : null]
      );
      const cantidad = entero(2, 7);
      for (let k = 0; k < cantidad; k += 1) {
        const validado = prob(0.6) ? 1 : 0;
        await conn.query(
          'INSERT INTO avance_materia (materia_id, docente_id, tema, descripcion, porcentaje_avance, fecha, validado, validado_por, fecha_validacion) VALUES (?,?,?,?,?,?,?,?,?)',
          [m.id, m.docente.id, TEMAS[k % TEMAS.length], 'Tema desarrollado según el plan.', Math.min(100, Math.round(((k + 1) / 8) * 100)),
            iso(haceDias(56 - k * 7)), validado, validado ? m.programa.jefe.id : null, validado ? haceDias(50 - k * 7) : null]
        );
      }
      if (prob(0.7)) {
        await conn.query('INSERT INTO tareas (materia_id, docente_id, titulo, descripcion, fecha_entrega) VALUES (?,?,?,?,?)',
          [m.id, m.docente.id, `Práctica de ${m.nombre}`, 'Resolver los ejercicios y entregar en formato PDF.', iso(haceDias(-entero(3, 14)))]);
      }
      if (prob(0.5)) {
        const [acta] = await conn.query('INSERT INTO grade_reports (materia_id, periodo, observaciones, cargado_por) VALUES (?,?,?,?)',
          [m.id, periodo, 'Acta generada con datos de demostración.', m.programa.jefe.id]);
        const filas = inscritos.get(m.id).map((e) => {
          const base = e.riesgo > 0.4 ? 38 : e.riesgo > 0.15 ? 58 : 72;
          const p1 = Math.min(100, Math.max(0, base + entero(-15, 20)));
          const p2 = Math.min(100, Math.max(0, base + entero(-15, 20)));
          const ef = Math.min(100, Math.max(0, base + entero(-18, 22)));
          const final = Math.round((p1 * 0.3 + p2 * 0.3 + ef * 0.4) * 100) / 100;
          return [acta.insertId, e.id, 'regular', p1, p2, ef, final, final >= 51 ? 'aprobado' : 'reprobado'];
        });
        await insertar(conn, 'grade_report_details', ['acta_id', 'estudiante_id', 'modalidad', 'primer_parcial', 'segundo_parcial', 'examen_final', 'nota_final', 'estado'], filas);
      }
    }

    // Comentarios, disciplina, permisos y capacitaciones
    for (const e of estudiantes) {
      const suyas = materias.filter((m) => m.programa.id === e.programa.id && m.semestre === e.semestre);
      if (prob(0.35)) {
        const m = elegir(suyas);
        const tipo = e.riesgo > 0.4 ? 'alerta' : elegir(['positivo', 'felicitacion', 'observacion']);
        await conn.query('INSERT INTO comentarios_estudiantes (estudiante_id, docente_id, materia_id, tipo, comentario) VALUES (?,?,?,?,?)',
          [e.id, m.docente.id, m.id, tipo, elegir(COMENTARIOS[tipo])]);
      }
      if (e.riesgo > 0.4 && prob(0.5)) {
        const m = elegir(suyas);
        await conn.query('INSERT INTO disciplina_estudiantes (tipo, estudiante_id, materia_id, fecha, descripcion, registrado_por) VALUES (?,?,?,?,?,?)',
          ['falta', e.id, m.id, iso(haceDias(entero(3, 40))), 'Inasistencias reiteradas sin justificación.', e.programa.jefe.id]);
      }
      if (prob(0.08)) {
        const m = elegir(suyas);
        const desde = entero(2, 30);
        await conn.query(
          'INSERT INTO student_permission_requests (estudiante_id, materia_id, tipo, fecha_desde, fecha_hasta, detalle, registrado_por, estado) VALUES (?,?,?,?,?,?,?,?)',
          [e.id, m.id, elegir(['carta_permiso', 'justificacion']), iso(haceDias(desde)), iso(haceDias(desde - 1)), 'Motivo personal (dato de demostración).', e.usuario.id, elegir(['pendiente', 'aprobado', 'rechazado'])]
        );
      }
      if (prob(0.12)) {
        await conn.query('INSERT INTO cursos_capacitacion (estudiante_id, nombre_curso, institucion, fecha_inicio, fecha_fin, horas, estado) VALUES (?,?,?,?,?,?,?)',
          [e.id, elegir(['Excel intermedio', 'Primeros auxilios', 'Oratoria', 'Inglés conversacional', 'Robótica básica']), 'Centro de Capacitación Demo', iso(haceDias(120)), iso(haceDias(90)), elegir([20, 40, 60]), elegir(['pendiente', 'aprobado'])]);
      }
    }
    for (const d of docentes.slice(0, 3)) {
      const m = materias.find((x) => x.docente.id === d.id);
      if (m) {
        await conn.query('INSERT INTO disciplina_docentes (tipo, docente_id, materia_id, fecha, descripcion, registrado_por) VALUES (?,?,?,?,?,?)',
          [elegir(['falta', 'permiso']), d.id, m.id, iso(haceDias(entero(3, 40))), 'Registro de demostración.', m.programa.jefe.id]);
      }
    }
    for (const p of programas) {
      await insertar(conn, 'notifications', ['carrera_id', 'tipo', 'titulo', 'mensaje', 'creado_por'], [
        [p.id, 'informativa', 'Entrega de planes', 'Recuerden enviar sus planes hasta el viernes.', p.jefe.id],
        [p.id, 'institucional', 'Reunión general', 'Reunión de coordinación el lunes a las 18:00.', p.jefe.id]
      ]);
    }

    const [[conteo]] = await conn.query('SELECT COUNT(*) AS total FROM asistencias');
    console.log('\nListo. Datos generados:');
    console.log(`  Institución : ${cat.institucion.nombre} (${TIPO})`);
    console.log(`  Programas   : ${programas.length} · Materias: ${materias.length} · Docentes: ${docentes.length}`);
    console.log(`  Estudiantes : ${estudiantes.length} · Asistencias: ${conteo.total}`);
    console.log(`\nAccesos de demostración (contraseña: ${PASSWORD_DEMO})`);
    for (const rol of ['admin', 'jefe', 'docente', 'estudiante', 'auditor']) console.log(`  ${rol.padEnd(11)} ${rol}@${dominio}`);
    void admin;
  } finally {
    conn.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error('No se pudo generar la demo:', err.message);
  process.exit(1);
});
