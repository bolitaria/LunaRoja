const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

describe('Documents API', () => {
  // Nota: la subida de documentos se hace dentro de cada form de entidad
  // (POST /api/actions, /api/campaigns, /api/bds, /api/reports).
  // No hay endpoint POST /api/documents directo (ver documentRoutes.js).
  test('POST /api/documents devuelve 404 (ruta eliminada a propósito)', async () => {
    const res = await request(API_URL)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Doc test' });
    expect(res.statusCode).toBe(404);
  });

  test('Listar documentos (admin)', async () => {
    const res = await request(API_URL)
      .get('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('Listar documentos sin token devuelve 401', async () => {
    const res = await request(API_URL).get('/api/documents');
    expect(res.statusCode).toBe(401);
  });
});
