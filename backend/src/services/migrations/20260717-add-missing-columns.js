module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // Petitions: total_signatures, urgency
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "total_signatures" INTEGER DEFAULT 0`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "urgency" BOOLEAN DEFAULT false`);

    // Links: active
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true`);

    // email_quota: sent_count (la tabla ya puede existir, así que usamos ADD COLUMN)
    await query(`ALTER TABLE "email_quota" ADD COLUMN IF NOT EXISTS "sent_count" INTEGER DEFAULT 0`);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);
    await query(`ALTER TABLE "petitions" DROP COLUMN IF EXISTS "total_signatures"`);
    await query(`ALTER TABLE "petitions" DROP COLUMN IF EXISTS "urgency"`);
    await query(`ALTER TABLE "links" DROP COLUMN IF EXISTS "active"`);
    await query(`ALTER TABLE "email_quota" DROP COLUMN IF EXISTS "sent_count"`);
  },
};