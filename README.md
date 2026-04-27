# Chakuy Software - Sistema de Seguimiento Universitario

Desarrollado por Carlos Azcarraga Esquivel.

Sistema fullstack de seguimiento académico con tres perfiles (estudiante, docente, jefe de carrera).

**Stack:** React 18 + Vite · Node.js + Express · MySQL 8 · JWT · Recharts

---

## 📁 Estructura

```
uni-tracking/
├── backend/          # API REST Node + Express + MySQL
│   ├── src/
│   │   ├── config/        db.js
│   │   ├── controllers/   authController, estudianteController, docenteController, jefeController
│   │   ├── middleware/    auth.js (JWT), upload.js (multer)
│   │   ├── routes/        auth, estudiante, docente, jefe
│   │   ├── utils/         seed.js (regenera hashes bcrypt)
│   │   └── index.js       servidor Express
│   ├── uploads/           archivos subidos (certificados, PGO)
│   ├── database.sql       esquema + datos de prueba
│   ├── .env.example
│   └── package.json
│
└── frontend/         # SPA React + Vite
    ├── src/
    │   ├── components/    Layout, PageHeader, Modal, StatCard
    │   ├── context/       AuthContext
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── estudiante/   Inicio, Cursos, InfoPersonal, Asistencias
    │   │   ├── docente/      Inicio, PGO, Avance, Comentarios
    │   │   └── jefe/         Dashboard, PGO, Avances, Comportamiento, Estudiantes
    │   ├── services/      api.js (axios + JWT)
    │   ├── styles/        global.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Instalación rápida

### 1. Base de datos

```bash
mysql -u root -p < backend/database.sql
```

Esto crea la BD `uni_tracking` con tablas y datos demo.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edita .env con tus credenciales MySQL
npm install
npm run dev
```

Corre en `http://localhost:4000`.

> El `database.sql` ya incluye hashes bcrypt válidos para `password123`. Si quieres cambiar las contraseñas, edita `src/utils/seed.js` y ejecuta `node src/utils/seed.js`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`.

---

## 🔑 Cuentas demo

Todas con contraseña: `password123`

| Rol | Email |
|-----|-------|
| Jefe de carrera | `jefe@uni.edu` |
| Docente | `docente@uni.edu` |
| Estudiante | `estudiante@uni.edu` |

Hay más estudiantes (`estudiante2@uni.edu`, `estudiante3@uni.edu`) y un docente adicional (`docente2@uni.edu`).

---

## ✅ Funcionalidades

### Estudiante
1. **Capacitación** — subir cursos externos con certificado (PDF/imagen), estado (pendiente/aprobado), duración
2. **Datos personales** — CI, teléfono, nombre con ficha visual tipo credencial
3. **Asistencias** — registrar asistencias/faltas/permisos/tardanzas por materia, resumen con barra de progreso por materia, historial completo

### Docente
1. **PGO** — subir Plan Global Operativo con archivo adjunto por materia
2. **Avance de materia** — registrar tema + % avance con timeline vertical, ver validación del jefe
3. **Comentarios** — felicitación/observación/alerta sobre estudiantes inscritos

### Jefe de carrera
1. **Dashboard** — totales globales, gráficas de avance por materia, distribución de asistencias, estudiantes por semestre, estado de PGO
2. **Revisar PGO** — aprobar / solicitar cambios / rechazar con observaciones
3. **Validar avances** — marcar avances como validados, con contador de pendientes
4. **Comportamientos** — ranking top-10 de faltas, tipología de comentarios, feed de alertas recientes
5. **Estudiantes** — directorio buscable con filtro por semestre, ficha completa (asistencias + cursos + comentarios)

---

## 🎨 Diseño

Dirección estética: **editorial académico contemporáneo**.

- Paleta: papel crema `#f4efe6` + tinta profunda `#1a1612` + dorado `#b8904a` + granate `#8b2a2a` + verde `#3a5a3f`
- Tipografías: **Fraunces** (display serif), **DM Sans** (UI), **JetBrains Mono** (numeración y códigos)
- Elementos distintivos: numeración de secciones, filetes tipográficos dobles, sellos rojos en fichas, timelines verticales, chips con borde

---

## 🔌 Endpoints principales

```
POST /api/auth/login              → { email, password }
GET  /api/auth/profile
PUT  /api/auth/profile

# Estudiante
GET  /api/estudiante/cursos
POST /api/estudiante/cursos       (multipart: certificado)
DELETE /api/estudiante/cursos/:id
PUT  /api/estudiante/info-personal
GET  /api/estudiante/materias
GET  /api/estudiante/asistencias
POST /api/estudiante/asistencias
GET  /api/estudiante/asistencias/resumen

# Docente
GET  /api/docente/materias
GET  /api/docente/materias/:id/estudiantes
GET  /api/docente/pgo
POST /api/docente/pgo             (multipart: archivo)
GET  /api/docente/avance
POST /api/docente/avance
GET  /api/docente/comentarios
POST /api/docente/comentarios

# Jefe
GET  /api/jefe/pgo
PUT  /api/jefe/pgo/:id
GET  /api/jefe/avances
PUT  /api/jefe/avances/:id
GET  /api/jefe/comportamiento
GET  /api/jefe/dashboard
GET  /api/jefe/estudiantes
GET  /api/jefe/estudiantes/:id
```

---

## 🛡️ Seguridad

- JWT en `Authorization: Bearer <token>` con expiración de 7 días
- Middleware `verifyToken` y `requireRole` por ruta
- Bcrypt con cost 10 para contraseñas
- CORS habilitado para desarrollo
- Multer limita archivos a 10 MB
