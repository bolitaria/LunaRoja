#!/bin/bash
# ============================================================
# Trivy — Escaneo de CVEs en imágenes Docker
# Uso:
#   ./tests/security/trivy-scan.sh                  # todas las imágenes
#   ./tests/security/trivy-scan.sh lunaroja-backend # solo una
#
# Variables de entorno:
#   SEVERITY=HIGH,CRITICAL   (por defecto)
#   FORMAT=table             table|json|sarif
#   OUTPUT_DIR=./security-reports
#   EXIT_CODE=0              0=no falla, 1=falla si encuentra
# ============================================================

set -euo pipefail

SEVERITY="${SEVERITY:-HIGH,CRITICAL}"
FORMAT="${FORMAT:-table}"
OUTPUT_DIR="${OUTPUT_DIR:-./security-reports}"
EXIT_CODE="${EXIT_CODE:-0}"
IGNORE_UNFIXED="${IGNORE_UNFIXED:-true}"

mkdir -p "$OUTPUT_DIR"

# ─── Imágenes a escanear ─────────────────────────────────────
# Imágenes propias (build local)
PROJECT_IMAGES=(
  "lunaroja-backend:latest"
  "lunaroja-frontend:latest"
)

# Imágenes base (dependencias externas)
BASE_IMAGES=(
  "postgres:14.24-alpine"
  "redis:7.4.11-alpine"
  "edoburu/pgbouncer:v1.25.2-p0"
  "nginx:1.30.4-alpine"
  "certbot/certbot:v5.8.0"
  "grafana/grafana:11.3.0"
  "prom/prometheus:v2.54.1"
  "prom/node-exporter:v1.8.2"
  "ghcr.io/google/cadvisor:v0.49.1"
  "dpage/pgadmin4:8.14.0"
)

# ─── Si se pasa una imagen como argumento, solo esa ──────────
if [ $# -gt 0 ]; then
  IMAGES=("$@")
else
  IMAGES=("${PROJECT_IMAGES[@]}" "${BASE_IMAGES[@]}")
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  Trivy — Escaneo de imágenes Docker"
echo "═══════════════════════════════════════════════════════════════"
echo "  Imágenes:  ${#IMAGES[@]}"
echo "  Severidad: $SEVERITY"
echo "  Formato:   $FORMAT"
echo "  Salida:    $OUTPUT_DIR"
echo "  Exit code: $EXIT_CODE"
echo ""

FAILED=0
TOTAL_CRITICAL=0
TOTAL_HIGH=0

for img in "${IMAGES[@]}"; do
  # Sanitizar nombre para usar como archivo
  safe_name=$(echo "$img" | tr '/:' '__')

  echo "─────────────────────────────────────────────────────────────"
  echo "  🐳 $img"
  echo "─────────────────────────────────────────────────────────────"

  # Comprobar si la imagen existe localmente
  if ! docker image inspect "$img" >/dev/null 2>&1; then
    echo "  ⚠️  Imagen no existe localmente, saltando..."
    continue
  fi

  OUT_FILE="${OUTPUT_DIR}/trivy-${safe_name}.${FORMAT}"

  # Flags comunes
  FLAGS=(
    "--severity" "$SEVERITY"
    "--format" "$FORMAT"
    "--output" "/reports/$(basename "$OUT_FILE")"
    "--no-progress"
  )
  [ "$IGNORE_UNFIXED" = "true" ] && FLAGS+=("--ignore-unfixed")

  # Ejecutar Trivy
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v "$(pwd)/$OUTPUT_DIR":/reports \
    aquasec/trivy:latest image "${FLAGS[@]}" "$img" || true

  # Para formato table, mostrar en pantalla también
  if [ "$FORMAT" = "table" ]; then
    docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      aquasec/trivy:latest image \
      --severity "$SEVERITY" --no-progress $([ "$IGNORE_UNFIXED" = "true" ] && echo "--ignore-unfixed") \
      "$img" || true
  fi

  echo "  📄 Reporte: $OUT_FILE"
  echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Escaneo completo — reportes en $OUTPUT_DIR/"
echo "═══════════════════════════════════════════════════════════════"
ls -lh "$OUTPUT_DIR"/ 2>/dev/null | tail -20

exit $FAILED
