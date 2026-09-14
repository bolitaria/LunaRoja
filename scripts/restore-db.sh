#!/bin/bash
# Restaurar PostgreSQL desde un backup .sql
# Uso: ./scripts/restore-db.sh /backups/backup_YYYYMMDD_HHMMSS.sql

set -e

BACKUP_FILE="$1"
DB_CONTAINER="lunaroja_db"
DB_USER="lunaroja"
DB_NAME="lunaroja"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <archivo.sql>"
  echo ""
  echo "Backups disponibles:"
  ls -lh /backups/backup_*.sql 2>/dev/null | tail -5 || echo "  (ninguno)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ No existe: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  Vas a reemplazar la BD '$DB_NAME' con '$BACKUP_FILE'"
read -p "¿Continuar? (yes/no): " confirm
[ "$confirm" = "yes" ] || { echo "Cancelado"; exit 0; }

echo "→ Drop y recreate..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

echo "→ Restaurando..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

echo "✅ Restauración completa"
