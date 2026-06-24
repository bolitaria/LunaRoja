const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Auth API', () => {
  let adminCookie;

  test('POST /api/auth/login - login exitoso', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    const cookies = res.headers['set-cookie'];
    adminCookie = cookies.find(c => c.startsWith('access_token='));
    expect(adminCookie).toBeDefined();
  });

  test('GET /api/auth/me - usuario autenticado con cookie', async () => {
    const res = await request(API_URL)
      .get('/api/auth/me')
      .set('Cookie', adminCookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  test('GET /api/auth/me - sin token debe fallar', async () => {
    const res = await request(API_URL).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/dashboard - acceso con cookie (debe ser superadmin)', async () => {
    const res = await request(API_URL)
      .get('/api/dashboard')
      .set('Cookie', adminCookie);
    expect(res.statusCode).not.toBe(401);
  });
});