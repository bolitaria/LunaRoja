# Voices for Palestinian Justice - Backend

Express backend for the Voices for Palestinian Justice platform.

## Overview

This backend provides the REST API and server-side logic for the platform, including:

- Authentication and authorization using JWT
- CRUD operations for campaigns, actions, news, reports, documents, subscribers, users, and chat groups
- File upload handling for images and documents
- PostgreSQL persistence via Sequelize
- Email service integration for notifications and subscriber workflows
- Database administration endpoints for backups and maintenance

## Technology stack

- Node.js
- Express
- Sequelize
- PostgreSQL
- JSON Web Tokens (JWT)
- Multer
- Nodemailer
- Handlebars
- dotenv
- cors

## Project structure

```
backend/
└── src/
    ├── config/          # Database and environment configuration
    ├── controllers/     # Route handlers and business logic
    ├── middlewares/     # Auth, uploads, and request handling
    ├── models/          # Sequelize models and associations
    ├── routes/          # API route definitions
    ├── services/        # Business logic and integrations
    ├── templates/       # Email templates
    ├── utils/           # Utility helpers
    └── app.js           # Express application entry point
```

## Installation and setup

```bash
cd backend
npm install
cp ../.env .env
npm run dev
```

> Do not commit secrets or environment files to version control.

## Available scripts

- `npm run dev` — start development server with nodemon
- `npm start` — start production server

## Configuration

The backend uses environment variables from `.env`.

Key values include:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `FRONTEND_URL`

## API features

- Authentication: register, login, token refresh, protected routes
- User management: roles and permissions for admin operations
- Content management: campaigns, actions, news, reports, documents
- Subscriber management: create and manage email subscribers
- File uploads: image and document storage via Multer
- Database management: backup and maintenance endpoints

## Notes

- The backend synchronizes Sequelize models on startup.
- It initializes the database and admin users automatically if needed.
- Use secure credentials and rotate any default or generated secrets.

## Key files

- `src/app.js` — Express application setup
- `src/config/database.js` — Sequelize database connection
- `src/routes/authRoutes.js` — authentication endpoints
- `src/services/emailService.js` — email delivery logic
- `src/middlewares/auth.js` — JWT auth middleware
