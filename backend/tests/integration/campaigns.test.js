const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
jest.setTimeout(60000);

let adminToken, campaignId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (campaignId) await request(API_URL).delete(`/api/campaigns/${campaignId}`).set('Authorization', `Bearer ${adminToken}`);
});

describe('Campaigns API', () => {
  test('Crear campaña', async () => {
    const res = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Campaña test', description: 'Desc', color: '#ff0000', imageUrl: '', groups: '', documentLink: '', document: '' });
    expect(res.statusCode).toBe(201);
    campaignId = res.body.id;
  });

  test('Listar campañas', async () => {
    const res = await request(API_URL).get('/api/campaigns').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});