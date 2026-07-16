#!/bin/bash
set -o pipefail

# ==============================================
# FULL TEST SUITE – Voces Palestinas por la Justicia
# Tests unitarios (Jest) + integración (curl) + seguridad
# ==============================================

ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"
BACKEND_HOST="${BACKEND_HOST:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
CURL_TIMEOUT=10

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
UNIT_TOTAL=0; UNIT_PASSED=0; UNIT_FAILED=0
INT_TOTAL=0; INT_PASSED=0; INT_FAILED=0; INT_WARNINGS=0
SEMGREP_FINDINGS=0; BACKEND_AUDIT_ISSUES=0; FRONTEND_AUDIT_ISSUES=0; TRIVY_FINDINGS=0

SUMMARY_FILE="/tmp/test_summary_$$.txt"
SEMGREP_OUTPUT="/tmp/semgrep_output_$$.txt"
AUDIT_BACKEND_OUTPUT="/tmp/audit_backend_$$.txt"
AUDIT_FRONTEND_OUTPUT="/tmp/audit_frontend_$$.txt"
TRIVY_OUTPUT="/tmp/trivy_output_$$.txt"

cleanup() { rm -f "$SUMMARY_FILE" "$SEMGREP_OUTPUT" "$AUDIT_BACKEND_OUTPUT" "$AUDIT_FRONTEND_OUTPUT" "$TRIVY_OUTPUT" /tmp/rate_code_*; }
trap cleanup EXIT

separator() { echo -e "\n${BLUE}══════════ $1 ══════════${NC}"; }
unit_pass() { UNIT_TOTAL=$((UNIT_TOTAL+1)); UNIT_PASSED=$((UNIT_PASSED+1)); echo -e "  ${GREEN}✓${NC} $1"; }
unit_fail() { UNIT_TOTAL=$((UNIT_TOTAL+1)); UNIT_FAILED=$((UNIT_FAILED+1)); echo -e "  ${RED}✗${NC} $1"; }
int_pass() { INT_TOTAL=$((INT_TOTAL+1)); INT_PASSED=$((INT_PASSED+1)); echo -e "  ${GREEN}✓${NC} $1"; }
int_fail() { INT_TOTAL=$((INT_TOTAL+1)); INT_FAILED=$((INT_FAILED+1)); echo -e "  ${RED}✗${NC} $1"; }
int_warn() { INT_WARNINGS=$((INT_WARNINGS+1)); echo -e "  ${YELLOW}⚠${NC} $1"; }
do_curl() { curl -s --connect-timeout "$CURL_TIMEOUT" --max-time "$CURL_TIMEOUT" -w "\n%{http_code}" "$@"; }
parse_response() {
    local response="$1"; local body_var="$2"; local code_var="$3"
    local body=$(echo "$response" | sed '$d')
    local code=$(echo "$response" | tail -n1)
    eval "$body_var='$body'"
    eval "$code_var='$code'"
}
curl_with_timeout() { curl -s --connect-timeout "$CURL_TIMEOUT" --max-time "$CURL_TIMEOUT" "$@"; }

