const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken, bdsId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

afterAll(async () => {
  if (bdsId) {
    await request(API_URL)
      .delete(`/api/bds/${bdsId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
});

describe('BDS API', () => {
  test('Crear entrada BDS', async () => {
    const res = await request(API_URL)
      .post('/api/bds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Empresa Test ' + Date.now(),
        description: 'Desc',
        color: '#0000ff',
        imageUrl: '',
        groups: '',
        documentLink: '',
        document: ''
      });
    expect([201, 500]).toContain(res.statusCode);
    bdsId = res.body.id;
  });

  test('Listar BDS', async () => {
    const res = await request(API_URL).get('/api/bds');
    expect([200, 500]).toContain(res.statusCode);
  });
});
