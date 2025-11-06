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
├── components/           # Componentes reutilizables organizados por tipo
├── lib/                  # Utilidades y código compartido
│   └── utils/           # Utilidades organizadas por funcionalidad
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
- `pg` ^8.16.3 — driver para PostgreSQL que TypeORM utiliza internamente para conectarse a la base de datos.
- `reflect-metadata` ^0.2.2 — metadatos para decoradores (TypeORM)
- `class-validator` ^0.14.2 — validación de DTOs/entities
- `js-cookie` ^3.0.5 — manejo de cookies en frontend

Dependencias de desarrollo:

- `typescript` ^5 — soporte TS
- `eslint` ^9 — linter
- `eslint-config-next` 16.0.1 — reglas para Next.js
- `eslint-config-prettier` ^10.1.8 — integración Prettier
- `tailwindcss` ^4 y `@tailwindcss/postcss` ^4 — utilidades CSS
- `dotenv` ^16.6.1 — carga de variables de entorno para scripts
- `@types/node`, `@types/react`, `@types/react-dom`, `@types/js-cookie` — tipos para TS

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

### Usando Docker

Si estás usando Docker, ejecuta el check dentro del contenedor:

```powershell
# Primero asegúrate que los contenedores estén corriendo
docker compose up -d

# Ejecuta el check dentro del contenedor
docker compose exec nextjs_app npm run check
```

### Sin Docker (Desarrollo Local)

Si estás desarrollando localmente sin Docker:

```powershell
# Asegúrate que PostgreSQL esté corriendo localmente
# y que DB_HOST en .env esté configurado como localhost
npm run check
```

El comando `npm run check` realiza dos validaciones importantes:

- Verifica las variables de entorno requeridas
- Comprueba la conexión a la base de datos

Si hay algún error, te mostrará mensajes específicos sobre qué necesita ser corregido.

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

# Desarrollo (ejecuta checks de env y DB antes de arrancar)
npm run dev