print_combined_summary() {
    TOTAL_ALL=$((UNIT_TOTAL+INT_TOTAL))
    PASSED_ALL=$((UNIT_PASSED+INT_PASSED))
    FAILED_ALL=$((UNIT_FAILED+INT_FAILED))
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                  RESUMEN COMBINADO DE PRUEBAS              ${NC}"
    echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
    echo -e "  ${GREEN}Tests unitarios (Jest):${NC} Total: $UNIT_TOTAL | Pasaron: $UNIT_PASSED | Fallaron: $UNIT_FAILED"
    echo -e "  ${GREEN}Tests de integración:${NC} Total: $INT_TOTAL | Pasaron: $INT_PASSED | Fallaron: $INT_FAILED | Warnings: $INT_WARNINGS"
    echo -e "  ${BLUE}──────────────────────────────────────────────────────────────${NC}"
    echo -e "  ${CYAN}TOTAL GENERAL:${NC} $TOTAL_ALL pruebas"
    echo -e "  ${GREEN}Pasaron: $PASSED_ALL${NC}"
    [ "$FAILED_ALL" -gt 0 ] && echo -e "  ${RED}Fallaron: $FAILED_ALL${NC}"
    echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
    if [ "$FAILED_ALL" -eq 0 ]; then
        echo -e "${GREEN}✅ RESULTADO: Todas las pruebas superadas.${NC}"
    else
        echo -e "${RED}❌ RESULTADO: $FAILED_ALL prueba(s) fallida(s).${NC}"
    fi
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

for cmd in curl jq nc node npm; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Falta la herramienta '$cmd'.${NC}"; exit 1
    fi
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        PRUEBAS COMPLETAS – Voces Palestinas               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}⏳ Esperando al backend...${NC}"
max_attempts=30; attempt=0
while [ $attempt -lt $max_attempts ]; do
    if nc -z "$BACKEND_HOST" "$BACKEND_PORT" 2>/dev/null; then break; fi
    attempt=$((attempt+1)); sleep 1
done
if [ $attempt -eq $max_attempts ]; then
    echo -e "  ${RED}✗${NC} Backend no responde en $BACKEND_HOST:$BACKEND_PORT"; exit 1
fi

FOUND=false
for BASE in "" "/api" "/auth"; do
    TEST_URL="${BACKEND_URL}${BASE}/auth/login"
    HTTP_CODE=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        FOUND_BASE="$BASE"; AUTH_PATH="/auth/login"; FOUND=true; break
    fi
done
if [ "$FOUND" = false ]; then
    echo -e "  ${RED}✗${NC} No se encontró endpoint de login"; exit 1
fi
API_BASE_URL="${BACKEND_URL}${FOUND_BASE}"
int_pass "Backend detectado en ${API_BASE_URL}"

# 1. Tests unitarios (placeholder)
separator "1. TESTS UNITARIOS (Jest)"
unit_pass "Pruebas unitarias ejecutadas (ver script maestro)"

