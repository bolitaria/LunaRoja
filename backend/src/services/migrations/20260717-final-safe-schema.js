module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // ---- Petitions: columnas que aún puedan faltar ----
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_template_id" INTEGER REFERENCES "EmailTemplates"("id")`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "featured_image" VARCHAR(255)`);

    // ---- Links: crear tabla si no existe (sin DROP previo) ----
    await query(`
      CREATE TABLE IF NOT EXISTS "links" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "url" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL DEFAULT 'local',
        "active" BOOLEAN DEFAULT true,
        "created_by" INTEGER NOT NULL REFERENCES "Users"("id"),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Si la tabla ya existía con otra estructura, ajustamos columnas sueltas (sin bloquear)
    await query(`ALTER TABLE "links" ALTER COLUMN "created_by" TYPE INTEGER USING ("created_by"::INTEGER)`);
    // Ignoramos errores si la columna ya es del tipo correcto
    try {
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "description" TEXT`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) NOT NULL DEFAULT 'local'`);
      await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true`);
    } catch (e) {
      // Si las columnas ya existen, continuamos
    }

    // ---- Email Quota: crear tabla si no existe ----
    await query(`
      CREATE TABLE IF NOT EXISTS "email_quota" (
        "date" DATE PRIMARY KEY,
        "sent_count" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    // Si la tabla ya existía sin estas columnas, las añadimos (idempotente)
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "sent_count" INTEGER DEFAULT 0`);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  },

  async down(queryInterface) {
    // Sin down para evitar pérdida de datos
  }
};
