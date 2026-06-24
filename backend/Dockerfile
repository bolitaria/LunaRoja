# Stage 1: Dependencies
FROM node:18-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Stage 2: Builder (copiar dependencias completas)
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Asegurar que el código fuente no tenga problemas de permisos
RUN chown -R node:node /app

# Stage 3: Production runner (solo copia lo necesario)
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root para seguridad
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/uploads ./uploads
# NO copiar .env; usar variables de entorno en docker-compose o -e

USER nodejs

EXPOSE 5000
CMD ["node", "src/app.js"]