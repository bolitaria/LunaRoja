# LunaRoja

LunaRoja is a full-stack platform for civic engagement, advocacy, and community mobilization. It combines a public-facing experience, an administrative console, and a backend API for content management, user workflows, subscribers, petitions, uploads, reminders, and communications.

## Product scope

The platform supports the publication and coordination of campaigns, actions, news, reports, documents, and petitions through a structured web application. It is designed for organizations that need a reliable digital presence with secure internal operations.

## Core capabilities

- Content management for campaigns, actions, news, reports, documents, and petitions
- Administrative workflows for publishing, moderation, and user oversight
- Subscriber registration, preference management, and communication handling
- File upload support for media and documents
- Protected API routes with authentication and role-based access control
- Background processing for reminders and notifications through Redis and BullMQ
- Explicit database migration management for controlled deployments

## Architecture

### Frontend
- Next.js and React for the public and admin experience
- Tailwind CSS for responsive and maintainable styling
- Axios and SWR for API communication and data fetching
- React Hook Form and related UI components for forms and validation

### Backend
- Node.js and Express for the API server and business logic
- Sequelize with PostgreSQL for data modeling and persistence
- JWT-based authentication and authorization
- Multer for upload handling
- Nodemailer and Handlebars for email delivery
- Middleware-based request handling for security, auth, validation, and uploads

### Platform and operations
- Docker Compose for local orchestration and environment consistency
- PostgreSQL, pgAdmin, Metabase, and Redis as supporting services
- CI workflows and security scanning for maintainability and delivery readiness

## Repository structure

```text
LunaRoja/
├── backend/                # API, business logic, models, services, and routes
├── frontend/               # Next.js application and UI components
├── database/               # Database initialization scripts
├── docker-compose.yml      # Local service orchestration
├── .github/workflows/      # CI/CD automation
└── README.md               # Project overview
```

## Quick start

### With Docker

```bash
docker compose up -d --build
```

### Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- pgAdmin: http://localhost:5050
- Metabase: http://localhost:3001
- Redis: localhost:6379

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

## Operational workflow

### Database migrations

```bash
cd backend
npm run migrate:status
npm run migrate
```

### Background processing

Redis and BullMQ are used for asynchronous workflows such as welcome emails and reminder-related tasks. The queueing layer is initialized during backend startup and can be extended for additional background jobs.

## Quality and delivery posture

The project is structured to support maintainability, operational clarity, and practical delivery:

- Clear separation between frontend, backend, and infrastructure concerns
- Environment-based configuration for service integrations
- Explicit migration handling for database changes
- Asynchronous processing for communications and operational workflows
- A foundation suitable for long-term maintenance and future scaling

## Key files

- docker-compose.yml — service orchestration and local dependencies
- backend/src/app.js — backend entry point and startup flow
- backend/src/routes — API structure and feature modules
- frontend/src — UI pages, components, and shared application state
- .github/workflows — CI and deployment automation

For operational details, see RUNBOOK.md.
## 🧪 Playwright E2E Tests (cubre todos los módulos administrativos)

Esta suite valida de extremo a extremo los flujos de creación de contenido en LunaRoja.  
**13 tests** que pasan en verde y pueden ejecutarse localmente o en CI/CD.

### 🎯 Cobertura

| Módulo            | Estrategia de prueba                         |
|-------------------|----------------------------------------------|
| Login             | Autenticación vía API + acceso al dashboard  |
| Campañas          | Flujo UI completo (búsqueda incluida)        |
| Acciones          | Creación UI + verificación en edición        |
| Noticias          | Creación vía API + verificación en lista     |
| Reportes          | Creación vía API (ruta corregida)            |
| Chat Groups       | Creación vía API + verificación en lista     |
| Links             | Creación vía API + verificación en lista     |
| Email Templates   | Creación vía API + verificación en lista     |
| Peticiones        | Creación vía API + verificación en lista     |
| BDS               | Creación vía API + verificación en edición   |
| Suscriptores      | Carga correcta de la página de listado       |
| Página pública    | Validación de enlaces principales            |

### 🏗️ Arquitectura

- Proxy reparado (`setupApiProxy`) para evitar el error 500 de Next.js en desarrollo.
- Utilidades compartidas (`utils.ts`): `login`, `createEntityViaApi`, credenciales externalizadas.
- Credenciales administradas con variables de entorno (`.env.test`, no versionado).
- Selectores semánticos (`getByPlaceholder`, `getByRole`) y esperas dinámicas.
- Los formularios complejos se crean vía API, acelerando la ejecución y evitando fragilidad en la UI.

### ▶️ Cómo ejecutar

```bash
# 1. Levantar los servicios
docker compose up -d

# 2. Instalar dependencias
cd frontend
npm ci

# 3. Copiar variables de entorno de prueba y editarlas
cp .env.test.example .env.test

# 4. Ejecutar la suite
npx playwright test
## 3. Crear el archivo de ejemplo para las credenciales (`.env.test.example`)

Para que otros sepan qué variables configurar, crea un archivo de plantilla:

```bash
cat > frontend/.env.test.example << 'EOF'
# Copia este archivo como .env.test y rellena las credenciales reales
TEST_ADMIN_USER=admin
TEST_ADMIN_PASS=admin123
