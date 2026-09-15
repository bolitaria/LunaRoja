-- ═══════════════════════════════════════════════════════════════════
-- Schema changes 2026-09-15
-- ═══════════════════════════════════════════════════════════════════
-- `privateLink` — enlace externo a documentos privados.
-- Se añade en Actions, Campaigns y BDSs para homogeneidad entre
-- las tres entidades (todas tienen ya su "Enlace externo a
-- documentos privados" en la UI de admin).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE "Actions"   ADD COLUMN IF NOT EXISTS "privateLink" VARCHAR(500);
ALTER TABLE "Campaigns" ADD COLUMN IF NOT EXISTS "privateLink" VARCHAR(500);
ALTER TABLE "BDSs"      ADD COLUMN IF NOT EXISTS "privateLink" VARCHAR(500);
