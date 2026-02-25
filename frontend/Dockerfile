FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiar el contenido de standalone (no la carpeta)
COPY --from=builder /app/.next/standalone/. ./
# Copiar la carpeta static (necesaria para activos estáticos)
COPY --from=builder /app/.next/static ./.next/static
# Copiar public (si existe)
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]