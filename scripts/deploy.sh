#!/bin/bash
# Deploy de LunaRoja con Docker Compose (single-node)
# Uso: ./scripts/deploy.sh

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ No existe $ENV_FILE"
  echo "   Copia .env.prod.example → .env.prod y rellena los valores."
  exit 1
fi

echo "== 1/4 Construyendo imágenes =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo "== 2/4 Parando contenedores actuales =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo "== 3/4 Levantando stack =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "== 4/4 Estado =="
sleep 10
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "✅ Deploy completo"
echo "   Para monitoring: --profile monitoring"
echo "   Para tools:      --profile tools"
