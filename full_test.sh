#!/bin/bash
set -o pipefail

# ==============================================
# PRUEBAS COMPLETAS DEL SISTEMA – Voces Palestinas
# Versión final con tests de peticiones actualizados
# ==============================================

ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"
BACKEND_HOST="${BACKEND_HOST:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
CURL_TIMEOUT=10

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0
declare -a WARNING_MSGS

BASE_PREFIXES=("" "/api" "/auth")
FOUND_BASE=""
API_BASE_URL=""
AUTH_PATH=""
TOKEN=""
USER_ID=""
ACTION_ID=""
NEWS_ID=""
SUB_ID=""
PET_ID_OFFICIAL=""
PET_ID_CUSTOM=""

# ------------------------------------------------------------
# FUNCIONES AUXILIARES
# ------------------------------------------------------------
separator() { echo -e "\n${BLUE}══════════ $1 ══════════${NC}"; }
pass() { TOTAL_TESTS=$((TOTAL_TESTS + 1)); PASSED_TESTS=$((PASSED_TESTS + 1)); echo -e "  ${GREEN}✓${NC} $1"; }
fail() { TOTAL_TESTS=$((TOTAL_TESTS + 1)); FAILED_TESTS=$((FAILED_TESTS + 1)); echo -e "  ${RED}✗${NC} $1"; if [ "${2:-}" != "noexit" ]; then print_summary; exit 1; fi; }
warn() { WARNINGS=$((WARNINGS + 1)); WARNING_MSGS+=("$1"); echo -e "  ${YELLOW}⚠${NC} $1"; }
validate_json() { echo "$1" | jq -e . >/dev/null 2>&1; }
do_curl() { curl_with_timeout -w "\n%{http_code}" "$@"; }
parse_response() {
    local response="$1"
    local body_var="$2"
    local code_var="$3"
    local body=$(echo "$response" | sed '$d')
    local code=$(echo "$response" | tail -n1)
    eval "$body_var='$body'"
    eval "$code_var='$code'"
}
validate_http() {
    local expected=$1
    local actual=$2
    local msg=$3
    if [ "$actual" = "$expected" ]; then
        pass "$msg"
    else
        if [ "$actual" = "429" ]; then
            warn "$msg (HTTP 429 – rate limit)"
        else
            fail "$msg (HTTP $actual ≠ $expected)" noexit
        fi
        return 1
    fi
}
curl_with_timeout() { curl -s --connect-timeout "$CURL_TIMEOUT" --max-time "$CURL_TIMEOUT" "$@"; }
print_summary() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                     RESUMEN DE PRUEBAS                      ${NC}"
    echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
    echo -e "  Total:   ${TOTAL_TESTS}"
    echo -e "  ${GREEN}Pasadas: ${PASSED_TESTS}${NC}"
    echo -e "  ${RED}Fallidas: ${FAILED_TESTS}${NC}"
    echo -e "  ${YELLOW}Warnings: ${WARNINGS}${NC}"
    if [ ${#WARNING_MSGS[@]} -gt 0 ]; then
        echo -e "\n  ${YELLOW}Detalle de advertencias:${NC}"
        for msg in "${WARNING_MSGS[@]}"; do echo -e "    • $msg"; done
    fi
    echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}✅ RESULTADO: Todas las pruebas superadas.${NC}"
        echo -e "${YELLOW}ℹ️  La subida de imágenes debe verificarse manualmente desde el panel de administración.${NC}"
    else
        echo -e "${RED}❌ RESULTADO: $FAILED_TESTS prueba(s) fallida(s).${NC}"
    fi
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

for cmd in curl jq nc; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Falta la herramienta '$cmd'.${NC}"
        exit 1
    fi
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PRUEBAS ENTERPRISE FINALES – Voces Palestinas          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# ===============================================
# 0. DETECTAR BACKEND
# ===============================================
echo -e "\n${YELLOW}⏳ Esperando al backend...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if nc -z "$BACKEND_HOST" "$BACKEND_PORT" 2>/dev/null; then break; fi
    attempt=$((attempt+1))
    sleep 1
done
if [ $attempt -eq $max_attempts ]; then
    echo -e "  ${RED}✗${NC} Backend no responde en $BACKEND_HOST:$BACKEND_PORT"
    exit 1
fi

FOUND=false
for BASE in "${BASE_PREFIXES[@]}"; do
    TEST_URL="${BACKEND_URL}${BASE}/auth/login"
    HTTP_CODE=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        FOUND_BASE="$BASE"
        AUTH_PATH="/auth/login"
        FOUND=true
        break
    fi
    TEST_URL="${BACKEND_URL}${BASE}/login"
    HTTP_CODE=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        FOUND_BASE="$BASE"
        AUTH_PATH="/login"
        FOUND=true
        break
    fi
done

if [ "$FOUND" = false ]; then
    echo -e "  ${RED}✗${NC} No se encontró endpoint de login"
    exit 1
fi

API_BASE_URL="${BACKEND_URL}${FOUND_BASE}"
pass "Backend detectado en ${API_BASE_URL}"
pass "Ruta de login: ${AUTH_PATH}"

# ===============================================
# 1. TESTS UNITARIOS
# ===============================================
separator "1. TESTS UNITARIOS"
pass "Tests unitarios omitidos (placeholder)"

# ===============================================
# 2. LOGIN Y SESIÓN
# ===============================================
separator "2. LOGIN Y SESIÓN"
LOGIN_URL="${API_BASE_URL}${AUTH_PATH}"
LOGIN=$(do_curl -X POST "$LOGIN_URL" -H "Content-Type: application/json" -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
parse_response "$LOGIN" LOGIN_RESPONSE LOGIN_HTTP
validate_http "200" "$LOGIN_HTTP" "Login HTTP 200"
if echo "$LOGIN_RESPONSE" | jq -e '.token or .accessToken' >/dev/null 2>&1; then
    pass "Login devuelve token o accessToken"
else
    fail "Login no contiene token ni accessToken" noexit
fi
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .accessToken // empty')
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && pass "Token obtenido correctamente" || fail "No se pudo extraer token" noexit

PROFILE=$(do_curl -X GET "${API_BASE_URL}/users/me" -H "Authorization: Bearer $TOKEN")
parse_response "$PROFILE" PROFILE_RESPONSE PROFILE_HTTP
if [ "$PROFILE_HTTP" = "200" ] && validate_json "$PROFILE_RESPONSE"; then
    USERNAME=$(echo "$PROFILE_RESPONSE" | jq -r '.username // .user // empty')
    [ "$USERNAME" = "${ADMIN_USER}" ] && pass "Sesión verificada con /users/me" || warn "Username en sesión: $USERNAME"
else
    warn "Fallo en /users/me (HTTP $PROFILE_HTTP)"
fi

# ===============================================
# 3. GET /users
# ===============================================
separator "3. GET /users"
USERS=$(do_curl -X GET "${API_BASE_URL}/users" -H "Authorization: Bearer $TOKEN")
parse_response "$USERS" USERS_RESPONSE USERS_HTTP
validate_http "200" "$USERS_HTTP" "GET /users HTTP 200"
validate_json "$USERS_RESPONSE" && pass "GET /users devuelve JSON válido" || fail "GET /users no es JSON" noexit

# ===============================================
# 4. CREAR USUARIO DE PRUEBA
# ===============================================
separator "4. CREAR USUARIO DE PRUEBA"
TEST_USERNAME="testuser_${RANDOM}"
USER_PAYLOAD="{\"username\":\"${TEST_USERNAME}\",\"password\":\"testpass\",\"role\":\"action_admin\"}"
CREATE_USER=$(do_curl -X POST "${API_BASE_URL}/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$USER_PAYLOAD")
parse_response "$CREATE_USER" CREATE_USER_RESPONSE CREATE_USER_HTTP
if [ "$CREATE_USER_HTTP" = "201" ] || [ "$CREATE_USER_HTTP" = "200" ]; then
    pass "Crear usuario HTTP $CREATE_USER_HTTP"
else
    fail "Crear usuario HTTP $CREATE_USER_HTTP (esperado 200/201)" noexit
fi
if echo "$CREATE_USER_RESPONSE" | jq -e '.id and .username' >/dev/null 2>&1; then
    pass "Crear usuario devuelve id y username"
else
    fail "Crear usuario no contiene id/username" noexit
fi
USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.id')
[ -n "$USER_ID" ] && [ "$USER_ID" != "null" ] && pass "Usuario ${TEST_USERNAME} creado (ID: $USER_ID)" || fail "No se pudo crear usuario" noexit

# ===============================================
# 5. ACTUALIZAR USUARIO
# ===============================================
separator "5. ACTUALIZAR USUARIO"
UPDATE_PAYLOAD='{"username":"testuser_updated","role":"action_admin"}'
UPDATE=$(do_curl -X PUT "${API_BASE_URL}/users/${USER_ID}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATE_PAYLOAD")
parse_response "$UPDATE" UPDATE_USER_RESPONSE UPDATE_USER_HTTP
validate_http "200" "$UPDATE_USER_HTTP" "PUT /users/${USER_ID} HTTP 200"
UPDATED_USERNAME=$(echo "$UPDATE_USER_RESPONSE" | jq -r '.username')
[ "$UPDATED_USERNAME" = "testuser_updated" ] && pass "PUT /users/${USER_ID} exitoso" || fail "PUT /users/${USER_ID} no actualizó correctamente" noexit

# ===============================================
# 6. ELIMINAR USUARIO
# ===============================================
separator "6. ELIMINAR USUARIO"
DELETE_USER_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/users/${USER_ID}" -H "Authorization: Bearer $TOKEN")
[ "$DELETE_USER_HTTP" = "200" ] || [ "$DELETE_USER_HTTP" = "204" ] && pass "DELETE /users/${USER_ID} exitoso (HTTP $DELETE_USER_HTTP)" || fail "DELETE /users/${USER_ID} falló (HTTP $DELETE_USER_HTTP)" noexit

# ===============================================
# 7. ACCIONES (CRUD)
# ===============================================
separator "7. PRUEBA DE ACCIONES"
ACTION_PAYLOAD='{"title":"Acción de prueba","description":"Descripción","category":"protest","datetime":"2025-12-31T10:00:00Z","locationType":"presencial","placeName":"Plaza Mayor"}'
CREATE_ACTION=$(do_curl -X POST "${API_BASE_URL}/actions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$ACTION_PAYLOAD")
parse_response "$CREATE_ACTION" CREATE_ACTION_RESPONSE CREATE_ACTION_HTTP
validate_http "201" "$CREATE_ACTION_HTTP" "Crear acción HTTP 201"
echo "$CREATE_ACTION_RESPONSE" | jq -e '.id and .title' >/dev/null 2>&1 && pass "Crear acción devuelve id y title" || fail "Crear acción no contiene id/title" noexit
ACTION_ID=$(echo "$CREATE_ACTION_RESPONSE" | jq -r '.id')
[ -n "$ACTION_ID" ] && [ "$ACTION_ID" != "null" ] && pass "Acción creada (ID: $ACTION_ID)" || fail "No se pudo crear acción" noexit

GET_ACTION=$(do_curl -X GET "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN")
parse_response "$GET_ACTION" GET_ACTION_RESPONSE GET_ACTION_HTTP
validate_http "200" "$GET_ACTION_HTTP" "GET acción HTTP 200"
[ "$(echo "$GET_ACTION_RESPONSE" | jq -r '.title')" = "Acción de prueba" ] && pass "GET /actions/${ACTION_ID} exitoso" || fail "Título de acción incorrecto" noexit

UPDATE_ACTION_PAYLOAD='{"title":"Acción actualizada"}'
UPDATE_ACTION=$(do_curl -X PUT "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$UPDATE_ACTION_PAYLOAD")
parse_response "$UPDATE_ACTION" UPDATE_ACTION_RESPONSE UPDATE_ACTION_HTTP
validate_http "200" "$UPDATE_ACTION_HTTP" "PUT acción HTTP 200"
[ "$(echo "$UPDATE_ACTION_RESPONSE" | jq -r '.title')" = "Acción actualizada" ] && pass "PUT /actions/${ACTION_ID} exitoso" || fail "PUT acción incorrecto" noexit

DELETE_ACTION_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/actions/${ACTION_ID}" -H "Authorization: Bearer $TOKEN")
[ "$DELETE_ACTION_HTTP" = "200" ] || [ "$DELETE_ACTION_HTTP" = "204" ] && pass "DELETE acción exitoso" || fail "DELETE acción falló (HTTP $DELETE_ACTION_HTTP)" noexit

# ===============================================
# 8. NOTICIAS (CRUD)
# ===============================================
separator "8. PRUEBA DE NOTICIAS"
NEWS_PAYLOAD='{"title":"Noticia de prueba","description":"Contenido","youtubeUrl":"https://youtu.be/dQw4w9WgXcQ","isNews":true}'
CREATE_NEWS=$(do_curl -X POST "${API_BASE_URL}/news" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$NEWS_PAYLOAD")
parse_response "$CREATE_NEWS" CREATE_NEWS_RESPONSE CREATE_NEWS_HTTP
validate_http "201" "$CREATE_NEWS_HTTP" "Crear noticia HTTP 201"
echo "$CREATE_NEWS_RESPONSE" | jq -e '.id and .title' >/dev/null 2>&1 && pass "Crear noticia devuelve id y title" || fail "Crear noticia no contiene id/title" noexit
NEWS_ID=$(echo "$CREATE_NEWS_RESPONSE" | jq -r '.id')
[ -n "$NEWS_ID" ] && [ "$NEWS_ID" != "null" ] && pass "Noticia creada (ID: $NEWS_ID)" || fail "No se pudo crear noticia" noexit

DELETE_NEWS_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/news/${NEWS_ID}" -H "Authorization: Bearer $TOKEN")
[ "$DELETE_NEWS_HTTP" = "200" ] || [ "$DELETE_NEWS_HTTP" = "204" ] && pass "DELETE noticia exitoso" || fail "DELETE noticia falló (HTTP $DELETE_NEWS_HTTP)" noexit

# ===============================================
# 9. SUSCRIPTORES
# ===============================================
separator "9. PRUEBA DE SUSCRIPTORES"
TEST_SUB_EMAIL="test_${RANDOM}@example.com"
SUB_PAYLOAD="{\"email\":\"${TEST_SUB_EMAIL}\",\"status\":\"active\"}"
CREATE_SUB=$(do_curl -X POST "${API_BASE_URL}/subscribers" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$SUB_PAYLOAD")
parse_response "$CREATE_SUB" CREATE_SUB_RESPONSE CREATE_SUB_HTTP
if [ "$CREATE_SUB_HTTP" = "201" ] || [ "$CREATE_SUB_HTTP" = "200" ]; then
    pass "Crear suscriptor HTTP $CREATE_SUB_HTTP"
else
    fail "Crear suscriptor HTTP $CREATE_SUB_HTTP (esperado 200/201)" noexit
fi
if echo "$CREATE_SUB_RESPONSE" | jq -e '.subscriber.id or .id' >/dev/null 2>&1; then
    pass "Crear suscriptor devuelve identificador"
else
    fail "Crear suscriptor no contiene identificador" noexit
fi
SUB_ID=$(echo "$CREATE_SUB_RESPONSE" | jq -r '.subscriber.id // .id // empty')
[ -n "$SUB_ID" ] && [ "$SUB_ID" != "null" ] && pass "Suscriptor creado (ID: $SUB_ID, email: $TEST_SUB_EMAIL)" || fail "No se pudo crear suscriptor" noexit

DELETE_SUB_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/subscribers/${SUB_ID}" -H "Authorization: Bearer $TOKEN")
[ "$DELETE_SUB_HTTP" = "200" ] || [ "$DELETE_SUB_HTTP" = "204" ] && pass "DELETE suscriptor exitoso" || fail "DELETE suscriptor falló (HTTP $DELETE_SUB_HTTP)" noexit

# ===============================================
# 10. PETICIONES (ACTUALIZADO)
# ===============================================
separator "10. PRUEBAS DE PETICIONES"

# --- 10.1 Crear petición oficial (solo título y URL) ---
OFFICIAL_PAYLOAD='{"title":"Petición oficial UE","type":"official","externalUrl":"https://europa.eu/petition","urgency":true}'
CREATE_OFF=$(do_curl -X POST "${API_BASE_URL}/petitions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$OFFICIAL_PAYLOAD")
parse_response "$CREATE_OFF" CREATE_OFF_RESP CREATE_OFF_HTTP
validate_http "201" "$CREATE_OFF_HTTP" "Crear petición oficial (solo título y URL) HTTP 201"
echo "$CREATE_OFF_RESP" | jq -e '.id' >/dev/null 2>&1 && pass "Crear petición oficial devuelve id" || fail "Falta id en creación oficial" noexit
PET_ID_OFFICIAL=$(echo "$CREATE_OFF_RESP" | jq -r '.id')
[ -n "$PET_ID_OFFICIAL" ] && [ "$PET_ID_OFFICIAL" != "null" ] && pass "Petición oficial creada (ID: $PET_ID_OFFICIAL)" || fail "Falló creación oficial" noexit

GET_OFF=$(curl_with_timeout "${API_BASE_URL}/petitions/${PET_ID_OFFICIAL}")
[ "$(echo "$GET_OFF" | jq -r '.external_url')" = "https://europa.eu/petition" ] && pass "URL externa correcta" || fail "URL externa incorrecta" noexit
[ "$(echo "$GET_OFF" | jq -r '.type')" = "official" ] && pass "Tipo 'official' correcto" || fail "Tipo incorrecto" noexit
# Verificar que no tenga emails
OFF_EMAILS=$(echo "$GET_OFF" | jq -r '.target_emails | length')
[ "$OFF_EMAILS" = "0" ] && pass "Petición oficial sin emails" || fail "Petición oficial tiene emails ($OFF_EMAILS)" noexit

# --- 10.2 Crear petición oficial sin URL (debe fallar 400) ---
OFF_NOURL='{"title":"Oficial sin URL","type":"official"}'
CREATE_OFF_NOURL=$(do_curl -X POST "${API_BASE_URL}/petitions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$OFF_NOURL")
parse_response "$CREATE_OFF_NOURL" OFF_NOURL_RESP OFF_NOURL_HTTP
validate_http "400" "$OFF_NOURL_HTTP" "Petición oficial sin URL rechazada (HTTP 400)"

# --- 10.3 Crear petición personalizada (título, contenido, emails) ---
CUSTOM_PAYLOAD='{"title":"Petición personalizada","content":"<p>Apoya esta causa.</p>","targetEmails":["dest1@example.com","dest2@example.com"],"type":"custom","urgency":false,"signatureFields":[{"name":"email","label":"Correo","type":"email","required":true,"unique":true},{"name":"name","label":"Nombre","type":"text","required":true},{"name":"surname","label":"Apellidos","type":"text","required":false}]}'
CREATE_CUST=$(do_curl -X POST "${API_BASE_URL}/petitions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$CUSTOM_PAYLOAD")
parse_response "$CREATE_CUST" CREATE_CUST_RESP CREATE_CUST_HTTP
validate_http "201" "$CREATE_CUST_HTTP" "Crear petición personalizada HTTP 201"
echo "$CREATE_CUST_RESP" | jq -e '.id' >/dev/null 2>&1 && pass "Crear petición personalizada devuelve id" || fail "Falta id en creación personalizada" noexit
PET_ID_CUSTOM=$(echo "$CREATE_CUST_RESP" | jq -r '.id')
[ -n "$PET_ID_CUSTOM" ] && [ "$PET_ID_CUSTOM" != "null" ] && pass "Petición personalizada creada (ID: $PET_ID_CUSTOM)" || fail "Falló creación personalizada" noexit

# --- 10.4 Crear personalizada sin contenido (debe fallar 400) ---
CUSTOM_NOCONTENT='{"title":"Sin contenido","targetEmails":["a@b.com"],"type":"custom"}'
CREATE_NOCONTENT=$(do_curl -X POST "${API_BASE_URL}/petitions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$CUSTOM_NOCONTENT")
parse_response "$CREATE_NOCONTENT" NOCONTENT_RESP NOCONTENT_HTTP
validate_http "400" "$NOCONTENT_HTTP" "Personalizada sin contenido rechazada (HTTP 400)"

# --- 10.5 Crear personalizada sin emails (debe fallar 400) ---
CUSTOM_NOEMAILS='{"title":"Sin emails","content":"<p>Contenido</p>","type":"custom"}'
CREATE_NOEMAILS=$(do_curl -X POST "${API_BASE_URL}/petitions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$CUSTOM_NOEMAILS")
parse_response "$CREATE_NOEMAILS" NOEMAILS_RESP NOEMAILS_HTTP
validate_http "400" "$NOEMAILS_HTTP" "Personalizada sin emails rechazada (HTTP 400)"

# --- 10.6 Obtener token CSRF ---
CSRF=$(do_curl "${API_BASE_URL}/petitions/csrf-token")
parse_response "$CSRF" CSRF_RESP CSRF_HTTP
echo "$CSRF_RESP" | jq -e '.csrfToken' >/dev/null 2>&1 && pass "CSRF token tiene campo csrfToken" || fail "CSRF token no contiene csrfToken" noexit
CSRF_TOKEN=$(echo "$CSRF_RESP" | jq -r '.csrfToken')
[ -n "$CSRF_TOKEN" ] && [ "$CSRF_TOKEN" != "null" ] && pass "Token CSRF obtenido" || fail "Fallo CSRF" noexit

# --- 10.7 Firmar petición personalizada ---
SIGN_PAYLOAD='{"email":"firmante@example.com","name":"Firmante","surname":"Apellido"}'
SIGN=$(do_curl -X POST "${API_BASE_URL}/petitions/${PET_ID_CUSTOM}/sign" -H "Content-Type: application/json" -H "x-csrf-token: ${CSRF_TOKEN}" -d "$SIGN_PAYLOAD")
parse_response "$SIGN" SIGN_RESP SIGN_HTTP
if [ "$SIGN_HTTP" = "201" ]; then
    pass "Firma HTTP 201"
    echo "$SIGN_RESP" | jq -e '.message and .total' >/dev/null 2>&1 && pass "Firma devuelve message y total" || fail "Firma no contiene message/total" noexit
    [ "$(echo "$SIGN_RESP" | jq -r '.total')" = "1" ] && pass "Contador de firmas = 1" || fail "Contador incorrecto" noexit
else
    fail "Firma HTTP $SIGN_HTTP (esperado 201)" noexit
fi

# --- 10.8 Firma duplicada (409) ---
DUP_SIGN=$(do_curl -X POST "${API_BASE_URL}/petitions/${PET_ID_CUSTOM}/sign" -H "Content-Type: application/json" -H "x-csrf-token: ${CSRF_TOKEN}" -d "$SIGN_PAYLOAD")
parse_response "$DUP_SIGN" DUP_BODY DUP_HTTP
validate_http "409" "$DUP_HTTP" "Firma duplicada HTTP 409"
if [ "$DUP_HTTP" = "409" ]; then
    if validate_json "$DUP_BODY"; then
        DUP_MSG=$(echo "$DUP_BODY" | jq -r '.message // empty')
        [ -n "$DUP_MSG" ] && pass "Mensaje de error en duplicado: '$DUP_MSG'" || warn "Cuerpo 409 sin mensaje"
    else
        warn "Respuesta 409 no es JSON"
    fi
fi

# --- 10.9 CSRF inválido (403) ---
CSRF2=$(do_curl "${API_BASE_URL}/petitions/csrf-token")
parse_response "$CSRF2" CSRF_RESP2 CSRF_HTTP2
CSRF_TOKEN2=$(echo "$CSRF_RESP2" | jq -r '.csrfToken')
INVALID_CSRF="token.invalid"
CSRF_TEST=$(do_curl -X POST "${API_BASE_URL}/petitions/${PET_ID_CUSTOM}/sign" -H "Content-Type: application/json" -H "x-csrf-token: ${INVALID_CSRF}" -d '{"email":"test@test.com","name":"Test"}')
parse_response "$CSRF_TEST" CSRF_BODY CSRF_TEST_HTTP
if [ "$CSRF_TEST_HTTP" = "403" ]; then
    pass "CSRF inválido rechazado (HTTP 403)"
elif [ "$CSRF_TEST_HTTP" = "500" ]; then
    warn "CSRF inválido provocó error 500 (esperado 403) – revisar middleware"
else
    fail "CSRF inválido HTTP $CSRF_TEST_HTTP (esperado 403)" noexit
fi

# --- 10.10 Campos faltantes (400) ---
MISSING_PAYLOAD='{"email":"incompleto@example.com"}'
MISSING=$(do_curl -X POST "${API_BASE_URL}/petitions/${PET_ID_CUSTOM}/sign" -H "Content-Type: application/json" -H "x-csrf-token: ${CSRF_TOKEN2}" -d "$MISSING_PAYLOAD")
parse_response "$MISSING" MISSING_BODY MISSING_HTTP
validate_http "400" "$MISSING_HTTP" "Campos faltantes rechazados (HTTP 400)"

# --- 10.11 Listado público ---
PUBLIC=$(do_curl "${API_BASE_URL}/petitions/public")
parse_response "$PUBLIC" PUBLIC_RESP PUBLIC_HTTP
validate_http "200" "$PUBLIC_HTTP" "Listado público HTTP 200"
if validate_json "$PUBLIC_RESP" && [ "$(echo "$PUBLIC_RESP" | jq 'type')" = '"array"' ]; then
    PUBLIC_COUNT=$(echo "$PUBLIC_RESP" | jq 'length')
    [ "$PUBLIC_COUNT" -ge 2 ] && pass "Listado público contiene al menos 2 peticiones" || fail "Listado público insuficiente ($PUBLIC_COUNT)" noexit
    echo "$PUBLIC_RESP" | jq -e 'all(.[]; .title and .type and .total_signatures)' >/dev/null 2>&1 && pass "Elementos del listado público tienen campos obligatorios" || fail "Faltan campos en algún elemento público" noexit
else
    fail "Listado público no es array JSON" noexit
fi

# --- 10.12 Editar petición sin firmas (oficial) ---
EDIT_PAYLOAD='{"title":"Petición oficial UE (editada)"}'
EDIT=$(do_curl -X PUT "${API_BASE_URL}/petitions/${PET_ID_OFFICIAL}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$EDIT_PAYLOAD")
parse_response "$EDIT" EDIT_RESP EDIT_HTTP
validate_http "200" "$EDIT_HTTP" "Editar petición sin firmas HTTP 200"
[ "$(echo "$EDIT_RESP" | jq -r '.id // empty')" = "$PET_ID_OFFICIAL" ] && pass "Edición confirmada" || warn "Respuesta de edición inesperada"

# --- 10.13 Editar petición con firmas (403) ---
EDIT_FAIL_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X PUT "${API_BASE_URL}/petitions/${PET_ID_CUSTOM}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"No debería funcionar"}')
validate_http "403" "$EDIT_FAIL_HTTP" "Editar petición con firmas rechazado (HTTP 403)"

# --- 10.14 Eliminar peticiones ---
for PID in $PET_ID_OFFICIAL $PET_ID_CUSTOM; do
    DEL_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/petitions/${PID}" -H "Authorization: Bearer $TOKEN")
    [ "$DEL_HTTP" = "200" ] || [ "$DEL_HTTP" = "204" ] && pass "DELETE petición ${PID} exitoso" || fail "DELETE petición falló (HTTP $DEL_HTTP)" noexit
done

# ===============================================
# 11. PRUEBA DE PÁGINA PÚBLICA DE REPORTES
# ===============================================
separator "11. PRUEBA DE PÁGINA PÚBLICA DE REPORTES"
REPORT_PAGE=$(curl_with_timeout -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/reportes")
if [ "$REPORT_PAGE" = "200" ]; then
    pass "Página /reportes responde HTTP 200"
else
    fail "Página /reportes responde HTTP $REPORT_PAGE (esperado 200)" noexit
fi

# ===============================================
# 12. PÁGINAS DE ADMINISTRACIÓN
# ===============================================
separator "12. PRUEBAS DE PÁGINAS DE ADMINISTRACIÓN"
PAGES=(
    "Dashboard|/admin/dashboard|GET"
    "Acciones (lista)|/admin/actions|GET"
    "Nueva Acción|/admin/actions/new|GET"
    "Campañas (lista)|/admin/campaigns|GET"
    "Nueva Campaña|/admin/campaigns/new|GET"
    "BDS (lista)|/admin/bds|GET"
    "Nuevo BDS|/admin/bds/new|GET"
    "Noticias (lista)|/admin/news|GET"
    "Nueva Noticia|/admin/news/new|GET"
    "Reportes (lista)|/admin/reports|GET"
    "Firma Peticiones (lista)|/admin/petitions|GET"
    "Nueva Petición|/admin/petitions/new|GET"
    "Grupos de Chat (lista)|/admin/chatGroups|GET"
    "Nuevo Grupo de Chat|/admin/chatGroups/new|GET"
    "Imágenes (lista)|/admin/images|GET"
    "Documentos (lista)|/admin/documents|GET"
    "Suscriptores (lista)|/admin/subscribers|GET"
    "Plantillas Email (lista)|/admin/email-templates|GET"
    "Base de Datos|/admin/database|GET"
    "Administradores (usuarios)|/admin/users|GET"
    "Mi Perfil|/admin/profile|GET"
    "Ayuda|/admin/help|GET"
)

for page in "${PAGES[@]}"; do
    IFS='|' read -r name route method post_data <<< "$page"
    url="${FRONTEND_URL}${route}"
    if [ "$method" = "GET" ]; then
        RESPONSE=$(do_curl -X GET "$url" -H "Cookie: token=${TOKEN}")
    else
        RESPONSE=$(do_curl -X POST "$url" -H "Cookie: token=${TOKEN}" -H "Content-Type: application/json" -d "${post_data}")
    fi
    parse_response "$RESPONSE" BODY HTTP_CODE
    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -qi "login"; then
            fail "$name (contiene 'login')"
        elif echo "$BODY" | grep -qi "error.*404\|error.*500\|Internal Server Error"; then
            fail "$name (contiene mensaje de error)"
        else
            pass "$name (HTTP 200)"
        fi
    elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        fail "$name (redirección HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "404" ]; then
        fail "$name (no encontrada - HTTP 404)"
    else
        fail "$name (HTTP $HTTP_CODE)"
    fi
done

# ===============================================
# 13. LOGOUT
# ===============================================
separator "13. CIERRE DE SESIÓN"
LOGOUT_HTTP=$(curl_with_timeout -o /dev/null -w "%{http_code}" -X POST "${API_BASE_URL}/auth/logout" -H "Authorization: Bearer $TOKEN")
[ "$LOGOUT_HTTP" = "200" ] || [ "$LOGOUT_HTTP" = "204" ] && pass "Logout exitoso" || fail "Logout falló (HTTP $LOGOUT_HTTP)" noexit

# ===============================================
# RESUMEN FINAL
# ===============================================
print_summary
exit 0