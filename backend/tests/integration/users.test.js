const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;
let createdUserId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (createdUserId) {
    await request(API_URL)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
});

describe('Users API (admin operations)', () => {
  test('Listar todos los usuarios (superadmin)', async () => {
    const res = await request(API_URL)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Crear un usuario nuevo', async () => {
    const uniqueName = `testuser_${Date.now()}`;
    const res = await request(API_URL)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: uniqueName,
        password: 'securePass1',
        email: `${uniqueName}@test.com`,   // ← email obligatorio
        role: 'action_admin',
      });
    expect([201, 200]).toContain(res.statusCode);
    createdUserId = res.body.id;
  });

  test('Actualizar rol de usuario', async () => {
    if (!createdUserId) return;
    const res = await request(API_URL)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'blog_admin' });
    expect(res.statusCode).toBe(200);
  });

  test('Eliminar usuario', async () => {
    if (!createdUserId) return;
    const res = await request(API_URL)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    createdUserId = null;
  });
});
