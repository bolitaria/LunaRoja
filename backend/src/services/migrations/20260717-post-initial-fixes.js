module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);

    // ---- Petitions ----
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_body_template" TEXT`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "email_template_id" INTEGER REFERENCES "EmailTemplates"("id")`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "featured_image" VARCHAR(255)`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE "petitions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW()`);

    // ---- Links ----
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) NOT NULL DEFAULT 'local'`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW()`);

    // ---- BDs ----
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

    // ---- Email Quota ----
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
    await query(`UPDATE "email_quota" SET "createdAt" = NOW() WHERE "createdAt" IS NULL`);
    await query(`UPDATE "email_quota" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL`);

    // ---- Documents ----
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

    // ---- Subscribers ----
    await query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "subscribedAt" TIMESTAMP WITH TIME ZONE`);

    // ---- News ----
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "youtubeUrl" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "thumbnail" VARCHAR(255)`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "isNews" BOOLEAN DEFAULT false`);

    // ---- Reports ----
    await query(`ALTER TABLE "Reports" ADD COLUMN IF NOT EXISTS "fileUrl" VARCHAR(255)`);
  },

  async down(queryInterface) {}
};
