module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // ---- petitions: columnas que aún pueden faltar ----
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_template_id" INTEGER REFERENCES "EmailTemplates"("id")`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "featured_image" VARCHAR(255)`);

    // ---- links: tabla correcta (created_by INTEGER) ----
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

    // ---- email_quota: añadir valores por defecto y evitar nulos ----
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "createdAt" SET DEFAULT NOW()`);
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "updatedAt" SET DEFAULT NOW()`);
    await query(`UPDATE "email_quota" SET "createdAt" = NOW() WHERE "createdAt" IS NULL`);
    await query(`UPDATE "email_quota" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL`);
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "createdAt" SET NOT NULL`);
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "updatedAt" SET NOT NULL`);
  },

  async down(queryInterface) {
    // sin down para no perder datos
  }
};
