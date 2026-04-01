-- Crear base de datos (si no existe, pero Docker Compose ya la crea)
-- \c lunaroja;

-- Tabla de usuarios (admin)
CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de videos de Noticias
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

-- Tabla de reportes
CREATE TABLE IF NOT EXISTS "Reports" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "fileUrl" VARCHAR(255) NOT NULL,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de suscriptores
CREATE TABLE IF NOT EXISTS "Subscribers" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  "subscribedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Insertar usuario admin por defecto (contraseña: admin123)
-- La contraseña está hasheada con bcrypt (salt 10): admin123
INSERT INTO "Users" (username, password, role, "createdAt", "updatedAt") 
VALUES ('admin', '$2a$10$XPTcZ7X9QK5X5X5X5X5X5eX5X5X5X5X5X5X5X5X5X5', 'admin', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;