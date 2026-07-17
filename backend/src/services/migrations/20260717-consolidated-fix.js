module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // ---- Petitions: añadir columnas que aún puedan faltar ----
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_template_id" INTEGER REFERENCES "EmailTemplates"("id")`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "featured_image" VARCHAR(255)`);

    // ---- Links: recrear tabla con created_by INTEGER (compatible con Users.id) ----
    await query(`DROP TABLE IF EXISTS "links" CASCADE`);
    await query(`
      CREATE TABLE "links" (
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

    // ---- Email Quota: borrar la tabla actual y recrearla con todas las columnas necesarias ----
    await query(`DROP TABLE IF EXISTS "email_quota" CASCADE`);
    await query(`
      CREATE TABLE "email_quota" (
        "date" DATE PRIMARY KEY,
        "sent_count" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
  },

  async down(queryInterface) {
    // No se implementa down para evitar pérdida de datos
  }
};
