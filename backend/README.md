# Voices for Palestinian Justice - Backend

REST API for the Voices for Palestinian Justice platform.

## Technologies

- Node.js + Express
- Sequelize ORM (Database)
- PostgreSQL
- JWT for authentication
- Multer for file uploads
- Puppeteer for Instagram scraping

## Project Structure

```
src/
├── controllers/     # Route handlers and business logic
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── middlewares/     # Authentication and file upload middlewares
├── services/        # Reusable business logic and external integrations
├── jobs/            # Scheduled background jobs
├── config/          # Database and environment configuration
├── utils/           # Utility functions
├── templates/       # Email templates
└── app.js           # Express application setup
```

## Installation and Setup

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials and API keys
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run seed` - Populate database with initial admin user

## Key Features

- **User Management:** Registration, login, JWT authentication
- **Content Management:** Create, read, update, delete videos, reports, and documents
- **Subscriber Management:** Email subscription system with reminder jobs
- **Instagram Integration:** Scrape and manage Instagram posts
- **File Upload:** Support for PDFs and images with Multer
- **Admin Dashboard:** Backend API for administrative operations

## API Endpoints

See the routes files in `src/routes/` for complete API documentation.

## Environment Variables

Create a `.env` file based on `.env.example` with:
- Database credentials
- JWT secret
- Mail service credentials
- Instagram scraper settings
- File upload configuration