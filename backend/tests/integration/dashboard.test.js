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

describe('Dashboard API', () => {
  test('Obtener estadísticas del dashboard (admin)', async () => {
    const res = await request(API_URL)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    // La estructura exacta depende de tu controlador; verifica que tenga datos
    expect(res.body).toBeDefined();
  });

  test('Usuario sin token no puede acceder al dashboard', async () => {
    const res = await request(API_URL).get('/api/dashboard');
    expect(res.statusCode).toBe(401);
  });
});