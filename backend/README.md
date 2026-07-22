# LunaRoja Backend

The backend for LunaRoja is an Express-based API that powers authentication, content management, subscriber workflows, uploads, and background processing for the platform.

## Overview

This service provides the server-side logic for:

- Authentication and authorization using JWT
- CRUD operations for campaigns, actions, news, reports, documents, subscribers, users, and chat groups
- File upload handling for images and documents
- PostgreSQL persistence via Sequelize
- Email service integration and reminder workflows
- Redis and BullMQ-based background processing
- Database migration execution and status reporting

## Technology stack

- Node.js
- Express
- Sequelize
- PostgreSQL
- JWT
- Multer
- Nodemailer
- Handlebars
- Redis
- BullMQ
- dotenv
- cors

## Project structure

```text
backend/
└── src/
    ├── config/          # Database and environment configuration
    ├── controllers/     # Route handlers and business logic
    ├── middlewares/     # Auth, uploads, and request handling
    ├── models/          # Sequelize models and associations
    ├── routes/          # API route definitions
    ├── services/        # Migrations, email, queue, and cache integrations
    ├── templates/       # Email templates
    ├── jobs/            # Background job definitions
    └── app.js           # Express application entry point
```

## Installation and setup

```bash
cd backend
npm install
cp ../.env .env
npm run dev
```

> Keep environment files out of version control and rotate credentials when needed.

## Available scripts

- npm run dev — start the development server with nodemon
- npm start — start the production server
- npm run migrate:status — inspect applied and pending migrations
- npm run migrate — apply pending migrations

## Configuration

The backend reads environment variables from .env.

Key values include:

- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET, JWT_REFRESH_SECRET
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
- FRONTEND_URL
- Redis connection settings when enabled

## API capabilities

- Authentication: register, login, token refresh, and protected routes
- User management: roles and permissions for admin operations
- Content management: campaigns, actions, news, reports, and documents
- Subscriber management: create and manage contact subscriptions
- File uploads: image and document storage via Multer
- Background processing: queue-driven jobs and reminder workflows

## Operational notes

- The backend initializes core services and admin state during startup.
- Database changes are handled through an explicit migration runner.
- Redis and BullMQ support asynchronous communication and background tasks.

## Key files

- src/app.js — Express application setup
- src/config/database.js — Sequelize connection configuration
- src/routes/authRoutes.js — authentication endpoints
- src/services/emailService.js — email delivery logic
- src/services/migrationService.js — migration planning and execution
- src/services/queueService.js — background queue integration
