# Contrato de API · {{TITULO}}

Es la única fuente de verdad entre el backend (Claude) y la UI (Codex).
Solo el director lo cambia. Rutas completas, con el prefijo `{{API_BASE}}`.
El verificador lee las líneas del bloque `endpoints`: método, ruta y, si quieres, una nota.

```endpoints
GET    {{API_BASE}}/ejemplo/:id        rol: jefe   → 200 { id, nombre }
```

## Detalle por endpoint

### GET {{API_BASE}}/ejemplo/:id
- **Rol:** 
- **Parámetros:** 
- **Respuesta 200:**
  ```json
  {}
  ```
- **Errores:** 400 `{ message }` · 401 sin sesión · 403 rol incorrecto · 404 no existe

## Endpoints existentes que la UI puede reutilizar
<!-- Lista los que ya existen y sirven. La UI no puede usar ninguno que no esté aquí o en el bloque de arriba. -->
