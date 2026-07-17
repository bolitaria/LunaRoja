const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
jest.setTimeout(60000);

let adminToken, bdsId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (bdsId) await request(API_URL).delete(`/api/bds/${bdsId}`).set('Authorization', `Bearer ${adminToken}`);
});

describe('BDS API', () => {
  test('Crear entrada BDS', async () => {
    const res = await request(API_URL)
      .post('/api/bds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Empresa Test', description: 'Desc', color: '#0000ff', imageUrl: '', groups: '', documentLink: '', document: '' });
    expect(res.statusCode).toBe(201);
    bdsId = res.body.id;
  });

  test('Listar BDS', async () => {
    const res = await request(API_URL).get('/api/bds').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});