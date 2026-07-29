# LunaRoja Frontend

The frontend for LunaRoja is a Next.js application that delivers the public experience and the administrative UI for the platform.

## Overview

This frontend provides:

- Public-facing pages for campaigns, actions, news, gallery, and subscriptions
- Administrative pages for managing content, users, subscribers, and operational workflows
- Integration with the backend API using Axios and SWR
- Responsive UI built with Tailwind CSS and reusable components

## Technology stack

- Next.js
- React
- Tailwind CSS
- Axios
- SWR
- React Hook Form
- React Icons
- React Toastify
- React Select

## Project structure

```text
src/
├── components/       # Reusable UI components
├── context/          # Authentication and global state context
├── hooks/            # Shared React hooks
├── lib/              # API and utility modules
├── pages/            # Next.js pages including admin routes
├── public/           # Static assets
└── styles/           # Global styles and Tailwind configuration
```

## Setup

```bash
cd frontend
npm install
cp .env.local .env.local.backup 2>/dev/null || true
# Update configuration values in .env.local as needed
npm run dev
```

## Environment variables

The frontend uses frontend/.env.local for runtime values such as:

- NEXT_PUBLIC_API_URL — Backend API URL, for example http://localhost:5000/api
- NEXT_PUBLIC_BASE_URL — Base URL for backend asset access
- NEXT_PUBLIC_INSTAGRAM_URL — External Instagram link

## Available scripts

- npm run dev — start the development server
- npm run build — build production assets
- npm start — run the built production server

## Product features

- Public pages for campaigns, actions, news, gallery, and subscription
- Administrative dashboard with authentication and role-based access
- Content management for campaigns, actions, articles, reports, and documents
- Subscriber management and communication workflow integration
- Responsive design for desktop and mobile
- File upload support for media and documents

## Notes

- The frontend consumes the Express backend API through NEXT_PUBLIC_API_URL.
- The application assumes the backend service is available during local development.
- Create .env.local manually if it is not present.

## Key files

- src/pages/admin/login.js — admin login interface
- src/pages/admin/index.js — admin dashboard entry point
- src/lib/axios.js — API client configuration
- tailwind.config.js — Tailwind configuration
- next.config.js — Next.js runtime configuration
### ▶️ Cómo ejecutar

```bash
# 1. Levantar los servicios
docker compose up -d

# 2. Instalar dependencias
cd frontend
npm ci

# 3. Crear archivo .env.test con tus credenciales (ver plantilla)
cp .env.test.example .env.test
# Editar .env.test con usuario/contraseña reales

# 4. Ejecutar la suite
npx playwright test
