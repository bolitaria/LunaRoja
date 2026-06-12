# Voices for Palestinian Justice - Awareness Platform

Voices for Palestinian Justice is a web platform designed to disseminate information about a social cause, offering multimedia content (videos, reports) and an email subscription system for reminders.

## Project Status

**Phase 1 (MVP) completed.**  
The application includes:
- Public display of videos (embedded YouTube) and reports (PDF).
- Subscription form to receive news and updates.
- Protected admin dashboard for content management (CRUD for videos and reports, subscriber list).
- JWT authentication.
- PostgreSQL database.
- Docker containerization.

## Technologies Used

- **Frontend:** Next.js (React), Tailwind CSS, Axios, SWR.
- **Backend:** Node.js + Express, Sequelize ORM, PostgreSQL, JWT, Multer.
- **Infrastructure:** Docker, Docker Compose.

## Repository Structure

```
LunaRoja/
├── backend/                    # REST API
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # Route definitions
│   │   ├── middlewares/        # Authentication and other middlewares
│   │   ├── services/           # Business services
│   │   ├── jobs/               # Background jobs
│   │   ├── config/             # Database configuration
│   │   ├── utils/              # Utility functions
│   │   └── app.js              # Entry point
│   ├── uploads/                # Uploaded files (PDFs)
│   ├── seeders/                # Database seeders
│   ├── package.json
│   └── Dockerfile
├── frontend/                   # Next.js application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Pages (including admin)
│   │   ├── context/            # Authentication context
│   │   ├── lib/                # Utility libraries
│   │   ├── styles/             # Global styles
│   │   └── hooks/              # Custom hooks
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
├── database/                   # Initial SQL scripts
│   └── init.sql
├── docker-compose.yml          # Service orchestration
└── README.md
```


## Prerequisites

- Docker and Docker Compose installed.
- Git (optional).

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LunaRoja
   ```

2. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Create the first admin user:
   Once the containers are running, execute:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

## Common Docker Commands

| Action | Command |
|--------|----------|
| Start containers | `docker-compose up -d` |
| Stop containers (without losing data) | `docker-compose down` |
| View container status | `docker-compose ps` |
| View backend logs | `docker-compose logs backend` |
| View database logs | `docker-compose logs db` |
| Access the database (psql) | `docker exec -it lunaroja_db psql -U lunaroja -d lunaroja` |
| Manual backup | `docker exec -t lunaroja_db pg_dump -U lunaroja lunaroja > backup.sql` |

## Adding Content via Admin Dashboard

**For YouTube Videos:**
- Thumbnail: `https://img.youtube.com/vi/<video-id>/maxresdefault.jpg`
- Use the video ID from the YouTube URL

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin Dashboard:** http://localhost:3000/admin (requires authentication) 