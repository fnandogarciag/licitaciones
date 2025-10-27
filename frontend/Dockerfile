# === Frontend Dockerfile ===
FROM node:20-alpine AS builder
WORKDIR /app

# Update npm to fix notification message during build
RUN npm install -g npm@11.6.2

# Allow passing NEXT_PUBLIC_BACKEND_URL at build time so Next.js can include
# rewrites that proxy /api/* to the backend during the build.
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# Copiar lockfile y package.json de raíz y frontend
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Instalar dependencias del workspace
RUN npm install

# Asegurar tipos requeridos que Next puede esperar (evita que Next intente auto-instalar)
RUN npm install --workspace=frontend --save-dev @types/node

# Copiar frontend completo
COPY frontend ./frontend

# Copiar tsconfig base del workspace (usado por frontend/tsconfig.json)
COPY tsconfig.base.json ./

WORKDIR /app/frontend

# Build
RUN npm run build

# Stage Production
FROM node:20-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production

# Copiar dependencias de producción
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copiar build y archivos públicos
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
# Copiar archivo de usuarios para el endpoint de login (necesario en runtime)
COPY --from=builder /app/frontend/apiUsers.json ./apiUsers.json

EXPOSE 3000
RUN apk add --no-cache curl

CMD ["npm", "run", "start"]