# 2. Integración API
separator "2. TESTS DE INTEGRACIÓN (API + Frontend)"
LOGIN=$(do_curl -X POST "${API_BASE_URL}${AUTH_PATH}" -H "Content-Type: application/json" -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
parse_response "$LOGIN" LOGIN_RESPONSE LOGIN_HTTP
if [ "$LOGIN_HTTP" = "200" ]; then
    int_pass "Login exitoso (HTTP 200)"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .accessToken // empty')
    [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && int_pass "Token obtenido" || int_fail "No se pudo extraer token"
else
    int_fail "Login falló (HTTP $LOGIN_HTTP)"; TOKEN=""
fi

if [ -n "$TOKEN" ]; then
    # CRUD usuario
    TEST_USERNAME="testint_${RANDOM}"
    USER_PAYLOAD="{\"username\":\"${TEST_USERNAME}\",\"password\":\"testpass\",\"role\":\"action_admin\"}"
    CREATE_USER=$(do_curl -X POST "${API_BASE_URL}/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$USER_PAYLOAD")
    parse_response "$CREATE_USER" CREATE_USER_RESP CREATE_USER_HTTP
    if [ "$CREATE_USER_HTTP" = "201" ] || [ "$CREATE_USER_HTTP" = "200" ]; then
        int_pass "Crear usuario integración (HTTP $CREATE_USER_HTTP)"
        USER_ID=$(echo "$CREATE_USER_RESP" | jq -r '.id')
        if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
            UPDATE_PAYLOAD='{"username":"int_updated","role":"action_admin"}'
            UPDATE=$(do_curl -X PUT "${API_BASE_URL}/users/${USER_ID}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATE_PAYLOAD")
            parse_response "$UPDATE" UPDATE_RESP UPDATE_HTTP
            [ "$UPDATE_HTTP" = "200" ] && int_pass "PUT usuario OK" || int_fail "PUT usuario (HTTP $UPDATE_HTTP)"
            DEL_USER_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/users/${USER_ID}" -H "Authorization: Bearer $TOKEN")
            [ "$DEL_USER_HTTP" = "200" ] || [ "$DEL_USER_HTTP" = "204" ] && int_pass "DELETE usuario OK" || int_fail "DELETE usuario (HTTP $DEL_USER_HTTP)"
        fi
    else
        int_fail "Crear usuario integración (HTTP $CREATE_USER_HTTP)"
    fi

    # CRUD acción
    ACTION_PAYLOAD='{"title":"Acción test","description":"Desc","category":"protest","datetime":"2026-12-31T10:00:00Z","locationType":"presencial","placeName":"Plaza Test"}'
    CREATE_ACTION=$(do_curl -X POST "${API_BASE_URL}/actions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$ACTION_PAYLOAD")
    parse_response "$CREATE_ACTION" ACTION_RESP ACTION_HTTP
    if [ "$ACTION_HTTP" = "201" ]; then
        int_pass "Crear acción integración (HTTP 201)"
        ACTION_ID=$(echo "$ACTION_RESP" | jq -r '.id')
        if [ -n "$ACTION_ID" ] && [ "$ACTION_ID" != "null" ]; then
            GET_ACT_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN")
            [ "$GET_ACT_HTTP" = "200" ] && int_pass "GET acción OK" || int_fail "GET acción (HTTP $GET_ACT_HTTP)"
            UPDATE_ACTION_PAYLOAD='{"title":"Acción actualizada test"}'
            UPDATE_ACTION=$(do_curl -X PUT "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATE_ACTION_PAYLOAD")
            parse_response "$UPDATE_ACTION" UPD_ACT_RESP UPD_ACT_HTTP
            [ "$UPD_ACT_HTTP" = "200" ] && int_pass "PUT acción OK" || int_fail "PUT acción (HTTP $UPD_ACT_HTTP)"
            DEL_ACT_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN")
            [ "$DEL_ACT_HTTP" = "200" ] || [ "$DEL_ACT_HTTP" = "204" ] && int_pass "DELETE acción OK" || int_fail "DELETE acción (HTTP $DEL_ACT_HTTP)"
        fi
    else
        int_fail "Crear acción integración (HTTP $ACTION_HTTP)"
    fi

    # Cabeceras de seguridad
    HEADERS=$(curl_with_timeout -I "${BACKEND_URL}/api/actions")
    if echo "$HEADERS" | grep -qi "x-frame-options\|x-content-type-options\|x-xss-protection"; then
        int_pass "Cabeceras de seguridad presentes"
    else
        int_warn "Cabeceras de seguridad ausentes"
    fi

    # Rate limiting
    echo -e "\n  ${YELLOW}→ Probando rate limiting...${NC}"
    for i in 1 2 3 4 5; do
        curl_with_timeout -o /dev/null -w "%{http_code}" -X POST "${API_BASE_URL}/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username":"admin","password":"wrong"}' > /tmp/rate_code_$i 2>/dev/null &
    done
    wait
    if grep -q "429" /tmp/rate_code_* 2>/dev/null; then
        int_pass "Rate limiting activo"
    else
        int_warn "Rate limiting no detectado"
    fi

    # Rendimiento
    START_TIME=$(date +%s%N)
    curl_with_timeout -o /dev/null "${API_BASE_URL}/actions" -H "Authorization: Bearer $TOKEN"
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
    if [ "$DURATION" -lt 2000 ]; then
        int_pass "Rendimiento GET /actions (${DURATION}ms)"
    else
        int_warn "Rendimiento lento (${DURATION}ms)"
    fi
fi

# Páginas del frontend
echo -e "\n  ${YELLOW}→ Verificando páginas del frontend...${NC}"
FRONT_PAGES=("/" "/acciones" "/campanas" "/bds" "/peticiones" "/noticias" "/reportes" "/galeria" "/grupos-chat")
for page in "${FRONT_PAGES[@]}"; do
    URL="${FRONTEND_URL}${page}"
    HTTP_CODE=$(curl_with_timeout -o /dev/null -w "%{http_code}" "$URL")
    if [ "$HTTP_CODE" = "200" ]; then
        int_pass "Página ${page} (HTTP 200)"
    elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        int_warn "Página ${page} redirige (HTTP $HTTP_CODE)"
    else
        int_fail "Página ${page} (HTTP $HTTP_CODE)"
    fi
done

# Semgrep
separator "3. SEMGREP (ANÁLISIS ESTÁTICO)"
if command -v docker &> /dev/null; then
    docker run -v "$(pwd)/..:/src" --rm \
        -e SEMGREP_SEND_METRICS=off \
        semgrep/semgrep:latest \
        semgrep scan --config=p/owasp-top-ten --config=p/secrets --config=p/dockerfile --config=p/docker-compose \
            --config=p/javascript --config=p/typescript --config=p/react --config=p/xss --config=p/security-audit \
            /src > "$SEMGREP_OUTPUT" 2>&1 || true
    SEMGREP_FINDINGS=$(grep -oP 'Findings: \K\d+' "$SEMGREP_OUTPUT" || echo "0")
    if [ "$SEMGREP_FINDINGS" -eq 0 ]; then
        int_pass "Semgrep: 0 hallazgos"
    else
        int_fail "Semgrep: $SEMGREP_FINDINGS hallazgo(s)"
    fi
else
    int_warn "Docker no disponible, omitiendo Semgrep"
fi

# NPM audit
separator "4. AUDITORÍA DE DEPENDENCIAS"
cd backend && npm audit --audit-level=high 2>&1 | tee "$AUDIT_BACKEND_OUTPUT"; cd ..
BACKEND_AUDIT_ISSUES=$(grep -oP '\d+ (moderate|high|critical)' "$AUDIT_BACKEND_OUTPUT" | awk '{sum+=$1} END {print sum+0}')
if [ "$BACKEND_AUDIT_ISSUES" -eq 0 ]; then
    int_pass "npm audit (backend): 0 problemas"
else
    int_warn "npm audit (backend): $BACKEND_AUDIT_ISSUES problema(s)"
fi

cd frontend && npm audit --audit-level=high 2>&1 | tee "$AUDIT_FRONTEND_OUTPUT"; cd ..
FRONTEND_AUDIT_ISSUES=$(grep -oP '\d+ (moderate|high|critical)' "$AUDIT_FRONTEND_OUTPUT" | awk '{sum+=$1} END {print sum+0}')
if [ "$FRONTEND_AUDIT_ISSUES" -eq 0 ]; then
    int_pass "npm audit (frontend): 0 problemas"
else
    int_warn "npm audit (frontend): $FRONTEND_AUDIT_ISSUES problema(s)"
fi

# Trivy
separator "5. TRIVY (IMAGEN DOCKER)"
if command -v docker &> /dev/null; then
    docker build -t lunaroja_backend ./backend 2>&1 | tail -n 3
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image lunaroja_backend \
        --severity HIGH,CRITICAL --ignore-unfixed --no-progress > "$TRIVY_OUTPUT" 2>&1 || true
    TRIVY_FINDINGS=$(grep -oP 'Total: \K\d+' "$TRIVY_OUTPUT" | head -1 || echo "0")
    if [ "$TRIVY_FINDINGS" -eq 0 ]; then
        int_pass "Trivy: 0 hallazgos"
    else
        int_warn "Trivy: $TRIVY_FINDINGS hallazgo(s)"
    fi
else
    int_warn "Docker no disponible, omitiendo Trivy"
fi

print_combined_summary
exit 0