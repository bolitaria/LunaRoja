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

describe('Validaciones de campos obligatorios y formatos', () => {
  test('Acción sin título rechazada', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ datetime: '2027-01-01T10:00', locationType: 'presencial', address: 'Calle' });
    expect(res.status).toBe(400);
  });

  test('Campaña sin nombre rechazada', async () => {
    const res = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Descripción' });
    expect(res.status).toBe(400);
  });

  test('Reporte sin título ni contenido ni archivo rechazado', async () => {
    const res = await request(API_URL)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'blog' });
    expect(res.status).toBe(400);
  });

  test('Email duplicado en suscripción devuelve error', async () => {
    const email = 'dup_' + Date.now() + '@test.com';
    await request(API_URL).post('/api/subscribers').send({ email });
    const res = await request(API_URL).post('/api/subscribers').send({ email });
    expect(res.status).toBe(400);
  });

  test('Formato de email inválido rechazado', async () => {
    const res = await request(API_URL).post('/api/subscribers').send({ email: 'noemail' });
    expect(res.status).toBe(400);
  });
});
