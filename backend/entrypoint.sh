#!/bin/sh
# Crear directorios de uploads y asignar permisos
mkdir -p /app/uploads/featured /app/uploads/images /app/uploads/documents /app/uploads/petitions
chown -R nodejs:nodejs /app/uploads
chmod -R 755 /app/uploads

# Ejecutar la aplicación
exec node src/app.js