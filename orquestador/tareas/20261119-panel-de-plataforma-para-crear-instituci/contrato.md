# Contrato de API · Panel de plataforma

Las rutas de la plataforma solo responden en el host `plataforma.<dominio>`. Todas, salvo el login, requieren
`Authorization: Bearer <token de plataforma>`. Los errores vienen como `{ error }`.

```endpoints
GET    /api/contexto                                     público          → 200 { tipo, subdominio, estado, nombre } · 404 { tipo:'desconocida' }
POST   /api/plataforma/auth/login                        público          → 200 { token, superadmin:{id,nombre,email} } · 401 · 429
GET    /api/plataforma/auth/perfil                       superadmin       → 200 { id, nombre, email }
GET    /api/plataforma/config                            superadmin       → 200 { baseDominio, ejemploUrl, modo, subdominioPlataforma }
GET    /api/plataforma/subdominio-disponible             superadmin       → 200 { subdominio, disponible, motivo, url }
GET    /api/plataforma/instituciones                     superadmin       → 200 [Institucion]
POST   /api/plataforma/instituciones                     superadmin       → 201 { institucion, admin:{email,passwordTemporal} } · 400 { error, errores } · 502 { error, paso, institucion }
GET    /api/plataforma/instituciones/:id                 superadmin       → 200 Institucion & { eventos:[{accion,detalle,created_at}] }
PATCH  /api/plataforma/instituciones/:id                 superadmin       → 200 Institucion · 400 · 409
POST   /api/plataforma/instituciones/:id/reintentar      superadmin       → 200 { institucion, admin } · 409 · 502 { error, paso, institucion }
POST   /api/plataforma/instituciones/:id/restablecer-admin superadmin     → 200 { admin:{email,passwordTemporal} } · 400
```

## Tipos

```ts
Institucion = {
  id: number, subdominio: string, url: string,          // url lista para abrir: https://<sub>.<dominio>
  nombre: string, sigla: string|null,
  tipo: 'colegio'|'instituto'|'universidad',
  estado: 'creando'|'activa'|'suspendida'|'error',
  paso: 'base'|'usuario'|'esquema'|'datos'|'subdominio'|'listo'|null,
  error: string|null,
  admin: { nombre, apellido, email },
  created_at: string, updated_at: string
}
```

## Detalle

### POST /api/plataforma/auth/login
Cuerpo `{ email, password }`. 401 `Correo o contraseña incorrectos`. 429 después de 10 intentos fallidos en 15 min.

### GET /api/plataforma/subdominio-disponible?valor=<texto>
`motivo` cuando no está disponible, por ejemplo: «Use de 3 a 30 caracteres…», «Ese subdominio está reservado», «Ese subdominio ya está en uso».

### POST /api/plataforma/instituciones
Cuerpo:
```json
{ "nombre": "Colegio San José", "sigla": "CSJ", "tipo": "colegio", "subdominio": "colegio-san-jose",
  "admin": { "nombre": "Ana", "apellido": "Pérez", "email": "ana@csj.edu.bo" } }
```
- 400: `{ error: 'Revise los datos del formulario', errores: { subdominio?, nombre?, tipo?, 'admin.nombre'?, 'admin.apellido'?, 'admin.email'? } }`
- 502: falló un paso. La institución queda con `estado: 'error'` y se puede reintentar.

### PATCH /api/plataforma/instituciones/:id
Cuerpo `{ estado: 'activa' | 'suspendida' }` o `{ nombre }`. 409 si la institución todavía no terminó de crearse.

## Endpoints existentes que la UI puede reutilizar
Los de la app de institución, sin cambios. `GET /api/auth/institucion` **no** existe en el host de la plataforma.
