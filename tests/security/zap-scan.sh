#!/bin/bash
# ============================================================
# OWASP ZAP — Análisis dinámico (DAST)
# Uso:
#   ./tests/security/zap-scan.sh                        # localhost:3000
#   TARGET=http://localhost:3000 ./tests/security/zap-scan.sh
#
# Variables:
#   TARGET=http://localhost:3000
#   OUTPUT_DIR=./security-reports
# ============================================================

set -euo pipefail

TARGET="${TARGET:-http://localhost:3000}"
OUTPUT_DIR="${OUTPUT_DIR:-./security-reports}"

mkdir -p "$OUTPUT_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  OWASP ZAP — Baseline Scan"
echo "═══════════════════════════════════════════════════════════════"
echo "  Target: $TARGET"
echo "  Salida: $OUTPUT_DIR"
echo ""

# Comprobar que el target responde
if ! curl -sSf "$TARGET" >/dev/null 2>&1; then
  echo "❌ El target $TARGET no responde."
  echo "   Asegúrate de que el frontend está corriendo:"
  echo "   → make up   (o docker compose up -d frontend)"
  exit 1
fi

# ZAP baseline scan
docker run --rm \
  --network host \
  -v "$(pwd)/$OUTPUT_DIR:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
    -t "$TARGET" \
    -r zap-report.html \
    -J zap-report.json \
    -w zap-report.md \
    -I || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Reportes generados:"
echo "     - $OUTPUT_DIR/zap-report.html  (abrir en navegador)"
echo "     - $OUTPUT_DIR/zap-report.json"
echo "     - $OUTPUT_DIR/zap-report.md"
echo "═══════════════════════════════════════════════════════════════"
