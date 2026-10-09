# LunaRoja

LunaRoja is a full-stack platform for civic engagement, advocacy, and community mobilization. It combines a public-facing experience, an administrative console, and a backend API for content management, user workflows, subscribers, petitions, uploads, reminders, and communications.

## Product scope

The platform supports the publication and coordination of campaigns, actions, news, reports, documents, and petitions through a structured web application. It is designed for organizations that need a reliable digital presence with secure internal operations.

## Core capabilities

- Content management for campaigns, actions, news, reports, documents, and petitions
- Administrative workflows for publishing, moderation, and user oversight
- Subscriber registration, preference management, and communication handling
- Petition signing with support for both official and internal petitions
- File upload support for media and documents
- Protected API routes with authentication and role-based access control
- Background processing for emails, reminders, and notifications through Redis and BullMQ
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
- BullMQ and Redis for background jobs
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

### Demo credentials

The seed creates a default superadmin for local development:

- Username: `admin`
- Password: `admin123`

Change the password immediately in any non-local environment.

## Email delivery

Transactional and campaign emails are sent through Nodemailer with Handlebars templates. Email templates are stored in the database and manageable from the admin console, so content editors can update copy without redeploying the app.

### Template rendering

- Templates use Handlebars syntax with variables injected at send time (user name, campaign name, action link, unsubscribe URL, etc.).
- A default template is designated for petitions (`/api/email-templates/default-petition`) and used automatically when a petition is signed.
- Template content is editable per locale or per campaign, depending on the template scope.

### Delivery pipeline

Sending is asynchronous and goes through a queue so that user requests are never blocked by SMTP latency:

1. The API enqueues a job with the target recipients and template.
2. The queue worker (`worker` service in `docker-compose.yml`) picks up the job.
3. Emails are rendered, sent, and the result is recorded.
4. Failed deliveries are retried according to the queue policy and can be inspected from the admin console.

### Quotas and rate limiting

- `email_quota` tracks the sending allowance per period to stay within provider limits.
- `email_queue` stores pending and completed jobs so nothing is lost if the worker restarts.
- Delivery status is observable from the admin area for auditing and troubleshooting.

## Background processing

Redis and BullMQ power the asynchronous layer. It is initialized at backend startup and shared with the worker service.

Typical jobs:

- Welcome email for new subscribers
- Campaign and action notifications to targeted segments
- Reminders for upcoming actions (SubscribersReminders)
- Petition follow-ups for signers who opted in
- Retries for previously failed deliveries

The queue is designed to be extended with new job types without changing the API surface.

## Subscribers

Subscribers are the platform's contactable audience. The system supports:

- Registration from public forms with double opt-in style verification
- Preference management (which types of communications the subscriber wants)
- Segment filtering by campaign, action, BDS, or general interest
- Unsubscribe flow with a public endpoint
- Reminder scheduling linked to specific actions
- Delivery history and quota tracking per subscriber

Admin users can browse subscribers, filter them by campaign or action, and export lists.

## Petitions and signatures

Petitions allow visitors to add their voice to a cause. Two models coexist:

- **Official petitions** — link to an external signing platform. The user is redirected to the official site to sign, and the platform tracks the petition as a reference.
- **Internal petitions** — signed directly on LunaRoja. The user fills a configurable form, and the signature is stored and validated on the backend.

### Internal signature flow

1. The public petition page fetches the petition and its signature fields.
2. A CSRF token is requested before the form is submitted.
3. On submit, the backend validates the fields, checks for duplicates using a hash of identifying values (`signature_hashes`), and stores the signature.
4. A confirmation email is sent using the default petition template, unless the user opted out.
5. Petitions can be closed or have signing limits enforced per business rules.

### Anti-abuse

- CSRF protection on every signature endpoint.
- Duplicate detection through `signature_hashes` to prevent repeat signatures from the same person.
- Rate limiting on the public endpoint.

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
- `backend/src/services/queueService.js` — BullMQ queue initialization and job helpers
- `backend/src/services/emailService.js` — Nodemailer + Handlebars rendering
- `backend/src/services/documentService.js` — file and document lifecycle
- `backend/scripts/seed-demo.js` — demo data seeding
- `frontend/src` — UI pages, components, and shared application state
- `frontend/tests/unit` — Jest unit tests
- `frontend/tests/e2e` — Playwright E2E tests
- `.github/workflows` — CI and deployment automation

For operational details, see `RUNBOOK.md`.
