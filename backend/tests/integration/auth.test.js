const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;
let testUserToken;
let testUserName;

async function login(username, password) {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username, password });
  if (res.status !== 200) return null;
  return res.body.token;
}

beforeAll(async () => {
  const resAdmin = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = resAdmin.body.token;

  testUserName = `changepwd_${Date.now()}`;
  let token = await login(testUserName, 'original123');
  if (!token) {
    const createRes = await request(API_URL)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: testUserName,
        password: 'original123',
        email: `${testUserName}@test.com`,
        role: 'action_admin'
      });
    if (createRes.status !== 201) {
      throw new Error('No se pudo crear el usuario de prueba para change password');
    }
    token = await login(testUserName, 'original123');
  }
  testUserToken = token;
}, 30000);

afterAll(async () => {
  if (testUserName && adminToken) {
    const usersRes = await request(API_URL)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const users = usersRes.body;
    if (Array.isArray(users)) {
      const user = users.find(u => u.username === testUserName);
      if (user) {
        await request(API_URL)
          .delete(`/api/users/${user.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    }
  }
});

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    test('Login exitoso con admin', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ username: 'admin', password: ADMIN_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('Login fallido - contraseña incorrecta', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    test('Login fallido - usuario inexistente', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ username: 'noexiste', password: 'test' });
      expect(res.status).toBe(401);
    });

    test('Login fallido - falta password', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ username: 'admin' });
      expect(res.status).toBe(400);
    });

    test('Login fallido - falta username', async () => {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ password: 'test' });
      expect(res.status).toBe(400);
    });

    test('Bloqueo de cuenta tras 5 intentos fallidos', async () => {
      for (let i = 0; i < 5; i++) {
        await request(API_URL)
          .post('/api/auth/login')
          .send({ username: 'admin', password: 'wrong' });
      }
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ username: 'admin', password: ADMIN_PASSWORD });
      expect([423, 429, 401, 403]).toContain(res.status);
    }, 20000);
  });

  describe('GET /api/users/me', () => {
    test('Obtener datos del usuario autenticado', async () => {
      const res = await request(API_URL)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('admin');
    });

    test('Falla sin token', async () => {
      const res = await request(API_URL).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    test('Falla con token inválido', async () => {
      const res = await request(API_URL)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me/password', () => {
    test('Cambio exitoso', async () => {
      const res = await request(API_URL)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ currentPassword: 'original123', newPassword: 'new123456' });
      expect(res.status).toBe(200);
      const newToken = await login(testUserName, 'new123456');
      await request(API_URL)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ currentPassword: 'new123456', newPassword: 'original123' });
    });

    test('Contraseña actual incorrecta', async () => {
      const res = await request(API_URL)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ currentPassword: 'incorrecta', newPassword: 'new123456' });
      expect(res.status).toBe(400);
    });

    test('Contraseña nueva demasiado corta', async () => {
      const res = await request(API_URL)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ currentPassword: 'original123', newPassword: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('Solicitar restablecimiento', async () => {
      const res = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@test.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Cerrar sesión', async () => {
      const res = await request(API_URL)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
