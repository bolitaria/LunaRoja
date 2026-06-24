# Voices for Palestinian Justice

A full-stack web application for publishing campaigns, actions, news, reports, and supporter resources, with a secure administrative interface and subscriber management.

## Overview

This repository contains the complete production stack for a social awareness platform. It includes:

- A public-facing frontend built in Next.js.
- A REST API backend built in Express and Node.js.
- PostgreSQL data persistence with Sequelize ORM.
- JWT-based authentication and file upload support.
- A Docker Compose setup for development and deployment.

## Product goals

- Enable campaign managers to publish content quickly.
- Provide visitors with clear, accessible information.
- Capture and manage subscriber data reliably.
- Support administrative workflows through a centralized dashboard.

## Technology stack

- **Frontend:** Next.js, React, Tailwind CSS, Axios, SWR
- **Backend:** Node.js, Express, Sequelize, PostgreSQL, JWT, Multer
- **Infrastructure:** Docker, Docker Compose, pgAdmin, Metabase

## Architecture

- Public UI and admin interface implemented in Next.js.
- Backend API with Express routes and authentication middleware.
- Sequelize data models for campaigns, actions, news, reports, subscribers, and users.
- Docker Compose orchestrates backend, frontend, PostgreSQL, and observability tools.
- Static asset and upload handling through the backend.

## Repository structure

```
LunaRoja/
├── backend/                    # API and server implementation
│   ├── src/
│   ├── uploads/                # Uploaded files and media
│   ├── seeders/                # Database seed scripts
│   ├── package.json
│   └── Dockerfile
├── frontend/                   # Next.js application
│   ├── public/
│   ├── src/
│   ├── .env.local              # Local frontend configuration
│   ├── package.json
│   └── Dockerfile
├── database/                   # PostgreSQL initialization scripts
│   └── init.sql
├── docker-compose.yml          # Service orchestration
├── .env                        # Backend environment variables
└── README.md
```

## Prerequisites

- Docker
- Docker Compose
- Node.js and npm (only if running without Docker)

## Quick start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LunaRoja
   ```

2. Start the application:
   ```bash
   docker-compose up -d --build
   ```

3. Verify that services are running and available.

## Service endpoints

- Frontend: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Backend API: `http://localhost:5000/api`
- pgAdmin: `http://localhost:5050`
- Metabase: `http://localhost:3001`

## Docker commands

| Action | Command |
|--------|---------|
| Start services | `docker-compose up -d --build` |
| Stop services | `docker-compose down` |
| Check container status | `docker-compose ps` |
| View backend logs | `docker-compose logs backend` |
| View PostgreSQL logs | `docker-compose logs postgres` |
| Open PostgreSQL shell | `docker exec -it lunaroja_db psql -U lunaroja -d lunaroja` |
| Export database backup | `docker exec -t lunaroja_db pg_dump -U lunaroja lunaroja > backup.sql` |

## Local development

### Backend

```bash
cd backend
npm install
cp ../.env .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration

- Backend uses the root `.env` file.
- Frontend uses `frontend/.env.local`.
- The repository does not include `.env.example`.

## Notes

- The backend initializes a default admin user automatically on startup.
- Rotate any generated credentials after the first deployment.
- The application supports file uploads, content management, subscriber handling, and analytics integration.

## Key capabilities

- Campaign, action, news, report, and document management
- Role-based admin access and user management
- Subscriber registration and email workflow support
- File upload and media handling
- Docker-based deployment and local development

## Key files

- `docker-compose.yml` — service orchestration
- `backend/src/app.js` — backend entry point
- `frontend/.env.local` — frontend environment configuration
- `frontend/Dockerfile` — frontend build container
- `database/init.sql` — PostgreSQL initialization script