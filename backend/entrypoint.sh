#!/bin/sh
set -e

# ────────────────────────────────────────────────────────────
# Crear estructura de directorios de uploads
#  - tmp/:        ficheros temporales de multer (pendientes de procesar por el worker)
#  - actions/, campaigns/, bds/, petitions/, colectivos/, reports/:
#                 carpetas raíz por entidad. Los subdirectorios por ID
#                 (/uploads/actions/42/) los crea storageService on-demand.
# ────────────────────────────────────────────────────────────
mkdir -p /app/uploads/tmp \
         /app/uploads/actions \
         /app/uploads/campaigns \
         /app/uploads/bds \
         /app/uploads/petitions \
         /app/uploads/colectivos \
         /app/uploads/reports

chown -R nodejs:nodejs /app/uploads
chmod -R 755 /app/uploads

# ────────────────────────────────────────────────────────────
# Arranque
# Si no vienen argumentos (backend por defecto), ejecuta app.js.
# Si vienen (worker → "node src/worker.js"), respeta el comando.
# ────────────────────────────────────────────────────────────
if [ $# -eq 0 ]; then
  exec node src/app.js
fi

exec "$@"
