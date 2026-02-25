#!/bin/bash
echo "=== Verificando backend ==="
cd backend
npm list --depth=0 || exit 1
echo "=== Verificando sintaxis backend ==="
find src -name "*.js" -exec node --check {} \; || exit 1
cd ../frontend
echo "=== Verificando frontend ==="
npm list --depth=0 || exit 1
echo "=== Verificando sintaxis frontend ==="
find src -name "*.js" -exec node --check {} \; || exit 1
cd ..
echo "=== Verificando contenedores Docker ==="
docker-compose ps
echo "=== Logs del backend (últimas 10 líneas) ==="
docker-compose logs --tail=10 backend
echo "=== Logs del frontend (últimas 10 líneas) ==="
docker-compose logs --tail=10 frontend
echo "=== Prueba de endpoints ==="
curl -s http://localhost:5000/api | jq . 2>/dev/null || echo "Backend no responde"
curl -s -I http://localhost:3000 | head -n 1