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
- Filtered and paginated public and admin listings
- End-to-end coverage of admin content flows with Playwright

## Architecture

### Frontend

- Next.js and React for the public and admin experience
- Tailwind CSS for responsive and maintainable styling
- Axios and SWR for API communication and data fetching
- React Hook Form and related UI components for forms and validation
- react-calendar for the public calendar of actions

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
- CI workflows, security scanning, and Playwright E2E tests for delivery readiness

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

### Seeding demo data

The seed is idempotent: it only creates rows when the target table is empty.

```bash
cd backend
node scripts/seed-demo.js
```

### Background processing

Redis and BullMQ are used for asynchronous workflows such as welcome emails and reminder-related tasks. The queueing layer is initialized during backend startup and can be extended for additional background jobs.

## Public site

The public experience includes:

- Home with recent actions, gallery, news, and blog/reports widgets
- Campaigns and BDS listings with filtering
- Actions listing with filters by category, time, and location type
- Public calendar of actions (campaign-linked and BDS-linked)
- News, blog/reports, petitions, links, and gallery
- Footer with partner logos (auto-popup when overflow)

## Admin console

The administrative console provides:

- Dashboard with metrics
- Full CRUD for campaigns, BDS, actions, news, reports, petitions, links, chat groups, email templates, images, and subscribers
- User and role management (superadmin, campaign_admin, action_admin, bds_admin, blog_admin)
- Consistent pagination anchored above the footer across all listing pages
- Unified filter bar (search, chips, secondary filters, clear-all)
- Audit log for admin actions

## Quality and delivery posture

The project is structured to support maintainability, operational clarity, and practical delivery:

- Clear separation between frontend, backend, and infrastructure concerns
- Environment-based configuration for service integrations
- Explicit migration handling for database changes
- Asynchronous processing for communications and operational workflows
- Automated unit and E2E testing for critical flows

## Testing

### Frontend unit tests (Jest + React Testing Library)

```bash
cd frontend
npm ci
npx jest
```

Current status: 83 suites / 117 tests passing.

`tests/setupFramework.js` provides jsdom polyfills for `ResizeObserver`, `IntersectionObserver`, and `matchMedia`.

### Backend tests (Jest)

```bash
cd backend
npm test
```

### Playwright E2E tests

The E2E suite validates the end-to-end content creation flows across every administrative module. 13 tests run green locally and in CI.

#### Coverage

| Module            | Test strategy                                |
|-------------------|----------------------------------------------|
| Login             | Authentication via API + dashboard access    |
| Campaigns         | Full UI flow (including search)              |
| Actions           | UI creation + verification in edit view      |
| News              | Creation via API + list verification         |
| Reports           | Creation via API                             |
| Chat Groups       | Creation via API + list verification         |
| Links             | Creation via API + list verification         |
| Email Templates   | Creation via API + list verification         |
| Petitions         | Creation via API + list verification         |
| BDS               | Creation via API + verification in edit view |
| Subscribers       | List page loads correctly                    |
| Public page       | Validation of main navigation links          |

#### Architecture

- Repaired proxy (`setupApiProxy`) to avoid Next.js 500 errors in dev.
- Shared helpers (`utils.ts`): `login`, `createEntityViaApi`, credentials externalized.
- Credentials managed via environment variables (`.env.test`, not versioned).
- Semantic selectors (`getByPlaceholder`, `getByRole`) and dynamic waits.
- Complex forms are created via API to speed up execution and reduce UI fragility.

#### Running the suite

```bash
# 1. Start services
docker compose up -d

# 2. Install dependencies
cd frontend
npm ci

# 3. Copy and edit the test environment file
cp .env.test.example .env.test
$EDITOR .env.test

# 4. Run the suite
npx playwright test
```

#### Test credentials template (`frontend/.env.test.example`)

```bash
# Copy this file as .env.test and fill in the real credentials
TEST_ADMIN_USER=admin
TEST_ADMIN_PASS=admin123
```

## Key files

- `docker-compose.yml` — service orchestration and local dependencies
- `backend/src/app.js` — backend entry point and startup flow
- `backend/src/routes` — API structure and feature modules
- `backend/scripts/seed-demo.js` — demo data seeding
- `frontend/src` — UI pages, components, and shared application state
- `frontend/tests/unit` — Jest unit tests
- `frontend/tests/e2e` — Playwright E2E tests
- `.github/workflows` — CI and deployment automation

For operational details, see `RUNBOOK.md`.
