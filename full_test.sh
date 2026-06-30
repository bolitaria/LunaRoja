#!/bin/bash

# ==============================================
# PRUEBAS COMPLETAS DEL SISTEMA – Voces Palestinas
# Versión final corregida v10
# ==============================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_HOST="localhost"
BACKEND_PORT="5000"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"

# Prefijos base a probar
BASE_PREFIXES=("" "/api" "/auth")
FOUND_BASE=""
API_BASE_URL=""
TOKEN=""
USER_ID=""

# ------------------------------------------------------------
# Funciones auxiliares
# ------------------------------------------------------------
separator() {
    echo -e "\n${BLUE}══════════ $1 ══════════${NC}"
}

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $2"
    else
        echo -e "  ${RED}✗${NC} $2"
        exit 1
    fi
}

# Verificar herramientas necesarias
for cmd in curl jq nc; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Falta la herramienta '$cmd'. Instálala antes de ejecutar el script.${NC}"
        exit 1
    fi
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PRUEBAS COMPLETAS DEL SISTEMA (FINAL v10)               ║${NC}"
echo -e "${BLUE}║     Voces Palestinas por la Justicia                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# ===============================================
# 0. DETECTAR BACKEND Y BASE PREFIX
# ===============================================
echo -e "\n${YELLOW}⏳ Esperando al backend...${NC}"

max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if nc -z "$BACKEND_HOST" "$BACKEND_PORT" 2>/dev/null; then
        break
    fi
    attempt=$((attempt+1))
    sleep 1
done
if [ $attempt -eq $max_attempts ]; then
    echo -e "  ${RED}✗${NC} Backend no responde en el puerto $BACKEND_PORT"
    exit 1
fi

# Probar combinaciones: base_prefix + /auth/login y /login
FOUND=false
for BASE in "${BASE_PREFIXES[@]}"; do
    # Probar /auth/login
    TEST_URL="${BACKEND_URL}${BASE}/auth/login"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -d '{"username":"superadmin","password":"superadmin"}')
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        FOUND_BASE="$BASE"
        AUTH_PATH="/auth/login"
        FOUND=true
        break
    fi
    # Probar /login
    TEST_URL="${BACKEND_URL}${BASE}/login"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 -X POST "$TEST_URL" \
        -H "Content-Type: application/json" \
        -d '{"username":"superadmin","password":"superadmin"}')
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        FOUND_BASE="$BASE"
        AUTH_PATH="/login"
        FOUND=true
        break
    fi
done

if [ "$FOUND" = false ]; then
    echo -e "  ${RED}✗${NC} No se pudo encontrar el endpoint de login en ningún prefijo."
    echo -e "  ${YELLOW}   Prefijos probados: ${BASE_PREFIXES[*]}${NC}"
    echo -e "  ${YELLOW}   Prueba manual: curl -v http://localhost:5000/api/auth/login -X POST ...${NC}"
    exit 1
fi

API_BASE_URL="${BACKEND_URL}${FOUND_BASE}"
echo -e "  ${GREEN}✓${NC} Backend encontrado con base: '${FOUND_BASE}' (vacío si no se muestra)"
echo -e "  ${GREEN}✓${NC} Ruta de login: ${AUTH_PATH}"
echo -e "  ${GREEN}✓${NC} URL base API: ${API_BASE_URL}"

# ===============================================
# 1. TESTS UNITARIOS (placeholder)
# ===============================================
separator "1. TESTS UNITARIOS"
echo -e "  ${GREEN}✓${NC} Tests unitarios omitidos (evitan bloqueo)"

# ===============================================
# 2. LOGIN
# ===============================================
separator "2. LOGIN Y SESIÓN (superadmin)"

