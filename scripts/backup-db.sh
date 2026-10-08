#!/bin/bash
set -e

# ==============================================
# Backup automático de PostgreSQL para LunaRoja
# ==============================================

BACKUP_DIR="/backups"
DB_CONTAINER="lunaroja_db"
DB_USER="lunaroja"
DB_NAME="lunaroja"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${TIMESTAMP}.sql"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

echo "📦 Iniciando backup de PostgreSQL..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$FILENAME"
echo "✅ Backup creado: $FILENAME"

# Limpiar backups antiguos
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$RETENTION_DAYS -delete
echo "🗑️ Backups con más de $RETENTION_DAYS días eliminados."

# Opcional: subir a almacenamiento externo (S3, B2, etc.)
# Descomenta y configura según tu proveedor
# aws s3 cp "$BACKUP_DIR/$FILENAME" s3://tu-bucket/backups/ || true

echo "🎉 Backup completado."