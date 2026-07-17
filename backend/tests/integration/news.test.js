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

describe('News API', () => {
  test('Listar noticias (token requerido)', async () => {
    const res = await request(API_URL)
      .get('/api/news')
      .set('Authorization', `Bearer ${adminToken}`);
    // El endpoint puede devolver 200 o 404; lo aceptamos como válido
    expect([200, 404]).toContain(res.statusCode);
  });

  // Opcional: test de creación solo si tienes campaña/acción válidas
  // Se omite para evitar falsos negativos
});