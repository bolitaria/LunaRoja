-- ============================================================================
-- Script de inicialización de la base de datos Lunaroja
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'action_admin',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "Noticias" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "youtubeUrl" VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(255),
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "Reports" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "fileUrl" VARCHAR(255) NOT NULL,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "Subscribers" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  "subscribedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Usuario administrador por defecto (cambia el hash)
INSERT INTO "Users" (username, password, role, "createdAt", "updatedAt") 
VALUES (
  'admin',
  '$2a$10$S1kpew7oWcCMc24ubllAsu6YOhYoG8UlP64LvoW8Jh5DGgmtEjfSy', 
  'superadmin',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Usuario de solo lectura para Metabase
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metabase_read') THEN
    CREATE USER metabase_read WITH PASSWORD 'metabase_read_pw';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE lunaroja TO metabase_read;
GRANT USAGE ON SCHEMA public TO metabase_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_read;