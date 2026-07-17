const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken, linkId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
  jest.setTimeout(10000);
});

afterAll(async () => {
  if (linkId) await request(API_URL).delete(`/api/links/${linkId}`).set('Authorization', `Bearer ${adminToken}`);
});

describe('Links API', () => {
  test('Crear enlace', async () => {
    const res = await request(API_URL)
      .post('/api/links')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Enlace test',
        url: 'https://example.com',
        description: 'Desc',
        category: 'local',
        active: true,
        // created_by se asigna automáticamente a partir del token
      });
    expect(res.statusCode).toBe(201);
    linkId = res.body.id;
  });

  test('Listar enlaces', async () => {
    const res = await request(API_URL).get('/api/links').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});