module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // petitions: signature_fields, hidden
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "signature_fields" JSONB DEFAULT '[]'`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN DEFAULT false`);

    // links: created_at, updated_at (asumiendo underscored: true en el modelo)
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

    // email_quota: createdAt, updatedAt (necesarios para evitar el error de findOrCreate)
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);
    await query(`ALTER TABLE "petitions" DROP COLUMN IF EXISTS "signature_fields"`);
    await query(`ALTER TABLE "petitions" DROP COLUMN IF EXISTS "hidden"`);
    await query(`ALTER TABLE "links" DROP COLUMN IF EXISTS "created_at"`);
    await query(`ALTER TABLE "links" DROP COLUMN IF EXISTS "updated_at"`);
    await query(`ALTER TABLE "email_quota" DROP COLUMN IF EXISTS "createdAt"`);
    await query(`ALTER TABLE "email_quota" DROP COLUMN IF EXISTS "updatedAt"`);
  },
};