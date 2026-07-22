-- ============================================================================
-- Script de inicialización de la base de datos Lunaroja (completo)
-- ============================================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'action_admin',
  email VARCHAR(255),
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "failedLoginAttempts" INTEGER DEFAULT 0,
  "lockedUntil" TIMESTAMP WITH TIME ZONE,
  "resetToken" VARCHAR(255),
  "resetTokenExpires" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de campañas
CREATE TABLE IF NOT EXISTS "Campaigns" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#E53E3E',
  "imageUrl" VARCHAR(255),
  groups JSONB DEFAULT '[]',
  "privateLink" VARCHAR(255),
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de BDS
CREATE TABLE IF NOT EXISTS "BDS" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#E53E3E',
  "imageUrl" VARCHAR(255),
  groups JSONB DEFAULT '[]',
  "documentLink" VARCHAR(255),
  "privateLink" VARCHAR(255),
  document VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de acciones
CREATE TABLE IF NOT EXISTS "Actions" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'protest',
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  "locationType" VARCHAR(50) DEFAULT 'presencial',
  "onlineLink" VARCHAR(255),
  "placeName" VARCHAR(255),
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  "registrationLink" VARCHAR(255),
  "recordingUrl" VARCHAR(255),
  urgent BOOLEAN DEFAULT false,
  "enableAttendance" BOOLEAN DEFAULT false,
  "campaignId" INTEGER REFERENCES "Campaigns"(id) ON DELETE SET NULL,
  "bdsId" INTEGER REFERENCES "BDS"(id) ON DELETE SET NULL,
  "privateLink" VARCHAR(255),
  groups JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de imágenes de acción
CREATE TABLE IF NOT EXISTS "ActionImages" (
  id SERIAL PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  "actionId" INTEGER NOT NULL REFERENCES "Actions"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de grupos de chat
CREATE TABLE IF NOT EXISTS "ChatGroups" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(50) NOT NULL,
  link VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  "isPublic" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "campaignId" INTEGER REFERENCES "Campaigns"(id) ON DELETE SET NULL,
  "bdsId" INTEGER REFERENCES "BDS"(id) ON DELETE SET NULL,
  "actionId" INTEGER REFERENCES "Actions"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de noticias
CREATE TABLE IF NOT EXISTS "News" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "youtubeUrl" VARCHAR(255),
  "isNews" BOOLEAN DEFAULT true,
  thumbnail VARCHAR(255),
  "campaignId" INTEGER REFERENCES "Campaigns"(id) ON DELETE SET NULL,
  "actionId" INTEGER REFERENCES "Actions"(id) ON DELETE SET NULL,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de reportes/blogs
CREATE TABLE IF NOT EXISTS "Reports" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  type VARCHAR(50) DEFAULT 'blog',  -- 'blog' o 'report'
  source VARCHAR(255),
  author VARCHAR(255),
  "fileUrl" VARCHAR(255),
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de suscriptores
CREATE TABLE IF NOT EXISTS "Subscribers" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  "sendReminders" BOOLEAN DEFAULT false,
  "subscribedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de recordatorios para suscriptores
CREATE TABLE IF NOT EXISTS "SubscribersReminders" (
  id SERIAL PRIMARY KEY,
  "subscriberId" INTEGER NOT NULL REFERENCES "Subscribers"(id) ON DELETE CASCADE,
  "actionId" INTEGER NOT NULL REFERENCES "Actions"(id) ON DELETE CASCADE,
  "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de peticiones
CREATE TABLE IF NOT EXISTS "Petitions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT DEFAULT '',
  target_emails TEXT[] DEFAULT '{}',
  total_signatures INTEGER DEFAULT 0,
  signature_fields JSONB DEFAULT '[]',
  type VARCHAR(50) DEFAULT 'custom',  -- 'official' o 'custom'
  external_url VARCHAR(255),
  urgency BOOLEAN DEFAULT false,
  deadline TIMESTAMP WITH TIME ZONE,
  hidden BOOLEAN DEFAULT false,
  email_body_template TEXT,
  "emailTemplateId" INTEGER REFERENCES "EmailTemplates"(id) ON DELETE SET NULL,
  featured_image VARCHAR(255),
  created_by INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de firmas (hashes)
CREATE TABLE IF NOT EXISTS "SignatureHashes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES "Petitions"(id) ON DELETE CASCADE,
  identifier_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cola de correos
CREATE TABLE IF NOT EXISTS "EmailQueue" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES "Petitions"(id) ON DELETE CASCADE,
  signer_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de cuota diaria de correos
CREATE TABLE IF NOT EXISTS "EmailQuota" (
  date DATE PRIMARY KEY,
  sent_count INTEGER DEFAULT 0
);

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS "EmailTemplates" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  type VARCHAR(50) DEFAULT 'custom',
  "associatedEvent" VARCHAR(50) DEFAULT 'custom',
  "isActive" BOOLEAN DEFAULT true,
  "headerColor" VARCHAR(7) DEFAULT '#b91c1c',
  "buttonColor" VARCHAR(7) DEFAULT '#16a34a',
  "footerColor" VARCHAR(7) DEFAULT '#1f2937',
  "backgroundColor" VARCHAR(7) DEFAULT '#f3f4f6',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tablas de relaciones muchos a muchos
CREATE TABLE IF NOT EXISTS "UserCampaigns" (
  "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "campaignId" INTEGER NOT NULL REFERENCES "Campaigns"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("userId", "campaignId")
);

CREATE TABLE IF NOT EXISTS "UserActions" (
  "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "actionId" INTEGER NOT NULL REFERENCES "Actions"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("userId", "actionId")
);

CREATE TABLE IF NOT EXISTS "UserBDS" (
  "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "bdsId" INTEGER NOT NULL REFERENCES "BDS"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("userId", "bdsId")
);

-- Datos iniciales
INSERT INTO "Users" (username, password, role, "createdAt", "updatedAt") 
VALUES (
  'admin',
  '$2a$10$S1kpew7oWcCMc24ubllAsu6YOhYoG8UlP64LvoW8Jh5DGgmtEjfSy', -- nosemgrep
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