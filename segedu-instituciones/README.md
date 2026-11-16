# SEGEDU Instituciones

Seguimiento académico para **colegios, institutos técnicos y carreras universitarias**.
Es la versión comercial de SEGEDU: mismo núcleo académico, nueva imagen y una
instalación independiente por cada institución.

Desarrollado por Carlos Azcarraga Esquivel · Chakuy Software.

**Stack:** React 18 + Vite · Node.js + Express · MySQL 8 / MariaDB 10.4+ · JWT

## Qué incluye

| Perfil | Qué hace |
|---|---|
| Responsable académico (director, coordinador o jefe de carrera) | Panel general, asistencias y permisos, ficha de estudiantes, alertas de riesgo, actas de notas, revisión de planes, validación de avances, carpetas pedagógicas, horarios, disciplina y avisos |
| Docente | Lista de asistencia, avance de clases, tareas, grupos de trabajo, comentarios, plan de la asignatura, carpeta pedagógica y presentaciones |
| Estudiante | Asistencias y permisos, tareas, grupos, presentaciones y capacitaciones |
| Administrador | Usuarios (con importación desde Excel), programas, asignaturas y **Mi institución** |
| Auditor | Consulta todo en modo de solo lectura |

### Qué cambió respecto al SEGEDU original

- **Mi institución** (nuevo): nombre, sigla, lema, logo, dos colores y tipo de institución.
  El tipo define las palabras del menú (por ejemplo *Nivel / Curso / Profesor / Director*
  en un colegio) y cada palabra se puede cambiar a mano.
- **Nueva imagen**: tema claro "cuaderno de aula", menú agrupado por tareas con íconos,
  versión para celular y colores que se adaptan a cada institución.
- **Sin módulos propios de una carrera**: se quitaron los simuladores, el laboratorio de QA,
  los cursos especiales con instructor, los videotutoriales en Google Drive y las funciones de IA.
- **Datos de demostración aleatorios**: `npm run seed` genera una institución ficticia completa.
- **Seguridad**: se eliminó el registro público de usuarios (`/api/auth/register`), que permitía
  crear cuentas de cualquier rol sin iniciar sesión, y el servidor ya no arranca sin `JWT_SECRET`.

### Límites conocidos

- Los términos configurables se aplican al menú, al inicio de sesión, al panel del responsable
  y a los encabezados principales. Dentro de algunas pantallas todavía se lee "carrera",
  "semestre" o "PGO".
- Cada instalación atiende a **una** institución. Para otro cliente se crea otra base de datos
  y otra instalación.
- La pantalla de presentaciones del responsable académico se retiró del menú porque el
  servicio original solo responde a estudiantes.

## Instalación

### 1. Base de datos

```bash
mysql -u root -p -e "CREATE DATABASE segedu_instituciones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p segedu_instituciones < database/schema.sql
```

`database/schema.sql` solo contiene la estructura (32 tablas), sin datos.

### 2. Backend

```bash
cd backend
cp .env.example .env      # complete la base de datos y JWT_SECRET
npm install
npm run seed              # opcional: datos de demostración
npm run dev               # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Datos de demostración

```bash
npm run seed                                        # instituto, 120 estudiantes
npm run seed -- --tipo=colegio --estudiantes=200
npm run seed -- --tipo=universidad --semilla=42     # la misma semilla repite los mismos datos
```

**El comando borra todo el contenido de la base configurada en `.env`.** Úselo solo en una
base de demostración. Todos los nombres, correos y registros son inventados.

Al terminar muestra los accesos. La contraseña de todos es `demo1234` (se cambia con
`--password=otra`):

| Perfil | Correo (instituto) |
|---|---|
| Administrador | admin@itd.demo |
| Coordinador | jefe@itd.demo |
| Docente | docente@itd.demo |
| Estudiante | estudiante@itd.demo |
| Auditor | auditor@itd.demo |

El dominio cambia con el tipo: `ued.demo` para colegio y `udv.demo` para universidad.

## Publicación en hosting con Node.js (cPanel)

1. `cd frontend && npm run build`
2. Suba `backend/` al servidor y copie `frontend/dist/` dentro de `backend/public/dist/`.
3. En "Setup Node.js App" use `app.js` como archivo de inicio y defina las variables de `.env`.
4. Importe `database/schema.sql` desde phpMyAdmin.
5. Cree el primer administrador (no borra nada):
   `npm run crear-admin -- --email=admin@miinstituto.edu.bo --password=ClaveSegura123`

El mismo servidor Node entrega la API (`/api`) y la aplicación web.
