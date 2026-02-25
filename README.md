# LunaRoja - Plataforma de concientización

Proyecto para difundir información sobre una causa, con videos, reportes y sistema de recordatorios por correo.

## Estructura del repositorio

- `frontend/`: Aplicación Next.js
- `backend/`: API REST con Node.js/Express
- `database/`: Scripts SQL iniciales

## Requisitos

- Docker y Docker Compose (recomendado)
- Node.js 18+ y npm (para desarrollo local)

## Instalación y ejecución con Docker

```bash
# Clonar el repositorio
git clone <url>
cd LunaRoja

# Construir y levantar contenedores
docker-compose up --build