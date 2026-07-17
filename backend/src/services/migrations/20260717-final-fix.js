module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // Añadir external_url a petitions (si no existe)
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);

    // Cambiar created_by en links de INTEGER a UUID
    await query(`ALTER TABLE "links" DROP CONSTRAINT IF EXISTS "links_created_by_fkey"`);
    await query(`ALTER TABLE "links" ALTER COLUMN "created_by" TYPE UUID USING (created_by::text::UUID)`);
    await query(`ALTER TABLE "links" ADD CONSTRAINT "links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON UPDATE CASCADE`);

    // Reparar email_quota para que createdAt/updatedAt tengan valores por defecto y no sean nulos
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
