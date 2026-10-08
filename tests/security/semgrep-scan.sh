#!/bin/bash
# ============================================================
# Semgrep — Análisis estático (SAST)
# Uso:
#   ./tests/security/semgrep-scan.sh
#
# Variables:
#   OUTPUT_DIR=./security-reports
#   CONFIGS="p/owasp-top-ten p/secrets p/dockerfile p/javascript p/nodejs"
# ============================================================

set -euo pipefail

OUTPUT_DIR="${OUTPUT_DIR:-./security-reports}"
CONFIGS="${CONFIGS:-p/owasp-top-ten p/secrets p/dockerfile p/javascript p/nodejs}"

mkdir -p "$OUTPUT_DIR"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "═══════════════════════════════════════════════════════════════"
echo "  Semgrep — Análisis estático"
echo "═══════════════════════════════════════════════════════════════"
echo "  Repo:    $REPO_ROOT"
echo "  Configs: $CONFIGS"
echo "  Salida:  $OUTPUT_DIR"
echo ""

# Flags --config
CONFIG_FLAGS=""
for cfg in $CONFIGS; do
  CONFIG_FLAGS="$CONFIG_FLAGS --config=$cfg"
done

# Exclusiones
EXCLUDES=(
  "--exclude=node_modules"
  "--exclude=coverage"
  "--exclude=dist"
  "--exclude=build"
  "--exclude=.next"
  "--exclude=cypress/screenshots"
  "--exclude=test-results"
  "--exclude=tests/fixtures"
  "--exclude=frontend/public"
  "--exclude=backend/uploads"
  "--exclude=env"
  "--exclude=security-reports"
)

# Helper para invocar Semgrep
run_semgrep() {
  docker run --rm \
    -v "$REPO_ROOT:/src:ro" \
    -v "$OUTPUT_DIR:/reports" \
    -e SEMGREP_SEND_METRICS=off \
    semgrep/semgrep:latest \
    semgrep scan \
      $CONFIG_FLAGS \
      "${EXCLUDES[@]}" \
      "$@" \
      /src || true
}

echo "── 1/3 Reporte en consola ──"
run_semgrep

echo ""
echo "── 2/3 SARIF (GitHub Security) ──"
run_semgrep --sarif --output=/reports/semgrep.sarif

echo ""
echo "── 3/3 JSON ──"
run_semgrep --json --output=/reports/semgrep.json

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Reportes generados:"
echo "     - $OUTPUT_DIR/semgrep.sarif  (GitHub Security)"
echo "     - $OUTPUT_DIR/semgrep.json   (JSON)"
echo "═══════════════════════════════════════════════════════════════"
