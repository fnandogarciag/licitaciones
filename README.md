## Quick start

Primero: decide si vas a usar Docker (recomendado) o ejecutar localmente.

Docker (recomendado)

PowerShell:

```powershell
docker compose up -d --build
```

Comandos útiles (PowerShell):

```powershell
# ver logs
docker compose logs -f frontend
docker compose logs -f backend

# detener y eliminar contenedores y redes
docker compose down

# detener y eliminar contenedores + volúmenes
docker compose down -v
```

Local (sin Docker)

Requisitos: Node.js LTS (recomendado 18 o 20) y npm.

Desde la raíz del repo (es un monorepo con workspaces):

```powershell
npm install
# ejecutar modo desarrollo (arranca frontend y backend en modo dev)
npm run dev
```

Build para producción (desde la raíz):

```powershell
npm run build
```

Notas sobre variables de entorno

Hay un archivo `./.env.example` en la raíz. Copia y edítalo para crear `.env` antes de ejecutar si no usas Docker:

```powershell
copy .env.example .env
notepad .env
```

Variables importantes (resumen):

- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT
- BACKEND_PORT, FRONTEND_PORT
- DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
- NEXT_PUBLIC_USE_DOCKER (true/false)
- ADMIN_USER, ADMIN_PASSWORD
- NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (opcional — ver nota abajo)

Nota sobre `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`:
Algunas configuraciones de Next.js (manifiesto de Server Actions cifrado) pueden requerir una clave en producción. No suele ser necesaria para desarrollo local, pero si despliegas en production/hosting que exige esta clave, añade una base64 de 32 bytes en la variable.

Seed de datos (backend)

```powershell
npm run seed --workspace=backend
```

## Detalles de compilación del backend

El backend se compone de dos pasos principales durante el build:

1. Compilar TypeScript -> emite JS en `outDir` (por defecto `./dist`).
   - Esto lo hace el comando `tsc --project tsconfig.build.json` definido en `backend/package.json`.
   - `backend/tsconfig.build.json` tiene `outDir: ./dist`, y además incluye `src/entities/**` para que las clases de entidad se emitan en `dist/entities`.

2. `next build` -> genera la carpeta `.next` (artefactos de Next) para producción.

Script de build (desde la raíz o desde `backend`):

```powershell
# desde la raíz (workspaces)
npm run build:backend

# o desde la carpeta backend
cd backend
npm install
npm run build
```

Qué busca el runtime

- En tiempo de ejecución, `backend/src/data-source.ts` intenta cargar las clases de entidad desde la carpeta compilada. Busca la variable de entorno `BUILD_OUTDIR` (por ejemplo `dist`) y por defecto usa `dist`.
- En otras palabras, tras compilar deberías tener `backend/dist/entities/*.js`. Si el proceso no encuentra las entidades revisa `BUILD_OUTDIR` y que la carpeta `dist/entities` exista.

Ejecutar el backend en producción (PowerShell)

Si quieres arrancar el backend de forma manual en producción (sin Docker), establece las variables de entorno y arranca:

```powershell
$env:BUILD_OUTDIR='dist'
$env:NODE_ENV='production'
cd backend
npm run start
```

Observaciones sobre Docker

- El `backend/Dockerfile` ya compila el backend dentro de la etapa builder y copia `dist` al contenedor de producción. Además copia `dist` a `lib` como compatibilidad hacia atrás; el runner establece `ENV BUILD_OUTDIR=dist`.
- Por ese motivo, arrancar con `docker compose up -d --build` normalmente evita problemas de entidades faltantes.

Comprobación rápida si falla la carga de entidades

1. Verifica que `backend/dist/entities` exista después de la compilación.
2. Verifica el valor de `BUILD_OUTDIR` en el entorno del proceso (debe apuntar a la carpeta que contiene `entities`).
3. Si usas un despliegue que no ejecuta el `tsc` automáticamente, asegúrate de ejecutar `npm run build` en `backend` antes de arrancar.

## Seed avanzado y migraciones

Cómo ejecutar el seed (poblado de ejemplo)

- Local (sin Docker):

```powershell
# compilar backend para generar dist/entities
npm run build:backend

# ejecutar seed en el workspace backend
npm run seed --workspace=backend
```

