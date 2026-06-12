FROM node:18-slim

# Instalar dependencias del sistema: Chromium, Tor, curl (para pruebas)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libxss1 \
    tor \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar Tor para que acepte conexiones SOCKS5 en el puerto 9050
RUN echo "SOCKSPort 9050" >> /etc/tor/torrc

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Instalar dependencias de Node.js
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Crear directorios de subida
RUN mkdir -p uploads/reports uploads/actions uploads/featured uploads/campaigns uploads/instagram

EXPOSE 5000

# Iniciar Tor en segundo plano y luego la aplicación
CMD service tor start && npm start