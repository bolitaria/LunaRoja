module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // Subscribers
    await query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "subscribedAt" TIMESTAMP WITH TIME ZONE`);

    // Petitions (todas las columnas)
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT ''`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "target_emails" TEXT[] DEFAULT '{}'`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "type" VARCHAR(50) DEFAULT 'custom'`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "total_signatures" INTEGER DEFAULT 0`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "urgency" BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "signature_fields" JSONB DEFAULT '[]'`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP WITH TIME ZONE`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);

    // Links
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) NOT NULL DEFAULT 'local'`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

    // News
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "youtubeUrl" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "thumbnail" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "isNews" BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "campaignId" INTEGER REFERENCES "Campaigns"("id")`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "actionId" INTEGER REFERENCES "Actions"("id")`);

    // Reports
    await query(`ALTER TABLE "Reports" ADD COLUMN IF NOT EXISTS "fileUrl" VARCHAR(255)`);

    // Documents (tabla)
    await query(`CREATE TABLE IF NOT EXISTS "Documents" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR(255),
      "description" TEXT,
      "fileUrl" VARCHAR(255),
      "type" VARCHAR(50),
      "campaignId" INTEGER REFERENCES "Campaigns"("id") ON DELETE SET NULL,
      "actionId" INTEGER REFERENCES "Actions"("id") ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`);

    // BDS
    await query(`CREATE TABLE IF NOT EXISTS "BDs" (
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
    )`);

    // Email Quota
    await query(`CREATE TABLE IF NOT EXISTS "email_quota" (
      "date" DATE PRIMARY KEY,
      "sent_count" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);
    // No se implementa down para evitar pérdida de datos accidentales
  }
};
