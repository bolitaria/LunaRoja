#!/bin/bash
# check-secrets.sh – Detecta archivos con variables sensibles rastreados por Git

echo "🔍 Buscando archivos sensibles en Git..."

# Lista de archivos que nunca deberían estar versionados
SENSITIVE_FILES=(
  ".env"
  ".env.local"
  ".env.*.local"
  "backend/.env"
  "frontend/.env.local"
  "credentials.json"
  "service-account-key.json"
  "*.pem"
  "*.key"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
  for file in $(git ls-files -- "$pattern" 2>/dev/null); do
    echo "❌ ALERTA: $file está siendo rastreado por Git (¡no debería!)."
  done
done

# También comprobamos si hay archivos ignorados pero aún presentes en el repositorio
echo "📁 Archivos sensibles ignorados correctamente:"
git status --ignored --short | grep -E '\.env|credentials|\.pem|\.key' || echo "  (ninguno)"

# Buscar patrones de contraseñas/secrets en archivos rastreados (ejemplo básico)
echo "🔎 Buscando posibles secretos en archivos rastreados..."
git grep -E 'password\s*=\s*["'\''][^"'\'']+["'\'']|secret\s*=\s*["'\''][^"'\'']+["'\'']' -- '*.js' '*.json' '*.yml' '*.yaml' 2>/dev/null | grep -v node_modules | grep -v 'password\s*=\s*["'\'']["'\'']' || echo "  (ninguno detectado)"