# Producción (build ejecuta checks, compila y crea shim en dist/)
npm run build
npm start
```

## Scripts Disponibles

La lista siguiente refleja los scripts definidos en `package.json` y su propósito.

### Desarrollo

- `npm run dev` — Ejecuta `check` (valida env + DB) y luego arranca Next en modo desarrollo.
- `npm run lint` — Ejecuta ESLint sobre el código fuente (`src/`).
- `npm run lint:fix` — Ejecuta ESLint sobre `src/` y aplica correcciones automáticas cuando es posible.

### Producción / Build

- `npm run build` — compila TypeScript (`tsc --project tsconfig.build.json`), crea el shim `dist/data-source.js` si procede y finalmente ejecuta `next build`.
- `npm start` — Inicia la aplicación construída (espera que ya exista `dist/` y el build de Next).

### Comprobaciones y utilidades

- `npm run check` — Ejecuta las comprobaciones de entorno y la conexión a la base de datos (no crea `dist`).
- `npm run seed` — Ejecuta `node ./src/scripts/seed.js` para poblar datos de ejemplo en la base de datos.

Notas:

- El script `check` está pensado para validar el entorno y la conexión a la base de datos. `build` invoca `check` antes de compilar y luego ejecuta el script `ensure-dist-root-datasource.js` para crear el shim en `dist/` si hace falta.
- `lint`/`lint:fix` están limitados a `src/` para evitar que ESLint analice archivos generados (`dist/`, `.next/`).

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

Ahora continúa con las validaciones por entidad y documentación adicional a continuación.

## Validaciones por entidad

La siguiente sección agrupa reglas y recomendaciones por entidad. Para cada entidad incluyo: resumen, reglas de base de datos (si aplica), validaciones en el servicio/backend, validaciones en frontend y ejemplos prácticos.

### Empresas

- Resumen: entidad que representa una empresa participante en procesos.
- Reglas principales:
  - `nombre`: obligatorio, trim(), longitud razonable (p. ej. 1–255).
  - Evitar duplicados a nivel negocio (UNIQUE en BD o comprobación en servicio).
- DB:
  - `nombre` VARCHAR NOT NULL (o nullable+validación en servicio).
  - Índice UNIQUE opcional para evitar duplicados en BD.
- Servicio:
  - Antes de crear: normalizar y comprobar duplicado (comparación case-insensitive y trim).
  - Retornar 409 Conflict si ya existe.
- Frontend:
  - Campo requerido con mensaje claro: "El nombre es obligatorio".
  - Validar longitud y trim antes de enviar.
- Ejemplo (class-validator):

```ts
@IsString()
@IsNotEmpty()
@MaxLength(255)
name: string;
```

---

### Consorcios

- Reglas principales:
  - `nombre`: obligatorio (y opcionalmente único).
- Relaciones / borrado:
  - Impedir borrado si existen ofertas u otras dependencias, o usar cascada/constraint según la política del negocio.

---

### Consorcio_Empresa (tabla puente)

- Reglas principales:
  - `consorcio_id` y `empresa_id` deben existir.
  - Evitar duplicados: UNIQUE(consorcio_id, empresa_id).
- Servicio:
  - Al crear: validar existencia de la empresa y del consorcio; devolver 409 si ya existe la relación.
  - Al borrar: requerir confirmación de la operación si aplica.

---

### Procesos

- Resumen: entidad central que agrupa las licitaciones y su ciclo.
- Reglas principales:
  - `objeto`: obligatorio, trim, longitud máxima.
  - `entidad_id`: si provisto, debe existir (FK).
  - `anticipo`: entero ≥ 0 o null (CHECK anticipo >= 0).
  - `mipyme`: booleano.
  - `estado_id`, `tipo_proceso_id`: si provistos, deben existir.
  - `codigo_link`: opcional, validar patrón si es URL o formato específico.
- Reglas de negocio:
  - Si `anticipo` > 0, puede exigir pólizas o pasos adicionales según la política.
  - Control de concurrencia al actualizar: comprobar existencia/versión (optimistic locking si aplica).
- Frontend:
  - Validar `anticipo >= 0`, formato numérico y fechas relacionadas.

---

### Lotes

- Reglas principales:
  - `proceso_id`: obligatorio (o validar su existencia si es opcional).
  - `valor`: decimal ≥ 0.
  - `poliza`: decimal ≥ 0 o nullable.
  - `poliza_real`: boolean.
- DB:
  - Añadir CHECKs si quieres forzar `valor >= 0` y `poliza >= 0`.
- Servicio:
  - Al crear/editar: comprobar que el `proceso` existe y que su estado permite la operación.

---

### Ofertas

- Reglas principales:
  - `lote_id` y `consorcio_id` deben existir.
  - Evitar duplicados si la regla de negocio lo requiere (UNIQUE(lote_id, consorcio_id)).
- Borrado / restricciones:
  - No permitir borrar ofertas en ciertos estados (por ejemplo, oferta aceptada).

---

### Fecha_Proceso

- Reglas principales:
  - `proceso_id` y `tipo_fecha_proceso_id` deben existir.
  - `fecha`: fecha válida (ISO), almacenar como timestamp en BD.
  - Validar con `Date.parse(...)` (no NaN) y reglas de negocio (p. ej. si es fecha límite, debe estar en futuro/pasado según contexto).
- Frontend:
  - Usar inputs `date` / `datetime-local` con validación.

---

### Tipos y estados (tipo_proceso, tipo_fecha_proceso, estado_proceso)

- Reglas:
  - `nombre`: obligatorio, trim, longitud limitada.
  - UNIQUE(nombre) cuando aplique para evitar duplicados.

---

### Entidades (general)

- Reglas:
  - `nombre`: obligatorio, UNIQUE si aplica.

---

## Reglas comunes para operaciones CRUD

### Crear (POST)

- Verificar campos requeridos y tipos.
- Sanitizar input (trim strings, normalizar formatos).
- Comprobar existencia de FKs referenciadas.
- Comprobar reglas de negocio (p. ej. `anticipo >= 0`).
- Envolver operaciones que modifiquen varias tablas en una transacción cuando aplique.
- Responder `201 Created` con el recurso o `400/409` con mensaje de error.

### Editar (PATCH / PUT)

- Verificar que el recurso exista (`404` si no).
- Aplicar validaciones parciales solo a los campos presentes.
- Comprobar integridad de FKs si se actualizan.
- Considerar optimistic locking si hay concurrencia crítica.
- Responder `200` o `204`, `400/409` si inválido.

### Borrar (DELETE)

- Decidir política: soft delete (recomendado) vs hard delete.
  - Soft delete: añadir `deleted_at` o `is_deleted` para recuperabilidad/auditoría.
  - Hard delete: eliminar fila definitivamente.
- Antes de borrar:

  - Comprobar dependencias referenciales: si existen referencias, decidir si rechazarlas (409) o aplicar cascada segura.
  - Requerir confirmación en UI para acciones destructivas (ya hay `ConfirmModal`).
  - Registrar auditoría del borrado (quién, cuándo).

- Ejemplo práctico: impedir eliminar una `Empresa` si existen `consorcio_empresa` asociados salvo que se eliminen explícitamente o se permita cascade.

## Componentes UI

Los componentes están organizados en carpetas según su propósito:

### Buttons (`src/components/buttons/`)

- `Button`: Componente base para botones
  - Variantes: `primary`, `secondary`, `ghost`
  - Soporte para `href`, `icon`, `loading`
  - Demo en `/button-demo`
- `LoginButton`: Botón especializado para acciones de login

### Forms (`src/components/forms/`)

- `DatePicker`: Selector de fechas personalizado
  - Formato local es-CO
  - Validación de fechas
  - Soporte para fechas ISO
- `Input`: Campo de texto/número reutilizable
  - Estilos consistentes
  - Validación integrada
- `Select`: Selector de opciones personalizado
- `Toggle`: Switch toggle accesible
  - Soporte para ARIA
  - Animaciones suaves

### Layout (`src/components/layout/`)

- `HeaderLayout`: Componente para la estructura del header
  - Navegación principal
  - Estado de autenticación

### Modals (`src/components/modals/`)

- `ConfirmModal`: Para acciones que requieren confirmación
  - Mensajes personalizables
  - Callbacks para confirm/cancel
- `ProcessCreateModal`: Para creación de procesos
  - Formulario integrado
  - Validaciones específicas

### Tables (`src/components/tables/`)

- `ProcessTable`: Tabla especializada para procesos
  - Filtrado
  - Ordenamiento
  - Acciones por fila

## Utilidades (`src/lib/utils/`)

Las utilidades están organizadas por funcionalidad:

### API (`src/lib/utils/api/`)

- `routes.ts`: Centraliza todas las rutas de la API
  - Evita hardcodear URLs
  - Mantiene consistencia
- `relations.ts`: Utilidades para manejar relaciones
  - Extracción segura de IDs
  - Normalización de relaciones

### Format (`src/lib/utils/format/`)

- `number.ts`: Formateo de números
  - Separadores decimales y de miles
  - Validación de precisión
  - Normalización de inputs
- `tiempo.ts`: Manejo de fechas y tiempos
  - Formatos locales (es-CO)
  - Cálculos de tiempo restante
  - Conversiones ISO

### Validation (`src/lib/utils/validation/`)

- `messages.ts`: Mensajes de validación centralizados
  - Mensajes en español
  - Reutilizables en forms
- `url.ts`: Validación de URLs
  - Extracción de códigos SECOP
  - Validación de dominios

## Convenciones y Estándares

### Estructura de Carpetas

- `components/`: Componentes React organizados por tipo
- `lib/`: Código compartido y utilidades
- `modules/`: Lógica de negocio y entidades
- `app/`: Rutas y páginas de Next.js

### Imports y Aliases

- Usar los alias definidos en tsconfig:
  - `@/components/*` para componentes
  - `@utils/*` para utilidades
  - `@modules/*` para módulos
  - `@app/*` para código de la app

### Componentes

- Nombrar componentes en PascalCase
- Un componente por archivo
- Exportar como default
- Usar 'use client' cuando sea necesario
- Documentar props con TypeScript

### Utilidades

- Nombrar funciones en camelCase
- Agrupar por funcionalidad
- Exportar funciones nombradas
- Documentar con JSDoc cuando sea complejo

### Estilos

- Usar Tailwind para estilos
- Mantener consistencia en clases
- Extraer componentes para reutilizar estilos

## Guía para Desarrolladores

### Buenas Prácticas

- Instalar dependencias desde la raíz: `npm install`
- Usar `npm ci` para instalaciones limpias y reproducibles
- Seguir las convenciones de TypeScript
- Mantener el archivo package-lock.json actualizado

### Convenciones

#### Formato de Datos

- Números:

  - Coma (,) como separador decimal (ej: "1.234,56")
  - Punto (.) como separador de miles (ej: "1.234.567")
  - Inputs aceptan ambos formatos para mejor UX
  - Se normalizan a formato ISO para almacenamiento

- Fechas:

  - Frontend: formato local es-CO (dd/mm/yyyy)
  - Almacenamiento: ISO 8601 (YYYY-MM-DD)
  - Timestamps: UTC en base de datos, zona horaria Colombia (-05:00) en UI
  - Inputs aceptan varios formatos para mejor UX

- Códigos SECOP:
  - Formato: URL completa del proceso en SECOP II
  - Ejemplo: https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.123456
  - Los códigos NTC se extraen automáticamente de la URL (CO1.NTC.123456)
  - Validación case-insensitive para el código NTC
  - Se almacena la URL completa y el código NTC por separado
  - Los códigos NTC se normalizan a mayúsculas para almacenamiento

#### Nombramiento

- Archivos:

  - Componentes React: PascalCase (ej: `Button.tsx`)
  - Utilidades: camelCase (ej: `formatNumber.ts`)
  - Tests: sufijo `.test.ts` o `.spec.ts`
  - Tipos/interfaces: sufijo `.types.ts`

- Variables y Funciones:
  - camelCase para nombres de variables y funciones
  - PascalCase para tipos, interfaces y clases
  - Prefijo 'get' para funciones que retornan datos
  - Prefijo 'set' para funciones que modifican estado
  - Sufijo 'Action' para Server Actions de Next.js

#### Estructura de Archivos

- Componentes:

  - Un componente por archivo
  - Props interface al inicio
  - 'use client' cuando sea necesario
  - Estilos Tailwind inline (o componentes si son complejos)

- Utilidades:
  - Una función/constante por archivo si es compleja
  - Múltiples exports relacionados en un archivo
  - JSDoc para documentación
  - Tests junto al código fuente

#### Consistencia de Código

- TypeScript:

  - Usar tipos explícitos en props y returns
  - Evitar `any` excepto en casos justificados
  - Preferir interfaces para API pública
  - Usar type guards para validación en runtime

- Formateo:
  - 2 espacios para indentación
  - Punto y coma al final de las líneas
  - Comillas simples para strings
  - Trailing comma en multilinea

### Base de Datos

- Migraciones disponibles en `src/migrations/`
- Usar transacciones para operaciones múltiples
- Seguir convenciones de nomenclatura SQL

### Solución de Problemas

1. Error de conexión a la base de datos:

- Ejecuta `npm run check` para validar variables de entorno y la conexión a la base de datos.
- Revisar logs de Docker si es necesario

2. Errores de TypeScript:

   - Ejecutar `npm run lint` para identificar problemas
   - Usar `npm run lint:fix` para correcciones automáticas

3. Problemas de Docker:
   - Recrear contenedores: `docker compose down && docker compose up -d`
   - Limpiar volúmenes si es necesario: `docker compose down -v`
