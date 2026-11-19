# Contrato de API · Corregir cambio de contraseña del estudiante

Es la única fuente de verdad entre el backend (Claude) y la UI (Codex). Solo el director lo cambia.

```endpoints
PUT    /api/estudiante/cambiar-contrasena    rol: estudiante   → 200 { message }
GET    /api/auth/profile                     rol: cualquiera   → 200 { nombre, apellido, ci, telefono, ... }
PUT    /api/estudiante/info-personal         rol: estudiante   → 200
```

## Detalle por endpoint

### PUT /api/estudiante/cambiar-contrasena  (ya existe, sin cambios)
- **Rol:** estudiante
- **Cuerpo:** `{ "actual": string, "nueva": string, "confirmar": string }`
- **Respuesta 200:** `{ "message": "..." }`
- **Errores (cuerpo `{ error }`):**
  - 400 `Complete todos los campos de contraseña`
  - 400 `La nueva contraseña debe tener al menos 6 caracteres`
  - 400 `La confirmación no coincide con la nueva contraseña`
  - 400 `La contraseña actual es incorrecta`
  - 401 sin sesión · 404 usuario no encontrado

## Endpoints existentes que la UI puede reutilizar
Los tres de arriba, y los que ya usa `Inicio.jsx` para el panel: `GET /api/estudiante/asistencias/resumen`,
`GET /api/estudiante/cursos`, `GET /api/estudiante/materias`, `GET /api/estudiante/ranking-grupo`.

**No existen** y no deben usarse: `/api/estudiante/cursos-especiales` ni `/api/estudiante/cursos-especiales/:id/inscribir`.
