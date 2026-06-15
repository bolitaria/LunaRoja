# Stage 1: Install dependencies (Debian slim)
FROM node:18-slim AS deps
RUN apt-get update && apt-get install -y libc6 --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Build the app (Debian slim)
FROM node:18-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js will pick the correct SWC binary automatically – no manual install needed
RUN npm run build

# Stage 3: Production runner (Alpine OK here because it only runs the compiled app)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]