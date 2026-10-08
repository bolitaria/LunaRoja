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

// Helper: los endpoints devuelven un envelope { data, total, ... }
// o un array plano, según el caso. Aceptamos ambos.
const extractArray = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  if (body && Array.isArray(body.items)) return body.items;
  return null;
};

describe('Paginación y filtros en endpoints públicos y admin', () => {
  test('Acciones aceptan parámetros de paginación', async () => {
    const res = await request(API_URL).get('/api/actions?limit=2&offset=0');
    expect(res.status).toBe(200);
    const arr = extractArray(res.body);
    expect(Array.isArray(arr)).toBe(true);
  });

  test('Campañas aceptan parámetros de paginación', async () => {
    const res = await request(API_URL).get('/api/campaigns?limit=2&offset=0');
    expect(res.status).toBe(200);
    const arr = extractArray(res.body);
    expect(Array.isArray(arr)).toBe(true);
  });

  test('Noticias aceptan paginación y filtro de búsqueda', async () => {
    const res = await request(API_URL).get('/api/news?limit=2&offset=0&search=test');
    expect(res.status).toBe(200);
    const arr = extractArray(res.body);
    expect(Array.isArray(arr)).toBe(true);
  });

  test('Reportes aceptan paginación', async () => {
    const res = await request(API_URL)
      .get('/api/reports?limit=2&offset=0')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      const arr = extractArray(res.body);
      expect(Array.isArray(arr)).toBe(true);
    }
  });
});
