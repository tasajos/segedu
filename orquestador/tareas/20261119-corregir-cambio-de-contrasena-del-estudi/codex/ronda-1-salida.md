**Archivos**

- `InfoPersonal.jsx`: ruta corregida, mensaje «Contraseña actualizada correctamente» sin «OK» y errores del backend conservados.
- `Inicio.jsx`: eliminados estados, funciones, sección, modal y estilos exclusivos de cursos especiales. Conservado el resto del panel.
- Ambas páginas incluyen estados de carga y error.

**Endpoints usados**

- Corregido: `PUT /estudiante/cambiar-contrasena`, mediante `api`, con `{ actual, nueva, confirmar }`.
- Sin llamadas nuevas. Verificador de contrato: cero errores y avisos.

**Build**

Correcto con `npm.cmd run build`. Solo advertencia de paquetes mayores de 500 kB.

**Bloqueos**

Ninguno. Pruebas E2E pendientes de QA. Sin commits.