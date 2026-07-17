module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // Subscribers: subscribedAt
    await query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "subscribedAt" TIMESTAMP WITH TIME ZONE`);

    // petitions: content
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT ''`);

    // links: description
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "description" TEXT`);

    // News: description (la tabla se llama "News", el modelo usa description)
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "description" TEXT`);

    // Reports: fileUrl
    await query(`ALTER TABLE "Reports" ADD COLUMN IF NOT EXISTS "fileUrl" VARCHAR(255)`);

    // Tabla Documents
    await query(`
      CREATE TABLE IF NOT EXISTS "Documents" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255),
        "description" TEXT,
        "fileUrl" VARCHAR(255),
        "type" VARCHAR(50),
        "campaignId" INTEGER REFERENCES "Campaigns"("id") ON DELETE SET NULL,
        "actionId" INTEGER REFERENCES "Actions"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Tabla BDS (Sequelize la pluraliza como "BDs", lo vemos en el error del log)
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
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    await query(`ALTER TABLE "Subscribers" DROP COLUMN IF EXISTS "subscribedAt"`);
    await query(`ALTER TABLE "petitions" DROP COLUMN IF EXISTS "content"`);
    await query(`ALTER TABLE "links" DROP COLUMN IF EXISTS "description"`);
    await query(`ALTER TABLE "News" DROP COLUMN IF EXISTS "description"`);
    await query(`ALTER TABLE "Reports" DROP COLUMN IF EXISTS "fileUrl"`);
    await query(`DROP TABLE IF EXISTS "Documents"`);
    await query(`DROP TABLE IF EXISTS "BDs"`);
  }
};