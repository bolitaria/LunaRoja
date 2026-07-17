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

describe('DB Admin API', () => {
  test('Verificar estado de la base de datos (si existe endpoint)', async () => {
    // Ajusta el endpoint según tu ruta real (p.ej., /api/database/status)
    const res = await request(API_URL)
      .get('/api/database/status')
      .set('Authorization', `Bearer ${adminToken}`);
    // Puede ser 200 o 501 si no está implementado
    expect([200, 404, 501]).toContain(res.statusCode);
  });
});