#!/bin/bash
set -e

echo "🚀 Configurando entorno de pruebas CI/CD..."

# 1. Instalar dependencias de testing en el backend
echo "📦 Instalando Jest y Supertest en el contenedor backend..."
docker-compose exec backend npm install --save-dev jest supertest @jest/globals

# 2. Crear directorio de tests y archivo de test unitario
echo "🧪 Creando tests unitarios para auth..."
mkdir -p backend/__tests__

cat > backend/__tests__/auth.test.js << 'EOF'
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  let adminCookie;

  test('POST /api/auth/login - login exitoso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    const cookies = res.headers['set-cookie'];
    adminCookie = cookies.find(c => c.startsWith('access_token='));
    expect(adminCookie).toBeDefined();
  });

  test('GET /api/auth/me - obtener usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  test('GET /api/auth/me - sin token debe fallar', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/dashboard - endpoint protegido con cookie', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Cookie', adminCookie);
    // Puede ser 200 o 500 si no hay datos, pero no 401
    expect(res.statusCode).not.toBe(401);
  });
});
EOF

# 3. Añadir scripts de test al package.json del backend
echo "🛠️  Actualizando package.json del backend..."
docker-compose exec backend node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.test = 'jest';
pkg.scripts['test:watch'] = 'jest --watch';
pkg.scripts['test:ci'] = 'jest --ci --coverage';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# 4. Crear smoke_test.sh para pruebas rápidas desde consola
echo "🌪️  Creando smoke_test.sh..."
cat > smoke_test.sh << 'EOF'
#!/bin/bash
set -e

BASE_URL="http://localhost:5000/api"
COOKIE_FILE=$(mktemp)

echo "=== Login ==="
curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq .

echo "=== Verificar sesión ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/auth/me" | jq .

echo "=== Dashboard ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/dashboard" | jq .

echo "=== Usuarios ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/users" | jq .

echo "=== Logout ==="
curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/auth/logout" | jq .

echo "=== Probar acceso sin token ==="
curl -s "$BASE_URL/auth/me" | jq .

rm "$COOKIE_FILE"
echo "✅ Smoke tests completados."
EOF
chmod +x smoke_test.sh

echo "✅ Configuración de pruebas completada."
echo "   🧪 Ejecuta los tests unitarios: docker-compose exec backend npm test"
echo "   🌪️  Ejecuta el smoke test: ./smoke_test.sh"