- Con Docker (imagen ya incluye los artefactos compilados):

```powershell
# arranca contenedores si no están en ejecución
docker compose up -d --build

# ejecutar seed dentro del contenedor backend
docker compose exec backend npm run seed
```

Notas sobre migraciones y SQL

- Este repo incluye un directorio `migrations/` (opcional) y scripts SQL de ejemplo. Si prefieres usar migraciones gestionadas por TypeORM en lugar del seed, ejecuta el flujo de build para generar `dist` y luego aplica las migraciones con las herramientas que prefieras (o implementa un script `npm run migrate`).

## Verificación de Dockerfiles

Revisión rápida de ambos Dockerfiles (frontend y backend):

- Ambos usan `node:20-alpine` en las etapas `builder` y `runner`. Esto es coherente con el uso de Node 20 en CI/producción.
- El `backend/Dockerfile` compila TypeScript (`npm run build`) dentro de la etapa builder y copia `dist` al runner. Además exporta `ENV BUILD_OUTDIR=dist` en el runner — esto coincide con la lógica de `backend/src/data-source.ts` que busca entidades en `dist/entities`.
- El `frontend/Dockerfile` compila el frontend y copia `.next` y `public` al runner; también permite pasar `NEXT_PUBLIC_BACKEND_URL` como argumento de build.

Puntos a tener en cuenta / checklist (si algo falla):

1. Asegúrate de que la etapa builder completa `npm run build` sin errores. Revisa los logs del build si ves que faltan archivos `dist`.
2. Si el contenedor runner no tiene `dist` o las entidades, comprueba que la línea `COPY --from=builder /app/backend/dist ./dist` en el Dockerfile se ejecutó correctamente y que no hubo errores de permisos.
3. Comprueba que `BUILD_OUTDIR` esté definido en el entorno del proceso (el Dockerfile del runner establece `ENV BUILD_OUTDIR=dist`). Si tu despliegue cambia esa variable, actualiza la ruta en consecuencia.
4. Si ves problemas con dependencias hoisted (paquetes no encontrados a runtime), comprueba que tanto `/app/node_modules` como `/app/backend/node_modules` se copiaran al contenedor runner como hace el Dockerfile del backend.

Si quieres, puedo añadir comandos para probar la integridad de cada contenedor (pequeños `docker compose exec ... ls -la` y `node -e 'require("./dist/data-source.js")'` para validar carga). Dime si quieres que los incluya.

Notas de portabilidad y recomendaciones

- Instala dependencias desde la raíz: `npm install`. El proyecto usa npm workspaces; instalar sólo en `frontend` o `backend` puede dejar dependencias hoisted fuera.
- El repo ya incluye `package-lock.json` en la raíz; mantenlo para reproducibilidad (`npm ci` para installs limpias).
- Recomiendo añadir `.nvmrc` indicando la versión Node LTS que usas (ej. `18`) si tu equipo usa nvm.

Ahora continúa con las validaciones por entidad y documentación adicional a continuación.

## Validaciones por entidad (con ejemplos y reglas recomendadas)

Nota: nombres de campos según migración/entidades.

