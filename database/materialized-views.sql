-- Vista materializada de métricas de peticiones
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_petition_metrics AS
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE urgency = true)::int AS urgent,
  COUNT(*) FILTER (WHERE type = 'official')::int AS official,
  COUNT(*) FILTER (WHERE hidden = false)::int AS public_count,
  COALESCE(SUM(total_signatures), 0)::bigint AS total_signatures
FROM petitions;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_petition_metrics ON mv_petition_metrics ((true));

-- Refrescar la primera vez
REFRESH MATERIALIZED VIEW mv_petition_metrics;
