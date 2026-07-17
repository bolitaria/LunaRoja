module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // ===== Subscribers: subscribedAt =====
    await query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "subscribedAt" TIMESTAMP WITH TIME ZONE`);

    // ===== Petitions: columnas que faltaban =====
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_template_id" INTEGER REFERENCES "EmailTemplates"("id")`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "featured_image" VARCHAR(255)`);

    // ===== News (tabla "News", modelo "Noticia"): columnas que faltaban =====
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "youtubeUrl" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "thumbnail" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "isNews" BOOLEAN DEFAULT false`);

    // ===== Reports: fileUrl =====
    await query(`ALTER TABLE "Reports" ADD COLUMN IF NOT EXISTS "fileUrl" VARCHAR(255)`);

    // ===== Links: crear tabla si no existe, con ENUM y clave foránea correcta =====
    // Creamos el tipo ENUM primero (idempotente)
    await query(`DO $$ BEGIN CREATE TYPE "public"."enum_links_category" AS ENUM('local','nacional','europeo','internacional','literatura'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    // Crear la tabla (si no existe)
    await query(`
      CREATE TABLE IF NOT EXISTS "links" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "url" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "category" "public"."enum_links_category" NOT NULL DEFAULT 'local',
        "active" BOOLEAN DEFAULT true,
        "created_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Si la tabla ya existía con otra estructura, forzamos las columnas nuevas (idempotente)
    try {
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "description" TEXT`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "category" "public"."enum_links_category" NOT NULL DEFAULT 'local'`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW()`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW()`);
      // Aseguramos que created_by sea INTEGER (puede haber quedado como UUID en intentos previos)
      await query(`ALTER TABLE "links" ALTER COLUMN "created_by" TYPE INTEGER USING ("created_by"::INTEGER)`);
    } catch (e) {
      // Si falla, la tabla ya está correcta
    }

    // ===== Email Quota: crear tabla si no existe, con columnas necesarias =====
    await query(`
      CREATE TABLE IF NOT EXISTS "email_quota" (
        "date" DATE PRIMARY KEY,
        "sent_count" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "sent_count" INTEGER DEFAULT 0`);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW()`);

    // ===== Documents: crear tabla si no existe =====
    await query(`
      CREATE TABLE IF NOT EXISTS "Documents" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255),
        "description" TEXT,
        "fileUrl" VARCHAR(255),
        "type" VARCHAR(50),
        "campaignId" INTEGER REFERENCES "Campaigns"("id") ON DELETE SET NULL,
        "actionId" INTEGER REFERENCES "Actions"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ===== BDS: crear tabla si no existe (en CI se necesita) =====
    await query(`
      CREATE TABLE IF NOT EXISTS "BDs" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "color" VARCHAR(50),
        "imageUrl" VARCHAR(255),
        "groups" TEXT DEFAULT '[]',
        "documentLink" VARCHAR(255),
        "document" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  },

  async down(queryInterface) {
    // No se implementa down para evitar pérdida de datos
  }
};
