# Voices for Palestinian Justice - Frontend

Next.js application for the Voices for Palestinian Justice platform.

## Technologies

- Next.js 14+ (React)
- React Hooks
- Tailwind CSS (Styling)
- Axios (HTTP client)
- SWR (Data fetching and caching)
- Context API (State management)

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/            # Next.js pages (including admin pages)
├── context/          # React Context for authentication and global state
├── lib/              # Utility libraries and helpers
├── styles/           # Global CSS and Tailwind configuration
└── hooks/            # Custom React hooks
```

## Installation and Setup

```bash
npm install
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your backend
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env.local` file with:
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., http://localhost:5000)

## Key Features

- **Public Pages:**
  - Home page with news and campaign listings
  - Video gallery with embedded YouTube content
  - Document library with PDF downloads
  - News blog
  - Subscription form

- **Admin Dashboard:**
  - Authentication required
  - Content management (CRUD for videos, reports, documents)
  - Subscriber management
  - Dashboard with analytics

- **User Features:**
  - Responsive design
  - Email subscription system
  - Public content browsing
  - Admin authentication and authorization