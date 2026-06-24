# Voices for Palestinian Justice - Frontend

Next.js frontend for the Voices for Palestinian Justice platform, including public pages and the administrative user interface.

## Overview

This frontend provides:

- Public-facing pages for campaigns, actions, news, gallery, and subscriptions.
- Administrative pages for managing content, users, subscribers, and analytics.
- Integration with the backend API using Axios and SWR.
- Responsive UI built with Tailwind CSS.

## Technology stack

- Next.js
- React 18
- Tailwind CSS
- Axios
- SWR
- React Hook Form
- React Icons
- React Toastify
- React Select
- Recharts

## Project structure

```
src/
├── components/       # Reusable UI components
├── context/          # Authentication and global state context
├── hooks/            # Custom React hooks
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

The frontend uses `frontend/.env.local` to configure runtime values:

- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g. `http://localhost:5000/api`)
- `NEXT_PUBLIC_BASE_URL` - Base URL for backend asset access
- `NEXT_PUBLIC_INSTAGRAM_URL` - External Instagram link

## Available scripts

- `npm run dev` — start development server
- `npm run build` — build production assets
- `npm start` — run built production server

## Features

- Public pages for campaigns, actions, news, gallery, and subscription.
- Admin dashboard with authentication and role-based access.
- Content management for campaigns, actions, articles, reports, and documents.
- Subscriber management and email workflow integration.
- Responsive design for desktop and mobile.
- File upload support for media and documents.

## Notes

- The frontend is designed to consume the Express backend API at `NEXT_PUBLIC_API_URL`.
- The application assumes the backend service is available during local development.
- No `.env.local.example` file is included in the repository, so create `.env.local` manually.

## Key files

- `src/pages/admin/login.js` — admin login interface
- `src/pages/admin/index.js` — admin dashboard entry point
- `src/lib/axios.js` — API client configuration
- `tailwind.config.js` — Tailwind configuration
- `next.config.js` — Next.js runtime configuration
