FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Actualizar paquetes del sistema operativo
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copiar solo archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force

# 🔥 ELIMINAR npm y sus dependencias globales (fuente de los 12 HIGH)
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn-*

# Copiar código fuente y entrypoint
COPY src ./src
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Usuario no root
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
USER nodejs

ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 5000
