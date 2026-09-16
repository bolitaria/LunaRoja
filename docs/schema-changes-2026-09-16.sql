-- ═══════════════════════════════════════════════════════════════════
-- Schema changes 2026-09-16
-- ═══════════════════════════════════════════════════════════════════
-- Limpieza: eliminar columnas de personalización de color del email.
-- Decisión de producto: la plantilla usa paleta institucional fija
-- (rojo/verde/negro de la bandera). No se permite customización.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE petitions
  DROP COLUMN IF EXISTS header_color,
  DROP COLUMN IF EXISTS title_color,
  DROP COLUMN IF EXISTS footer_color,
  DROP COLUMN IF EXISTS footer_title_color,
  DROP COLUMN IF EXISTS button_color,
  DROP COLUMN IF EXISTS background_color;

-- ─────────────────────────────────────────────────────────────────
-- Limpieza adicional: columnas de color de EmailTemplates
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "EmailTemplates"
  DROP COLUMN IF EXISTS "headerColor",
  DROP COLUMN IF EXISTS "buttonColor",
  DROP COLUMN IF EXISTS "footerColor",
  DROP COLUMN IF EXISTS "backgroundColor",
  DROP COLUMN IF EXISTS "titleColor",
  DROP COLUMN IF EXISTS "footerTitleColor";
