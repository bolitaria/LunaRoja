#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

NETWORK_NAME="lunaroja_network"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        PRUEBAS DE PRE‑PRODUCCIÓN – Voces Palestinas        ║"
echo "╚══════════════════════════════════════════════════════════════╝"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
check_result() {
    if [ $1 -eq 0 ]; then echo -e "${GREEN}✅ $2${NC}"; else echo -e "${RED}❌ $2 (código $1)${NC}"; fi
}

# Detectar comando de Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ No se encontró 'docker compose' ni 'docker-compose'.${NC}"
    exit 1
fi

# Levantar todos los servicios necesarios (incluidos los de test)
echo -e "\n${YELLOW}⏳ Levantando servicios (Postgres, Redis, etc.)...${NC}"
$DOCKER_COMPOSE up -d --build
echo -e "${GREEN}✔ Servicios levantados.${NC}"

# Esperar a que PostgreSQL esté sano
echo -e "${YELLOW}⏳ Esperando a que PostgreSQL esté listo...${NC}"
until docker exec $($DOCKER_COMPOSE ps -q postgres) pg_isready -U lunaroja; do sleep 2; done

# 1. Backend unit tests (usando el servicio backend-tests del compose)
echo -e "\n${YELLOW}🔹 1. Pruebas unitarias (Backend)${NC}"
$DOCKER_COMPOSE run --rm backend-tests
check_result $? "Backend unit tests"

# 2. Frontend unit tests (contenedor temporal, igual que antes)
echo -e "\n${YELLOW}🔹 2. Pruebas unitarias (Frontend)${NC}"
docker run --rm \
    -v "$ROOT_DIR/frontend":/app \
    -w /app \
    node:22-slim \
    sh -c "npm ci && npx jest --config jest.config.js --passWithNoTests"
check_result $? "Frontend unit tests"

# 3. Integración (API + frontend) usando full_test.sh
echo -e "\n${YELLOW}🔹 3. Integración (API + frontend)${NC}"
bash tests/integration/full_test.sh
check_result $? "Integración"

# 4. E2E (Cypress) – usando el servicio frontend-tests del compose
echo -e "\n${YELLOW}🔹 4. Pruebas E2E (Cypress)${NC}"
$DOCKER_COMPOSE run --rm frontend-tests
check_result $? "E2E"

# 5. Carga (Artillery) – red correcta y apuntando a backend:5000
echo -e "\n${YELLOW}🔹 5. Prueba de carga (Artillery)${NC}"
docker run --rm \
    -v "$ROOT_DIR/tests/load":/app \
    -w /app \
    --network "$NETWORK_NAME" \
    artilleryio/artillery:latest \
    run load-test.yml
check_result $? "Carga"

# 6. OWASP ZAP
echo -e "\n${YELLOW}🔹 6. Escaneo dinámico (OWASP ZAP)${NC}"
bash tests/security/zap-scan.sh
check_result $? "OWASP ZAP"

# 7. Lighthouse CI
echo -e "\n${YELLOW}🔹 7. Lighthouse CI${NC}"
docker run --rm \
    -v "$ROOT_DIR/frontend":/app \
    -v "$ROOT_DIR/tests/lighthouse":/lighthouse \
    -w /app \
    node:22-slim \
    sh -c "npm ci && npm install --no-save @lhci/cli && npx lhci autorun --config=/lighthouse/lighthouserc.json || true"
check_result $? "Lighthouse"

# 8. Semgrep
echo -e "\n${YELLOW}🔹 8. Semgrep${NC}"
bash tests/security/semgrep-scan.sh
check_result $? "Semgrep"

# 9. Trivy
echo -e "\n${YELLOW}🔹 9. Trivy${NC}"
bash tests/security/trivy-scan.sh
check_result $? "Trivy"

echo -e "\n${GREEN}✅ Suite de pre‑producción completada.${NC}"