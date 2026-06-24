#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
PASS=0; FAIL=0
pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL + 1)); }

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PRUEBAS COMPLETAS DEL SISTEMA                          ║${NC}"
echo -e "${BLUE}║     Voces Palestinas por la Justicia                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

BASE_URL="http://localhost:5000/api"
COOKIE_FILE=$(mktemp)

cleanup() { rm -f "$COOKIE_FILE"; }
trap cleanup EXIT

# Esperar al backend
echo -e "${YELLOW}⏳ Esperando al backend...${NC}"
for i in {1..20}; do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo -e "  ${GREEN}✓${NC} Backend responde"
    break
  fi
  sleep 2
done

# 1. Tests unitarios
echo -e "${YELLOW}══════════ 1. TESTS UNITARIOS ══════════${NC}"
OUTPUT=$(docker-compose exec -T backend npm test 2>&1) || true
if echo "$OUTPUT" | grep -qE "Tests:[[:space:]]+[0-9]+ passed"; then pass "Tests unitarios pasaron"; else fail "Tests unitarios fallaron"; fi
echo ""

# 2. Login y sesión
echo -e "${YELLOW}══════════ 2. LOGIN Y SESIÓN ══════════${NC}"
curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -q "Login exitoso" && pass "Login" || fail "Login"
curl -s -b "$COOKIE_FILE" "$BASE_URL/auth/me" | grep -q '"id":1' && pass "Sesión" || fail "Sesión"
echo ""

# 3. Endpoints protegidos
echo -e "${YELLOW}══════════ 3. ENDPOINTS PROTEGIDOS (admin) ══════════${NC}"
curl -s -b "$COOKIE_FILE" "$BASE_URL/dashboard" | grep -q '"totals"' && pass "Dashboard" || fail "Dashboard"
curl -s -b "$COOKIE_FILE" "$BASE_URL/users" | grep -qv "refreshToken" && pass "Usuarios (sin refreshToken)" || fail "Usuarios exponen refreshToken"
curl -s -b "$COOKIE_FILE" "$BASE_URL/database" | grep -q '"tables"' && pass "BD info" || fail "BD info"
curl -s -b "$COOKIE_FILE" "$BASE_URL/users/me" | grep -q '"username"' && pass "Perfil" || fail "Perfil"
curl -s -b "$COOKIE_FILE" -X PUT "$BASE_URL/users/me/password" -H "Content-Type: application/json" -d '{"currentPassword":"incorrecta","newPassword":"nueva1234"}' | grep -q "no es correcta" && pass "Cambio contraseña validado" || fail "Cambio contraseña"
echo ""

# 4. Endpoints públicos
echo -e "${YELLOW}══════════ 4. ENDPOINTS PÚBLICOS ══════════${NC}"
rm -f "$COOKIE_FILE"
for ep in news reports actions images chat-groups; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$ep")
  if [ "$code" = "200" ]; then pass "$ep (200)"; else fail "$ep ($code)"; fi
done
echo ""

# 5. Módulo BDS
echo -e "${YELLOW}══════════ 5. MÓDULO BDS ══════════${NC}"
curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' > /dev/null
BDS_RESP=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/bds" -H "Content-Type: application/json" -d '{"name":"BDS Test","description":"Prueba"}')
if echo "$BDS_RESP" | grep -q '"id"'; then pass "Crear BDS"; else fail "Crear BDS (respuesta: $BDS_RESP)"; fi
BDS_COUNT=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/bds" | grep -c '"id"' || echo 0)
if [ "$BDS_COUNT" -gt 0 ] 2>/dev/null; then pass "Listar BDS ($BDS_COUNT)"; else fail "Listar BDS (vacío o fallo)"; fi
echo ""

# 6. Chat Groups
echo -e "${YELLOW}══════════ 6. CHAT GROUPS ══════════${NC}"
CHAT_RESP=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/chat-groups" -H "Content-Type: application/json" -d '{"name":"Grupo Test","platform":"whatsapp","link":"https://chat.whatsapp.com/test"}')
if echo "$CHAT_RESP" | grep -q '"id"'; then pass "Crear grupo"; else fail "Crear grupo (respuesta: $CHAT_RESP)"; fi
if curl -s -b "$COOKIE_FILE" "$BASE_URL/chat-groups" | grep -q '"platform"'; then pass "Listar grupos"; else fail "Listar grupos (respuesta inesperada)"; fi
echo ""

# 7. Logout y acceso anónimo
echo -e "${YELLOW}══════════ 7. LOGOUT Y ACCESO ANÓNIMO ══════════${NC}"
curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/auth/logout" | grep -q "Logout exitoso" && pass "Logout" || fail "Logout"
curl -s "$BASE_URL/auth/me" | grep -q "Acceso denegado\|Token no proporcionado" && pass "Bloqueo anónimo" || fail "Bloqueo anónimo"
echo ""

# 8. Seguridad
echo -e "${YELLOW}══════════ 8. SEGURIDAD ══════════${NC}"
HEADERS=$(curl -s -I "$BASE_URL/auth/me" 2>&1)
echo "$HEADERS" | grep -qi "X-Content-Type-Options" && pass "X-Content-Type-Options" || fail "X-Content-Type-Options"
echo "$HEADERS" | grep -qi "X-Frame-Options" && pass "X-Frame-Options" || fail "X-Frame-Options"
echo "$HEADERS" | grep -qi "RateLimit-Limit" && pass "Rate limiting" || fail "Rate limiting"
COOKIE_H=$(curl -s -c /dev/null -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' -i 2>&1)
echo "$COOKIE_H" | grep -qi "HttpOnly" && pass "Cookie HttpOnly" || fail "Cookie HttpOnly"
echo ""

# Resumen
TOTAL=$((PASS + FAIL))
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
printf "${BLUE}║  ${GREEN}Pasadas: %-3d${BLUE}  ${RED}Fallidas: %-3d${BLUE}  Total: %-3d${BLUE}║\n" $PASS $FAIL $TOTAL
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
[ "$FAIL" -eq 0 ] && echo -e "\n${GREEN}✅ TODAS LAS PRUEBAS SUPERADAS${NC}\n" || echo -e "\n${RED}❌ HAY $FAIL FALLOS${NC}\n"
exit $FAIL