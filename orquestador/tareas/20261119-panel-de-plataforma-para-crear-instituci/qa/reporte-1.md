VEREDICTO: APROBADO

## Resumen
QA de Claude contra una instancia de prueba (backend :5055 con MULTI_INSTITUCION=1, Vite :5174), usando
subdominios reales `*.localhost` a través del proxy de Vite. Backend: 33/33 verificaciones automáticas, más subida
de archivos y reintento tras una falla. La interfaz compila y respeta el contrato; no se probó visualmente en un navegador.

## Criterios de aceptación
| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `plataforma.localhost` → app de plataforma y login | OK (API) | `/contexto` → `plataforma`; la SPA responde 200; login vía Vite devuelve token |
| 2 | Crear institución y mostrar credenciales | OK (API) | 201 con `url`, `admin.email`, `passwordTemporal`; `Credenciales.jsx` con botones Copiar |
| 3 | Subdominio validado en vivo y errores por campo | OK | `subdominio-disponible` con 400 ms de espera; los 6 casos de validación dan el motivo correcto; `errores` por campo |
| 4 | Suspender con confirmación de peligro, reactivar, restablecer | OK | `useAccionesInstitucion` con `dialog.confirm` de tipo peligro; la API responde 403 a la institución suspendida |
| 5 | Error con paso visible y reintento | OK | falla forzada en el paso «base» → `estado:error`; el reintento completa y entrega contraseña |
| 6 | Subdominio de institución / inexistente / dominio principal | OK | `colegio-san-jose` y `uni-andina` → institución; `no-existe` → desconocida; `localhost` → instalación por defecto |
| 7 | Build y contrato | OK | build en 9,9 s; 204 llamadas, 0 violaciones |

## Aislamiento (crítico)
- El token de una institución da 401 en otra y en el dominio principal.
- Una carrera creada en Andina no aparece en San José.
- El logo subido en Andina queda en `uploads/instituciones/uni-andina/`, se sirve solo en ese host (404 en los demás) y el cambio llega solo a la base de Andina.
- El token del superadmin no abre rutas de institución, y la plataforma no se expone en los subdominios.
- El listado de la plataforma no devuelve credenciales de base de datos.

## Hallazgos
### H1 · medio · backend · El modo cPanel no está probado
La provisión real con la UAPI de cPanel (crear base, usuario y subdominio) no se pudo probar sin token. El código
maneja los recursos que ya existen y permite reintentar, pero hay que validarlo en el hosting con una institución de prueba.

### H2 · bajo · ui · Codex no terminó su ronda
Se quedó sin cuota de ChatGPT. Claude escribió `Instituciones.jsx` y `Plataforma.css`.

## No probado
- Aspecto visual, vista de celular y consola del navegador.
- Provisión con cPanel (ver H1).
