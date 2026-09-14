#!/bin/bash
# Backup completo: BD + uploads
# Uso: ./scripts/backup-all.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BUNDLE_DIR="${BACKUP_DIR}/bundle_${TIMESTAMP}"

mkdir -p "$BUNDLE_DIR"

echo "→ Backup completo en ${BUNDLE_DIR}"

# 1. BD
echo "  [1/2] Base de datos..."
./scripts/backup-db.sh
mv "$(ls -t ${BACKUP_DIR}/backup_*.sql | head -1)" "$BUNDLE_DIR/"

# 2. Uploads (volumen Docker)
echo "  [2/2] Uploads..."
docker run --rm \
  -v lunaroja_uploads_data:/data:ro \
  -v "${BUNDLE_DIR}":/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .

echo ""
echo "✅ Bundle completo: $BUNDLE_DIR"
ls -lh "$BUNDLE_DIR"
