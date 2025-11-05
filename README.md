# Sistema de Gestión de Licitaciones

Sistema web para gestionar procesos de licitación

## Tecnologías y Estructura

### Stack Principal

- Frontend y Backend: Next.js 16 (App Router)
- ORM: TypeORM
- Base de datos: PostgreSQL
- Contenedores: Docker y Docker Compose

### Estructura del Proyecto

```
src/
├── app/                    # Rutas y componentes Next.js
│   ├── api/               # API endpoints
│   ├── ui/                # Componentes reutilizables
│   └── utils/             # Utilidades frontend
├── modules/               # Módulos backend
│   ├── procesos/         # Gestión de procesos
│   ├── empresas/         # Gestión de empresas
│   └── ...               # Otros módulos
├── migrations/           # Migraciones SQL
├── config/              # Configuración backend
└── scripts/             # Scripts de utilidad

Archivos Principales:
- docker-compose.yml    # Configuración de contenedores
- next.config.ts       # Configuración de Next.js
- tsconfig.json        # Configuración de TypeScript
- package.json         # Dependencias y scripts
```

## Librerías y Dependencias

Las dependencias principales del proyecto (definidas en `package.json`) son:

Dependencias (producción):

- `next` 16.0.1 — framework React/SSR (App Router)
- `react` 19.2.0 — biblioteca UI
- `react-dom` 19.2.0 — renderizado React
- `typeorm` ^0.3.27 — ORM (PostgreSQL)
- `pg` ^8.16.3 — driver PostgreSQL
- `reflect-metadata` ^0.2.2 — metadatos para decoradores (TypeORM)
- `class-validator` ^0.14.2 — validación de DTOs/entities
- `js-cookie` ^3.0.5 — manejo de cookies en frontend

Dependencias de desarrollo:

- `typescript` ^5 — soporte TS
- `eslint` ^9 — linter
- `eslint-config-next` 16.0.1 — reglas para Next.js
- `tailwindcss` ^4 y `@tailwindcss/postcss` ^4 — utilidades CSS
- `@types/node`, `@types/react`, `@types/react-dom` — tipos para TS

Nota: para ver las versiones exactas revisa `package.json` en la raíz. Mantén `package-lock.json` actualizado para reproducibilidad.

## Requisitos Previos

- Node.js LTS (18 o 20)
- npm
- PostgreSQL (si no usas Docker)
- Docker y Docker Compose (recomendado)

## Configuración Inicial

1. Clonar el repositorio
2. Configurar variables de entorno:

```powershell
# Copiar archivo de ejemplo
copy .env.example .env

# Editar las variables según tu entorno
notepad .env
```

3. Verificar la configuración:

```powershell
npm run check-env
```

## Inicio Rápido

### 1. Usando Docker (Recomendado)

```powershell
# Iniciar los contenedores
docker compose up -d --build

# Detener y eliminar contenedores
docker compose down

# Detener y eliminar contenedores + volúmenes
docker compose down -v
```

### 2. Ejecución Local

Asegúrate de tener PostgreSQL instalado y configurado localmente.

```powershell
# Instalar dependencias
npm install

# Modificar DB_HOST en .env
# Cambiar DB_HOST=postgres_db a DB_HOST=localhost
# Usa las variables con valores directos (sin ${})
# Asegúrate que PostgreSQL esté instalado y corriendo
# Los valores DB_USER, DB_PASS y DB_NAME deben coincidir con los de POSTGRES_*

# Desarrollo
npm run dev

# O para producción
npm run build
npm start
```

## Scripts Disponibles

### Desarrollo

- `npm run dev`: Inicia el proyecto en modo desarrollo
- `npm run lint`: Ejecuta el linter
- `npm run lint:fix`: Corrige problemas de linting automáticamente

### Producción

- `npm run build`: Compila el proyecto para producción
- `npm start`: Inicia el proyecto en modo producción

### Utilidades

- `npm run check-env`: Verifica las variables de entorno requeridas
- `npm run check-db`: Verifica la conexión a la base de datos
- `npm run seed`: Ejecuta el script de poblado inicial de datos

## Variables de Entorno Requeridas

```bash
# PostgreSQL
POSTGRES_USER=usuario_postgres
POSTGRES_PASSWORD=contraseña_postgres
POSTGRES_DB=nombre_base_datos
POSTGRES_PORT=5432

# Aplicación
FRONTEND_PORT=3000

# Conexión Base de Datos
DB_HOST=postgres_db  # (o localhost sin Docker)
DB_PORT=5432
DB_USER=${POSTGRES_USER}
DB_PASS=${POSTGRES_PASSWORD}
DB_NAME=${POSTGRES_DB}

# Credenciales Admin
ADMIN_USER=usuario_admin
ADMIN_PASSWORD=contraseña_admin
```

## Poblado Inicial de Datos (Seed)

Para ejecutar el script de poblado inicial:

### Usando Docker:

```bash
# Desde el host
docker compose exec nextjs_app npm run seed

# O dentro del contenedor
docker compose exec nextjs_app bash
npm run seed
```

### Desarrollo Local:

```bash
npm run seed
```

El script creará:

- Usuarios administradores iniciales
- Estados de proceso predeterminados
- Tipos de proceso
- Datos de ejemplo para pruebas

Notas sobre migraciones y SQL

- Este repo incluye un directorio `migrations/` (opcional) y scripts SQL de ejemplo. Si prefieres usar migraciones gestionadas por TypeORM en lugar del seed, ejecuta el flujo de build para generar `dist` y luego aplica las migraciones con las herramientas que prefieras (o implementa un script `npm run migrate`).

Notas de portabilidad y recomendaciones

- Instala dependencias desde la raíz: `npm install`.
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

## ## Componentes UI

### Button (`src/app/ui/Button.tsx`)

- Variantes: `primary`, `secondary`, `ghost`
- Soporte para `href`, `icon`, `loading`
- Demo en `/button-demo`

### DatePicker (`src/app/ui/DatePicker.tsx`)

- Selector de fechas personalizado
- Formato local es-CO
- Validación de fechas

### Modales

- `ConfirmModal`: Para acciones que requieren confirmación
- `ProcessCreateModal`: Para creación de procesos

## Guía para Desarrolladores

### Buenas Prácticas

- Instalar dependencias desde la raíz: `npm install`
- Usar `npm ci` para instalaciones limpias y reproducibles
- Seguir las convenciones de TypeScript
- Mantener el archivo package-lock.json actualizado

### Convenciones

- Las validaciones de números usan:
  - Coma (,) como separador decimal
  - Punto (.) como separador de miles
- Códigos SECOP válidos:
  - Formato: CO1.NTC.número o NTC.número
  - Ejemplo: CO1.NTC.123456 o NTC.789012

### Base de Datos

- Migraciones disponibles en `src/migrations/`
- Usar transacciones para operaciones múltiples
- Seguir convenciones de nomenclatura SQL

### Solución de Problemas

1. Error de conexión a la base de datos:

   - Verificar variables de entorno con `npm run check-env`
   - Comprobar conexión con `npm run check-db`
   - Revisar logs de Docker si es necesario

2. Errores de TypeScript:

   - Ejecutar `npm run lint` para identificar problemas
   - Usar `npm run lint:fix` para correcciones automáticas

3. Problemas de Docker:
   - Recrear contenedores: `docker compose down && docker compose up -d`
   - Limpiar volúmenes si es necesario: `docker compose down -v`

```

```
