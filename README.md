# LunaRoja - Plataforma de Concientización

LunaRoja es una plataforma web diseñada para difundir información sobre una causa social, ofreciendo contenido multimedia (videos, reportes) y un sistema de suscripción para recordatorios por correo electrónico.

## Estado del proyecto

**Fase 1 (MVP) completada.**  
La aplicación incluye:
- Visualización pública de videos (embebidos de YouTube) y reportes (PDF).
- Formulario de suscripción para recibir novedades.
- Panel de administración protegido para gestionar contenido (CRUD de videos y reportes, listado de suscriptores).
- Autenticación JWT.
- Base de datos PostgreSQL.
- Contenerización con Docker.

## Tecnologías utilizadas

- **Frontend:** Next.js (React), Tailwind CSS, Axios, SWR.
- **Backend:** Node.js + Express, Sequelize ORM, PostgreSQL, JWT, Multer.
- **Infraestructura:** Docker, Docker Compose.

## Estructura del repositorio
LunaRoja/
├── backend/ # API REST
│ ├── src/
│ │ ├── controllers/ # Lógica de negocio
│ │ ├── models/ # Modelos Sequelize
│ │ ├── routes/ # Definición de rutas
│ │ ├── middlewares/ # Autenticación y otros
│ │ ├── config/ # Configuración de BD
│ │ ├── utils/ # Utilidades
│ │ └── app.js # Punto de entrada
│ ├── uploads/ # Archivos subidos (PDF)
│ ├── package.json
│ └── Dockerfile
├── frontend/ # Aplicación Next.js
│ ├── public/
│ ├── src/
│ │ ├── components/ # Componentes reutilizables
│ │ ├── pages/ # Páginas (incluyendo admin)
│ │ ├── context/ # Contexto de autenticación
│ │ ├── lib/ # Utilidades (auth)
│ │ ├── styles/ # CSS global
│ │ └── hooks/ # Hooks personalizados
│ ├── package.json
│ ├── next.config.js
│ └── Dockerfile
├── database/ # Scripts SQL iniciales
│ └── init.sql
├── docker-compose.yml # Orquestación de servicios
└── README.md


## Requisitos previos

- Docker y Docker Compose instalados.
- Git (opcional).

## Instalación y ejecución

1. Clona el repositorio (si es necesario):
   ```bash
   git clone <url>
   cd LunaRoja


Creación del primer usuario administrador
Una vez que los contenedores estén corriendo, ejecuta:

bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

  
Acción	Comando
Iniciar contenedores	docker-compose up -d
Detener contenedores (sin perder datos)	docker-compose down
Ver estado	docker-compose ps
Ver logs del backend	docker-compose logs backend
Ver logs de la base de datos	docker-compose logs db
Acceder a la base de datos (psql)	docker exec -it lunaroja_db psql -U lunaroja -d lunaroja
Backup manual	docker exec -t lunaroja_db pg_dump -U lunaroja lunaroja > backup.sql

Insertar Video Admin
Miniatura: https://img.youtube.com/vi/<video-id>/maxresdefault.jpg 