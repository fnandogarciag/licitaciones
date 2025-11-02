# === Backend Dockerfile ===
FROM node:20-alpine AS builder
WORKDIR /app

# Actualizar npm para evitar mensajes de notificación durante el build
RUN npm install -g npm@11.6.2

# Copiar lockfile y package.json de raíz y backend
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instalar dependencias del workspace
RUN npm install

# Copiar backend completo
COPY backend ./backend
# Copiar tsconfig base del workspace (usado por backend/tsconfig.json)
COPY tsconfig.base.json ./
# Asegurar que exista carpeta public para que la etapa runner pueda copiarla
RUN mkdir -p /app/backend/public
RUN apk add --no-cache curl

# Instalar las dependencias del backend dentro del builder en /app/backend/node_modules
# para que el runner pueda copiarlas y `require('typeorm')` resuelva en tiempo de ejecución.
WORKDIR /app
RUN cd backend && npm install --no-audit --no-fund

WORKDIR /app/backend

# Build
# Compilar TypeScript para emitir JS (entities -> dist/*.js) y luego construir Next
# Establecer NEXT_SKIP_ESLINT para omitir ESLint durante el build dentro de la imagen
# (la configuración de lint del workspace/CI a veces incluye archivos que provocan
# fallos en el build; omitir lint permite que la compilación prosiga).
ENV NEXT_SKIP_ESLINT=true
RUN npm run build

# Compatibilidad hacia atrás: algunas rutas en tiempo de ejecución o código
# antiguo aún intentan cargar desde `lib`. Si se generó `dist`, cópialo a
# `lib` para que ambas rutas existan en la imagen builder. Esto hace que la
# instrucción COPY en la etapa runner sea más robusta cuando haya artefactos
# antiguos que esperan `lib`.
RUN cp -r ./dist ./lib || true

# Stage Production
FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:/app/backend/node_modules/.bin:$PATH

# Copiar dependencias de producción
COPY --from=builder /app/backend/package*.json ./
## Copiar node_modules específicos del backend creados en el builder
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules /app/node_modules

# Copiar el build y archivos públicos
COPY --from=builder /app/backend/.next ./.next
COPY --from=builder /app/backend/public ./public
# Copiar los archivos compilados (entities, migrations) para que TypeORM pueda
# encontrar los metadatos en tiempo de ejecución. Cambiamos el outDir de TypeScript
# a ./dist; copiar esa carpeta en su lugar.
COPY --from=builder /app/backend/dist ./dist

RUN apk add --no-cache curl

EXPOSE 3001
ENV BUILD_OUTDIR=dist
CMD ["npm", "run", "start"]
