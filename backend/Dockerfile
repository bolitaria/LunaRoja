# Stage 1: Dependencies
FROM node:18-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Stage 2: Builder
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R node:node /app

# Stage 3: Production runner
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no root
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copiar dependencias y código
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Copiar el script de entrada
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# El entrypoint se ejecutará como root, luego cambiará a nodejs
ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 5000