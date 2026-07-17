const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

describe('Images API', () => {
  test('Listar imágenes (público)', async () => {
    const res = await request(API_URL).get('/api/images');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('No permitir eliminar sin token', async () => {
    const res = await request(API_URL).delete('/api/images/1');
    expect(res.statusCode).toBe(401);
  });

  test('Eliminar imagen inexistente (autenticado)', async () => {
    const res = await request(API_URL)
      .delete('/api/images/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    // 404 porque la imagen no existe
    expect(res.statusCode).toBe(404);
  });
});