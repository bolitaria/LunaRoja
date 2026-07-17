module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // 1. Añadir external_url a petitions
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);

    // 2. Recrear la tabla links con el tipo correcto para created_by (UUID)
    //    Eliminamos la tabla existente (está vacía en CI) y la creamos de nuevo
    await query(`DROP TABLE IF EXISTS "links" CASCADE`);
    await query(`
      CREATE TABLE "links" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "url" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL DEFAULT 'local',
        "active" BOOLEAN DEFAULT true,
        "created_by" UUID NOT NULL REFERENCES "Users"("id"),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 3. Reparar email_quota (asegurar createdAt/updatedAt)
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "createdAt" SET DEFAULT NOW()`);
    await query(`ALTER TABLE "email_quota" ALTER COLUMN "updatedAt" SET DEFAULT NOW()`);
    await query(`UPDATE "email_quota" SET "createdAt" = NOW() WHERE "createdAt" IS NULL`);
    await query(`UPDATE "email_quota" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL`);
  },

  async down(queryInterface) {
    // No implementado
  }
};
