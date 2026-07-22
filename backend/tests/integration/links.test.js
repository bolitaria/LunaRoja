const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken, linkId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

afterAll(async () => {
  if (linkId) {
    await request(API_URL)
      .delete(`/api/links/${linkId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
});

describe('Links API', () => {
  test('Crear enlace', async () => {
    const uniqueUrl = `https://example.com/${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
    const res = await request(API_URL)
      .post('/api/links')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Enlace test',
        url: uniqueUrl,
        category: 'local'
      });
    expect(res.status).toBe(201);
    linkId = res.body.id;
  });

  test('Listar enlaces', async () => {
    const res = await request(API_URL)
      .get('/api/links')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
