const { Sequelize } = require('sequelize');

async function run() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'lunaroja',
    password: process.env.DB_PASSWORD || 'lunaroja123',
    database: process.env.DB_NAME || 'lunaroja',
    logging: false,
  });

  // Helper idempotente: añade columna si no existe
  const addColumn = async (table, column, definition) => {
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${table}' AND column_name = '${column}'
        ) THEN
          ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};
        END IF;
      END
      $$;
    `);
  };

  try {
    // ─── 0. Crear tabla BDSs si no existe ──────────────────────
    // La migración inicial crea "BDs" (sin la S final), pero el modelo
    // BDS.js usa tableName: 'BDSs'. En jobs sin el step "Create BDSs
    // table directly", esto provoca ENOENT en los ALTER TABLE.
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "BDSs" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(255) DEFAULT '#ff0000',
        "imageUrl" VARCHAR(255),
        groups JSON DEFAULT '[]',
        "documentLink" VARCHAR(255),
        document VARCHAR(255),
        "privateLink" VARCHAR(500),
        visible BOOLEAN NOT NULL DEFAULT true,
        status VARCHAR(15) NOT NULL DEFAULT 'published',
        "processingError" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    // ─── 1. Actions ────────────────────────────────────────────
    await addColumn('Actions', 'imageUrl', 'VARCHAR(255)');
    await addColumn('Actions', 'galleryImages', "JSONB DEFAULT '[]'");
    await addColumn('Actions', 'status', "VARCHAR(15) NOT NULL DEFAULT 'published'");
    await addColumn('Actions', 'processingError', 'TEXT');
    await addColumn('Actions', 'privateLink', 'VARCHAR(500)');

    // ─── 2. Campaigns ──────────────────────────────────────────
    await addColumn('Campaigns', 'visible', 'BOOLEAN NOT NULL DEFAULT true');
    await addColumn('Campaigns', 'status', "VARCHAR(15) NOT NULL DEFAULT 'published'");
    await addColumn('Campaigns', 'processingError', 'TEXT');
    await addColumn('Campaigns', 'privateLink', 'VARCHAR(500)');

    // ─── 3. BDSs (creada por el workflow con CREATE TABLE IF NOT EXISTS) ─
    await addColumn('BDSs', 'visible', 'BOOLEAN NOT NULL DEFAULT true');
    await addColumn('BDSs', 'status', "VARCHAR(15) NOT NULL DEFAULT 'published'");
    await addColumn('BDSs', 'processingError', 'TEXT');
    await addColumn('BDSs', 'privateLink', 'VARCHAR(500)');

    // Constraint + índice DESPUÉS de asegurar que "status" existe
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE "BDSs" ADD CONSTRAINT "BDSs_status_check"
          CHECK (status IN ('processing', 'published', 'error'));
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_bdss_status" ON "BDSs"(status);`);

    // ─── 4. petitions ──────────────────────────────────────────
    await addColumn('petitions', 'email_template_id', 'INTEGER');
    await addColumn('petitions', 'email_subject', 'VARCHAR(255)');
    await addColumn('petitions', 'imageUrl', 'VARCHAR(255)');
    await addColumn('petitions', 'email_content_mode', "VARCHAR(10) NOT NULL DEFAULT 'rich'");
    await addColumn('petitions', 'description', 'TEXT');

    // ─── 5. EmailTemplates ─────────────────────────────────────
    await addColumn('EmailTemplates', 'titleColor', "VARCHAR(7) DEFAULT '#ffffff'");
    await addColumn('EmailTemplates', 'footerTitleColor', "VARCHAR(7) DEFAULT '#ffffff'");

    // ─── 6. ChatGroups ─────────────────────────────────────────
    await addColumn('ChatGroups', 'bdsId', 'INTEGER REFERENCES "BDSs"(id) ON UPDATE CASCADE ON DELETE SET NULL');

    // ─── 7. Reports ────────────────────────────────────────────
    await addColumn('Reports', 'bibliography', 'JSONB');

    // ─── 8. Documents (schema nuevo) ───────────────────────────
    await addColumn('Documents', 'source', "VARCHAR(10) NOT NULL DEFAULT 'upload'");
    await addColumn('Documents', 'filePath', 'VARCHAR(500)');
    await addColumn('Documents', 'externalUrl', 'VARCHAR(1000)');
    await addColumn('Documents', 'mimeType', 'VARCHAR(100)');
    await addColumn('Documents', 'fileSize', 'BIGINT');
    await addColumn('Documents', 'visibility', "VARCHAR(10) NOT NULL DEFAULT 'admin'");
    await addColumn('Documents', 'bdsId', 'INTEGER');
    await addColumn('Documents', 'reportId', 'INTEGER');
    await addColumn('Documents', 'uploadedBy', 'INTEGER');
    await addColumn('Documents', 'petitionId', 'UUID');

    // ─── 9. email_quota timestamps ─────────────────────────────
    await addColumn('email_quota', 'createdAt', 'TIMESTAMPTZ NOT NULL DEFAULT now()');
    await addColumn('email_quota', 'updatedAt', 'TIMESTAMPTZ NOT NULL DEFAULT now()');

    // ─── 10. SubscriberCampaigns (modelo: subscriberId, entityType, entityId, isFollowing) ─
    // El ENUM es requerido por el modelo (campaign | bds)
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_SubscriberCampaigns_entityType" AS ENUM('campaign', 'bds');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SubscriberCampaigns" (
        id SERIAL PRIMARY KEY,
        "subscriberId" INTEGER NOT NULL REFERENCES "Subscribers"(id) ON DELETE CASCADE,
        "entityType" "enum_SubscriberCampaigns_entityType" NOT NULL,
        "entityId" INTEGER NOT NULL,
        "isFollowing" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Por si la tabla ya existía con schema antiguo: añadir columnas que falten
    await addColumn('SubscriberCampaigns', 'entityType', 'VARCHAR(20)');
    await addColumn('SubscriberCampaigns', 'entityId', 'INTEGER');
    await addColumn('SubscriberCampaigns', 'isFollowing', 'BOOLEAN DEFAULT true');

    // Índice único (el modelo lo espera exactamente así)
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "subscriber_campaigns_subscriber_id_entity_type_entity_id"
      ON "SubscriberCampaigns" ("subscriberId", "entityType", "entityId");
    `);

    // ─── 11. SubscriberActions (modelo: subscriberId, actionId, isFollowing) ──
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SubscriberActions" (
        id SERIAL PRIMARY KEY,
        "subscriberId" INTEGER NOT NULL REFERENCES "Subscribers"(id) ON DELETE CASCADE,
        "actionId" INTEGER NOT NULL REFERENCES "Actions"(id) ON DELETE CASCADE,
        "isFollowing" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await addColumn('SubscriberActions', 'isFollowing', 'BOOLEAN DEFAULT true');

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "subscriber_actions_subscriber_id_action_id"
      ON "SubscriberActions" ("subscriberId", "actionId");
    `);

    // ─── 12. AdminAuditLogs ────────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "AdminAuditLogs" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        action VARCHAR(100),
        entity VARCHAR(100),
        "entityId" VARCHAR(100),
        details JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // ─── 13. colectivos_afines ─────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS colectivos_afines (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255),
        link VARCHAR(255) NOT NULL,
        "logoUrl" VARCHAR(255),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // ─── 13b. Repuntar FKs de BDs → BDSs ──────────────────────
    // La migración inicial crea "BDs" (sin S), pero el modelo BDS.js usa
    // tableName: 'BDSs'. Hay que apuntar las FKs a la tabla real.
    await sequelize.query(`ALTER TABLE "Actions" DROP CONSTRAINT IF EXISTS "Actions_bdsId_fkey";`);
    await sequelize.query(`ALTER TABLE "ChatGroups" DROP CONSTRAINT IF EXISTS "ChatGroups_bdsId_fkey";`);
    await sequelize.query(`ALTER TABLE "UserBDS" DROP CONSTRAINT IF EXISTS "UserBDS_bdsId_fkey";`);
    await sequelize.query(`ALTER TABLE "UserBDS" DROP CONSTRAINT IF EXISTS "UserBDS_bdsId_fkey1";`);
    await sequelize.query(`ALTER TABLE "Documents" DROP CONSTRAINT IF EXISTS "Documents_bdsId_fkey";`);
    await sequelize.query(`ALTER TABLE "SubscriberCampaigns" DROP CONSTRAINT IF EXISTS "SubscriberCampaigns_bdsId_fkey";`);

    await sequelize.query(`ALTER TABLE "Actions" ADD CONSTRAINT "Actions_bdsId_fkey" FOREIGN KEY ("bdsId") REFERENCES "BDSs"(id) ON UPDATE CASCADE ON DELETE SET NULL;`);
    await sequelize.query(`ALTER TABLE "ChatGroups" ADD CONSTRAINT "ChatGroups_bdsId_fkey" FOREIGN KEY ("bdsId") REFERENCES "BDSs"(id) ON UPDATE CASCADE ON DELETE SET NULL;`);
    await sequelize.query(`ALTER TABLE "UserBDS" ADD CONSTRAINT "UserBDS_bdsId_fkey" FOREIGN KEY ("bdsId") REFERENCES "BDSs"(id) ON UPDATE CASCADE ON DELETE CASCADE;`);

    // ─── 14. Ampliar enum EmailTemplates.associatedEvent ───────
    await sequelize.query(`ALTER TYPE "enum_EmailTemplates_associatedEvent" ADD VALUE IF NOT EXISTS 'subscriber_goodbye';`);
    await sequelize.query(`ALTER TYPE "enum_EmailTemplates_associatedEvent" ADD VALUE IF NOT EXISTS 'password_reset';`);
    await sequelize.query(`ALTER TYPE "enum_EmailTemplates_associatedEvent" ADD VALUE IF NOT EXISTS 'donation_available';`);
    await sequelize.query(`ALTER TYPE "enum_EmailTemplates_associatedEvent" ADD VALUE IF NOT EXISTS 'report_created';`);

    // ─── 15. Recrear AdminAuditLogs con el schema del modelo ───
    await sequelize.query(`DROP TABLE IF EXISTS "AdminAuditLogs" CASCADE;`);
    await sequelize.query(`
      CREATE TABLE "AdminAuditLogs" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        username VARCHAR(255),
        role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        "entityType" VARCHAR(50) NOT NULL,
        "entityId" VARCHAR(100),
        metadata JSONB DEFAULT '{}',
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "AdminAuditLogs"(action);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "AdminAuditLogs"("createdAt" DESC);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "AdminAuditLogs"("entityType", "entityId");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "AdminAuditLogs"("userId");`);

    // ─── Links: añadir columna region ─────────────────────────
    await sequelize.query(`ALTER TABLE links ADD COLUMN IF NOT EXISTS region VARCHAR(30);`);
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE links ADD CONSTRAINT links_region_check
          CHECK (region IS NULL OR region IN (
            'norteamerica','america_latina','africa',
            'asia_occidental','asia_meridional_oriental','oceania'
          ));
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // ─── Subscribers: publicId + unsubscribedAt ───────────────
    await sequelize.query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "publicId" VARCHAR(20);`);
    await sequelize.query(`ALTER TABLE "Subscribers" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMPTZ;`);
    await sequelize.query(`
      UPDATE "Subscribers"
      SET "publicId" = 'SR-' || LPAD(id::text, 5, '0')
      WHERE "publicId" IS NULL;
    `);
    await sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Subscribers_publicId_unique'
        ) THEN
          ALTER TABLE "Subscribers" ADD CONSTRAINT "Subscribers_publicId_unique" UNIQUE ("publicId");
        END IF;
      END $$;
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_status ON "Subscribers"(status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed_at ON "Subscribers"("subscribedAt");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribed_at ON "Subscribers"("unsubscribedAt");`);

    // ─── Donors: tabla nueva ───────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Donors" (
        id SERIAL PRIMARY KEY,
        "publicId" VARCHAR(20),
        "donorHash" VARCHAR(64) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        "campaignId" INTEGER REFERENCES "Campaigns"(id) ON DELETE SET NULL,
        "donatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE "Donors" ADD CONSTRAINT "Donors_status_check"
          CHECK (status IN ('pending', 'completed', 'refunded'));
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_donors_status ON "Donors"(status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_donors_campaign ON "Donors"("campaignId");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_donors_donated_at ON "Donors"("donatedAt");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_donors_donor_hash ON "Donors"("donorHash");`);

    // ─── News: newsType + campos article + internal ───────────
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_News_newsType" AS ENUM('youtube', 'article', 'internal');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "newsType" "enum_News_newsType" NOT NULL DEFAULT 'youtube';`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "externalUrl" VARCHAR(1000);`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "source" VARCHAR(100);`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "ogImage" VARCHAR(1000);`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "ogDescription" TEXT;`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "publishedAtSource" TIMESTAMPTZ;`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "scrapedAt" TIMESTAMPTZ;`);
    await sequelize.query(`ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "content" TEXT;`);

    // Hacer youtubeUrl nullable (antes era NOT NULL)
    await sequelize.query(`ALTER TABLE "News" ALTER COLUMN "youtubeUrl" DROP NOT NULL;`);

    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_news_type ON "News"("newsType");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_news_external_url ON "News"("externalUrl");`);

    console.log('✅ Schema parcheado correctamente.');
  } catch (error) {
    console.error('❌ Error al parchear schema:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