empresas
Reglas:
nombre: obligatorio, trim(), longitud razonable (p. ej. 1–255).
no crear nombres duplicados (UNIQUE en BD o comprobación en servicio).
DB:
Column nombre varchar NOT NULL o dejar nullable pero validar en servicio.
Servicio:
Antes de crear: comprobar duplicado (por igualdad normalizada).
Frontend:
Campo requerido con mensaje: "El nombre es obligatorio".
Ejemplo class-validator:
@IsString() @IsNotEmpty() @MaxLength(255)
consorcios
Reglas:
nombre: obligatorio, único opcionalmente.
Relaciones:
borrar: impedir borrado si existen ofertas u otras dependencias, o usar cascada/restricción según política.
Validación similar a empresas.
consorcio_empresa (tabla puente)
Reglas:
consorcio_id: debe existir.
empresa_id: debe existir.
Evitar duplicados (única combinación consorcio+empresa) — índice UNIQUE(consorcio_id, empresa_id).
Al crear:
validar existencia de la empresa y consorcio.
retornar 409 si ya existe.
Al borrar:
política: permitir borrado (delete fila puente) con confirmación.
procesos
Reglas:
objeto: obligatorio, trim, longitud máxima.
entidad_id: si provisto, debe existir (FK).
anticipo: número entero ≥ 0 (smallint en la BD) o null; CHECK anticipo >= 0.
mipyme: boolean.
estado_id, tipo_proceso_id: si provistos, deben existir.
codigo_link: optional, validar patrón si es URL o formato específico.
Reglas de negocio:
Si anticipo > 0, quizá exigir pólizas o pasos adicionales (depende negocio).
Concurrency:
Cuando se actualice, comprobar existencia y/o versión.
Frontend:
Validar anticipo >= 0 y formato numérico, validar fecha(s) relacionadas.
lotes
Reglas:
proceso_id: obligatorio o validable (si un lote debe pertenecer a proceso).
valor: decimal ≥ 0.
poliza: decimal ≥ 0 o nullable.
poliza_real: boolean.
DB:
CHECK valor >= 0, poliza >= 0 si quieres forzar en DB.
Al crear/editar:
comprobar que proceso existe.
Negocio:
quizás impedir crear lote si proceso está en estado que lo prohíbe.
ofertas
Reglas:
lote_id y consorcio_id: deben existir.
Evitar duplicados si no se permiten múltiples ofertas del mismo consorcio para el mismo lote — UNIQUE(lote_id, consorcio_id).
Al borrar:
revisar estados (no permitir borrar oferta aceptada, por ejemplo).
fecha_proceso
Reglas:
proceso_id existe.
tipo_fecha_proceso_id existe.
fecha: fecha válida (ISO), storing timestamp en DB.
Validar que fecha esté en formato aceptable: Date.parse(...) no NaN.
Regla de negocio: si es una fecha límite, puede requerirse que sea futura/pasada; validar según el contexto.
Frontend:
input tipo date/ datetime-local + validación.
tipo_proceso, tipo_fecha_proceso, estado_proceso
Reglas:
nombre: obligatorio, trim, max length.
UNIQUE(nombre) si aplica.
entidades
Reglas:
nombre: obligatorio, UNIQUE si aplica.
Validaciones para operaciones (crear / editar / borrar)
Crear (POST)

Verificar campos requeridos y tipos.
Sanitizar input (trim strings).
Comprobar existencia de FKs referenciadas.
Comprobar reglas de negocio (p. ej. anticipo ≥ 0).
Envolver operaciones que modifiquen varias tablas en transacción (si aplica).
Responder 201 Created con recurso o 400/409 con mensaje.
Editar (PATCH)

Verificar que el recurso exista (404).
Validaciones parciales: aplicar las reglas solo a campos presentes.
Comprobar integridad de FK si se actualizan (existencia).
Optimistic locking si hay concurrencia crítica.
Responder 200 o 204; 400/409 si inválido.
Borrar (DELETE)

Política: soft delete vs hard delete.
Soft delete: añadir columna deleted_at o is_deleted (recomendado si quieres recuperabilidad/auditoría).
Hard delete: eliminar fila.
Antes de borrar:
Comprobar dependencias referenciales: si otras tablas referencian este registro, decidir:
Rechazar borrado y devolver 409 (o 400) con explicación; o
Hacer cascada si es seguro.
Confirmación del usuario (UI) — ya tienes ConfirmModal.
Registrar auditoría del borrado y usuario.
Ejemplo: no permitir eliminar una Empresa si existen consorcio_empresa asociados a menos que se borren explícitamente o se permita cascade.

## UI components: Button

This project includes a shared Button component located at `frontend/app/ui/Button.tsx`.

Key features:

- Variants: `primary`, `secondary`, `ghost` for consistent styling across the app.
- `href` support: pass `href="/path"` and the component will render a `next/link` anchor.
- `icon` and `iconPosition` props to show an icon on the left or right.
- `loading` prop shows a small spinner and disables the button.

Quick examples:

`<Button variant="primary">Guardar</Button>` — primary action

`<Button variant="secondary">Cancelar</Button>` — secondary action

`<Button href="/" variant="ghost">Ir al inicio</Button>` — link styled as button

`<Button variant="primary" icon={<svg>...</svg>} iconPosition="right">Enviar</Button>`

Use this component to standardize buttons across the UI. See `/button-demo` for a simple visual demo.