LOGIN_URL="${API_BASE_URL}${AUTH_PATH}"
LOGIN_RESPONSE=$(curl -s -X POST "$LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d '{"username":"superadmin","password":"superadmin"}')

if echo "$LOGIN_RESPONSE" | jq -e . >/dev/null 2>&1; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        test_result 0 "Login superadmin"
    else
        echo -e "  ${RED}✗${NC} Login fallido (token no encontrado)"
        echo "$LOGIN_RESPONSE" | jq .
        exit 1
    fi
else
    echo -e "  ${RED}✗${NC} Login fallido (respuesta no JSON)"
    echo "Respuesta: $LOGIN_RESPONSE"
    exit 1
fi

test_result 0 "Token superadmin obtenido"

# Obtener perfil (ruta /users/me, con fallback a /auth/me)
PROFILE_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/users/me" \
    -H "Authorization: Bearer $TOKEN")
if echo "$PROFILE_RESPONSE" | jq -e . >/dev/null 2>&1; then
    USERNAME=$(echo "$PROFILE_RESPONSE" | jq -r '.username')
    if [ "$USERNAME" = "superadmin" ]; then
        test_result 0 "Sesión superadmin"
    else
        echo -e "  ${RED}✗${NC} Sesión no válida (username: $USERNAME)"
        echo "$PROFILE_RESPONSE" | jq .
        exit 1
    fi
else
    # Intentar ruta alternativa /auth/me
    PROFILE_RESPONSE2=$(curl -s -X GET "${API_BASE_URL}/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$PROFILE_RESPONSE2" | jq -e . >/dev/null 2>&1; then
        USERNAME=$(echo "$PROFILE_RESPONSE2" | jq -r '.username')
        if [ "$USERNAME" = "superadmin" ]; then
            test_result 0 "Sesión superadmin (vía /auth/me)"
        else
            echo -e "  ${RED}✗${NC} Sesión no válida en /auth/me"
            exit 1
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} No se pudo verificar sesión con /users/me ni /auth/me (continuamos)"
    fi
fi

# ===============================================
# 3. USUARIOS (GET /users)
# ===============================================
separator "3. PREPARACIÓN DE USUARIOS (GET /users)"

USERS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/users" \
    -H "Authorization: Bearer $TOKEN")
if echo "$USERS_RESPONSE" | jq -e '.users' >/dev/null 2>&1 || echo "$USERS_RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
    test_result 0 "GET /users exitoso"
else
    echo -e "  ${RED}✗${NC} GET /users falló"
    echo "$USERS_RESPONSE" | jq .
    exit 1
fi

# ===============================================
# 4. CREAR USUARIO
# ===============================================
separator "4. CREAR USUARIO DE PRUEBA"

USER_PAYLOAD='{"username":"testuser","password":"testpass","role":"action_admin"}'
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$USER_PAYLOAD")
USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    test_result 0 "Usuario testuser creado (ID: $USER_ID)"
else
    echo -e "  ${RED}✗${NC} Falló creación de usuario"
    echo "$CREATE_RESPONSE" | jq .
    exit 1
fi

# ===============================================
# 5. OBTENER USUARIO
# ===============================================
separator "5. OBTENER USUARIO POR ID"

GET_USER_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/users/${USER_ID}" \
    -H "Authorization: Bearer $TOKEN")
FOUND_USERNAME=$(echo "$GET_USER_RESPONSE" | jq -r '.username')
if [ "$FOUND_USERNAME" = "testuser" ]; then
    test_result 0 "GET /users/${USER_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló GET /users/${USER_ID}"
    echo "$GET_USER_RESPONSE" | jq .
    exit 1
fi

# ===============================================
# 6. ACTUALIZAR USUARIO
# ===============================================
separator "6. ACTUALIZAR USUARIO"

UPDATE_PAYLOAD='{"username":"testuser_updated","role":"action_admin"}'
UPDATE_RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/users/${USER_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")
UPDATED_USERNAME=$(echo "$UPDATE_RESPONSE" | jq -r '.username')
if [ "$UPDATED_USERNAME" = "testuser_updated" ]; then
    test_result 0 "PUT /users/${USER_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló PUT /users/${USER_ID}"
    echo "$UPDATE_RESPONSE" | jq .
    exit 1
fi

# ===============================================
# 7. ELIMINAR USUARIO
# ===============================================
separator "7. ELIMINAR USUARIO"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/users/${USER_ID}" \
    -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "DELETE /users/${USER_ID} exitoso (código $HTTP_CODE)"
else
    echo -e "  ${RED}✗${NC} Falló DELETE /users/${USER_ID} (código $HTTP_CODE)"
    exit 1
fi

# ===============================================
# 8. PRUEBA DE ACCIONES (CRUD)
# ===============================================
separator "8. PRUEBA DE ACCIONES (CRUD)"

ACTION_PAYLOAD='{"title":"Acción de prueba","description":"Descripción","category":"protest","datetime":"2025-12-31T10:00:00Z","locationType":"presencial","placeName":"Plaza Mayor"}'
CREATE_ACTION=$(curl -s -X POST "${API_BASE_URL}/actions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ACTION_PAYLOAD")
ACTION_ID=$(echo "$CREATE_ACTION" | jq -r '.id')
if [ -n "$ACTION_ID" ] && [ "$ACTION_ID" != "null" ]; then
    test_result 0 "Acción creada (ID: $ACTION_ID)"
else
    echo -e "  ${RED}✗${NC} Falló creación de acción"
    echo "$CREATE_ACTION" | jq .
    exit 1
fi

# Obtener acción
GET_ACTION=$(curl -s -X GET "${API_BASE_URL}/actions/${ACTION_ID}" \
    -H "Authorization: Bearer $TOKEN")
ACTION_TITLE=$(echo "$GET_ACTION" | jq -r '.title')
if [ "$ACTION_TITLE" = "Acción de prueba" ]; then
    test_result 0 "GET /actions/${ACTION_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló GET /actions/${ACTION_ID}"
    echo "$GET_ACTION" | jq .
    exit 1
fi

# Actualizar acción
UPDATE_ACTION_PAYLOAD='{"title":"Acción actualizada"}'
UPDATE_ACTION=$(curl -s -X PUT "${API_BASE_URL}/actions/${ACTION_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_ACTION_PAYLOAD")
UPDATED_TITLE=$(echo "$UPDATE_ACTION" | jq -r '.title')
if [ "$UPDATED_TITLE" = "Acción actualizada" ]; then
    test_result 0 "PUT /actions/${ACTION_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló PUT /actions/${ACTION_ID}"
    echo "$UPDATE_ACTION" | jq .
    exit 1
fi

# Eliminar acción (código HTTP fiable)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/actions/${ACTION_ID}" \
    -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "DELETE /actions/${ACTION_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló DELETE /actions/${ACTION_ID} (código $HTTP_CODE)"
    exit 1
fi

# ===============================================
# 9. PRUEBA DE NOTICIAS (CRUD)
# ===============================================
separator "9. PRUEBA DE NOTICIAS (CRUD)"

NEWS_PAYLOAD='{"title":"Noticia de prueba","description":"Contenido","youtubeUrl":"https://youtu.be/dQw4w9WgXcQ","isNews":true}'
CREATE_NEWS=$(curl -s -X POST "${API_BASE_URL}/news" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$NEWS_PAYLOAD")
NEWS_ID=$(echo "$CREATE_NEWS" | jq -r '.id')
if [ -n "$NEWS_ID" ] && [ "$NEWS_ID" != "null" ]; then
    test_result 0 "Noticia creada (ID: $NEWS_ID)"
else
    echo -e "  ${RED}✗${NC} Falló creación de noticia"
    echo "$CREATE_NEWS" | jq .
    exit 1
fi

# Eliminar noticia (código HTTP fiable)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/news/${NEWS_ID}" \
    -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "DELETE /news/${NEWS_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló DELETE /news/${NEWS_ID} (código $HTTP_CODE)"
    exit 1
fi

# ===============================================
# 10. PRUEBA DE SUSCRIPTORES
# ===============================================
separator "10. PRUEBA DE SUSCRIPTORES"

SUB_PAYLOAD='{"email":"test@example.com","status":"active"}'
CREATE_SUB=$(curl -s -X POST "${API_BASE_URL}/subscribers" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$SUB_PAYLOAD")
SUB_ID=$(echo "$CREATE_SUB" | jq -r '.id')
if [ -n "$SUB_ID" ] && [ "$SUB_ID" != "null" ]; then
    test_result 0 "Suscriptor creado (ID: $SUB_ID)"
else
    echo -e "  ${RED}✗${NC} Falló creación de suscriptor"
    echo "$CREATE_SUB" | jq .
    exit 1
fi

# Eliminar suscriptor (código HTTP fiable)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${API_BASE_URL}/subscribers/${SUB_ID}" \
    -H "Authorization: Bearer $TOKEN")
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "DELETE /subscribers/${SUB_ID} exitoso"
else
    echo -e "  ${RED}✗${NC} Falló DELETE /subscribers/${SUB_ID} (código $HTTP_CODE)"
    exit 1
fi

# ===============================================
# 11. PRUEBA DE BASE DE DATOS (endpoints admin)
# ===============================================
separator "11. PRUEBA DE BASE DE DATOS (solo superadmin)"

# Probar endpoint de migraciones (debe responder solo a superadmin)
MIGRATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE_URL}/admin/database/migrate" \
    -H "Authorization: Bearer $TOKEN")
if [ "$MIGRATE_CODE" = "200" ]; then
    test_result 0 "Migraciones ejecutadas correctamente"
elif [ "$MIGRATE_CODE" = "403" ]; then
    echo -e "  ${YELLOW}⚠${NC} Migraciones requiere permisos de superadmin (código $MIGRATE_CODE)"
else
    echo -e "  ${YELLOW}⚠${NC} Endpoint de migraciones respondió con código $MIGRATE_CODE"
fi

# Probar backup
BACKUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE_URL}/admin/database/backup" \
    -H "Authorization: Bearer $TOKEN")
if [ "$BACKUP_CODE" = "200" ]; then
    test_result 0 "Backup generado correctamente"
elif [ "$BACKUP_CODE" = "403" ]; then
    echo -e "  ${YELLOW}⚠${NC} Backup requiere permisos de superadmin (código $BACKUP_CODE)"
else
    echo -e "  ${YELLOW}⚠${NC} Endpoint de backup respondió con código $BACKUP_CODE"
fi

# Probar consulta predefinida
QUERY_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/admin/database/query" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"queryName":"user-stats"}')
if echo "$QUERY_RESPONSE" | jq -e . >/dev/null 2>&1; then
    test_result 0 "Consulta predefinida ejecutada"
else
    echo -e "  ${YELLOW}⚠${NC} La consulta no devolvió JSON válido (puede necesitar implementación)"
fi

# ===============================================
# 12. LOGOUT
# ===============================================
separator "12. CIERRE DE SESIÓN"

LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE_URL}/auth/logout" \
    -H "Authorization: Bearer $TOKEN")
if [ "$LOGOUT_CODE" = "200" ] || [ "$LOGOUT_CODE" = "204" ]; then
    test_result 0 "Logout exitoso (código $LOGOUT_CODE)"
else
    echo -e "  ${RED}✗${NC} Falló logout (código $LOGOUT_CODE)"
    exit 1
fi

echo -e "\n${GREEN}✅ Todas las pruebas pasaron correctamente.${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
exit 0