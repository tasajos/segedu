# Contrato de API · Rediseño azul Chakuy y alertas en modales

Esta tarea **no agrega ni cambia endpoints**. La UI solo puede seguir usando los endpoints que ya usa hoy
(están en la lista de rutas existentes del prompt). No se crean llamadas nuevas.

```endpoints
GET    /api/auth/institucion     rol: público   → datos de marca de la institución (sin cambios)
```

## Endpoints existentes que la UI puede reutilizar
Todos los que ya usa cada página, sin cambiar método, ruta, cuerpo ni manejo de la respuesta.
