# LunaRoja Runbook

## 1. Purpose

LunaRoja is a full-stack platform for civic engagement and advocacy. It supports content publication, administrative workflows, subscriber communications, file handling, and background processing in a single operational stack.

## 2. Runtime architecture

### Services

- Frontend: Next.js application for public and admin experiences
- Backend: Express API with business logic, auth, uploads, and integrations
- Database: PostgreSQL with Sequelize models and migrations
- Queue and cache: Redis and BullMQ for background jobs and transient state
- Supporting services: pgAdmin, Metabase, and mail delivery integration

### Expected local URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- pgAdmin: http://localhost:5050
- Metabase: http://localhost:3001
- Redis: localhost:6379

## 3. Prerequisites

- Docker and Docker Compose
- Node.js and npm
- A configured environment file for the backend and frontend

## 4. Start the stack

```bash
docker compose up -d --build
```

To inspect running services:

```bash
docker compose ps
```

To inspect logs:

```bash
docker compose logs backend
docker compose logs postgres
docker compose logs redis
```

## 5. Local development

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

## 6. Key repository areas

### Backend

- backend/src/app.js — application bootstrap and service initialization
- backend/src/routes — API endpoints and feature modules
- backend/src/controllers — request handling and business logic
- backend/src/services — migrations, email, queue, and cache integrations
- backend/src/jobs — scheduled and background processing tasks

### Frontend

- frontend/src/pages — application pages and routes
- frontend/src/components — reusable UI building blocks
- frontend/src/context — global state and authentication context
- frontend/src/hooks — shared React hooks
- frontend/src/lib — API utilities and helpers

### Infrastructure

- docker-compose.yml — service orchestration
- database/init.sql — database initialization scripts
- .github/workflows — CI and validation automation

## 7. Database operations

### Check migration state

```bash
cd backend
npm run migrate:status
```

### Apply pending migrations

```bash
cd backend
npm run migrate
```

This workflow is intended for controlled deployments, local development, and repeatable environment updates.

## 8. Background processing

Redis and BullMQ are used for asynchronous workflows such as welcome emails and reminder-related tasks. The queue system is initialized during backend startup and can be extended for additional background jobs.

## 9. Operational notes

- The backend initializes core services and admin state during startup.
- File uploads and media assets are handled through the application stack.
- Security middleware, rate limiting, and CORS setup are part of the API bootstrap.
- Database changes are managed through explicit migration steps rather than implicit sync behavior.
- The system is designed to be easy to onboard, maintain, and evolve as requirements grow.

## 10. Recommended operating cadence

- Keep environment variables aligned between local, staging, and production contexts.
- Review migration state before deploying schema changes.
- Monitor Redis and queue activity when communications or reminders are active.
- Use CI and security checks as part of every release path.