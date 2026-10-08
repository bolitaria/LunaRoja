-- ============================================================
-- schema-changes-2026-09-14.sql
-- Reset de datos de prueba + nueva estructura de Documents
-- + status en Actions + bibliography en Reports
--
-- ⚠️ DESTRUCTIVO: borra todos los datos de prueba.
--    Solo preserva: Users (id=3 admin), EmailTemplates.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Reset de tablas con datos de prueba
-- ────────────────────────────────────────────────────────────
TRUNCATE TABLE
  "SubscriberActions",
  "SubscribersReminders",
  "SubscriberCampaigns",
  "UserActions",
  "UserCampaigns",
  "UserBDS",
  "ChatGroups",
  "News",
  "Reports",
  "BDSs",
  "Campaigns",
  "Actions",
  "Subscribers",
  colectivos_afines,
  links,
  email_queue,
  email_quota,
  "AdminAuditLogs",
  petitions,
  signature_hashes
RESTART IDENTITY CASCADE;

-- ────────────────────────────────────────────────────────────
-- 2. Usuarios: dejar solo superadmin id=3
-- ────────────────────────────────────────────────────────────
DELETE FROM "Users" WHERE id <> 3;

-- ────────────────────────────────────────────────────────────
-- 3. Documents: DROP + CREATE estructura nueva
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "Documents" CASCADE;
DROP TYPE IF EXISTS "enum_Documents_type" CASCADE;

CREATE TABLE "Documents" (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  source          VARCHAR(10)  NOT NULL CHECK (source IN ('upload','link')),
  "filePath"      VARCHAR(500),
  "externalUrl"   VARCHAR(1000),
  "mimeType"      VARCHAR(100),
  "fileSize"      BIGINT,
  visibility      VARCHAR(10)  NOT NULL DEFAULT 'admin' CHECK (visibility IN ('public','admin')),
  "actionId"      INTEGER REFERENCES "Actions"(id)   ON DELETE CASCADE,
  "campaignId"    INTEGER REFERENCES "Campaigns"(id) ON DELETE CASCADE,
  "bdsId"         INTEGER REFERENCES "BDSs"(id)      ON DELETE CASCADE,
  "reportId"      INTEGER REFERENCES "Reports"(id)   ON DELETE CASCADE,
  "uploadedBy"    INTEGER REFERENCES "Users"(id)     ON DELETE SET NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documents_one_parent CHECK (
    (CASE WHEN "actionId"   IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "campaignId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "bdsId"      IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "reportId"   IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  CONSTRAINT documents_source_consistency CHECK (
    (source = 'upload' AND "filePath"    IS NOT NULL AND "externalUrl" IS NULL) OR
    (source = 'link'   AND "externalUrl" IS NOT NULL AND "filePath"    IS NULL AND visibility = 'admin')
  )
);

CREATE INDEX idx_documents_action     ON "Documents"("actionId");
CREATE INDEX idx_documents_campaign   ON "Documents"("campaignId");
CREATE INDEX idx_documents_bds        ON "Documents"("bdsId");
CREATE INDEX idx_documents_report     ON "Documents"("reportId");
CREATE INDEX idx_documents_visibility ON "Documents"(visibility);

-- ────────────────────────────────────────────────────────────
-- 4. Actions: status + processingError + drop columnas viejas
-- ────────────────────────────────────────────────────────────
ALTER TABLE "Actions" ADD COLUMN status VARCHAR(15) NOT NULL DEFAULT 'published'
  CHECK (status IN ('processing','published','error'));
ALTER TABLE "Actions" ADD COLUMN "processingError" TEXT;

ALTER TABLE "Actions" DROP COLUMN IF EXISTS "featuredImage";
ALTER TABLE "Actions" DROP COLUMN IF EXISTS document;
ALTER TABLE "Actions" DROP COLUMN IF EXISTS "documentLink";

CREATE INDEX idx_actions_status ON "Actions"(status);

-- ────────────────────────────────────────────────────────────
-- 5. Reports: bibliography (JSONB array)
-- ────────────────────────────────────────────────────────────
ALTER TABLE "Reports" ADD COLUMN bibliography JSONB;

COMMIT;

-- ============================================================
-- FIN — Schema actualizado
-- ============================================================
