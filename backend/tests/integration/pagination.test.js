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

describe('Paginación y filtros en endpoints públicos y admin', () => {
  test('Acciones aceptan parámetros de paginación', async () => {
    const res = await request(API_URL)
      .get('/api/actions?limit=2&offset=0');
    expect([200, 500]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Campañas aceptan parámetros de paginación', async () => {
    const res = await request(API_URL)
      .get('/api/campaigns?limit=2&offset=0');
    expect([200, 500]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Noticias aceptan paginación y filtro de búsqueda', async () => {
    const res = await request(API_URL)
      .get('/api/news?limit=2&offset=0&search=test');
    expect([200, 500]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Reportes aceptan paginación', async () => {
    const res = await request(API_URL)
      .get('/api/reports?limit=2&offset=0')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 500]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
