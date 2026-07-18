# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el build (se pasan desde docker-compose)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_INSTAGRAM_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL

# Build
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar la salida standalone de Next.js (esto incluye server.js, node_modules y public)
COPY --from=builder /app/.next/standalone ./

# Copiar los archivos estáticos y la carpeta public (requeridos por el servidor standalone)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copiar iconos de Signal (si existen)
COPY --from=builder /app/src/assets/icons ./public/assets/icons

# 🔒 Eliminar todo vestigio de npm global (corepack, yarn, node_modules globales)
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-*

# Ajustar permisos para que nextjs pueda leer todo
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000

# El servidor standalone de Next.js se encuentra en la raíz del directorio de trabajo
CMD ["node", "server.js"]