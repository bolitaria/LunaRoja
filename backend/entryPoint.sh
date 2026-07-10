#!/bin/sh
set -e

# Crear directorios de uploads con permisos adecuados
mkdir -p /app/uploads/featured /app/uploads/images /app/uploads/documents /app/uploads/petitions

# Asignar propietario y permisos al usuario nodejs
chown -R nodejs:nodejs /app/uploads
chmod -R 755 /app/uploads

# Cambiar al usuario nodejs y ejecutar la aplicación
exec su - nodejs -c "node src/app.js"