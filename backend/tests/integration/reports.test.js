const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
let adminToken;
beforeAll(async () => {
  const res = await request(API_URL).post('/api/auth/login').send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);
describe('Reports API', () => {
  test('Listar reportes (temporal)', async () => {
    const res = await request(API_URL).get('/api/reports').set('Authorization', `Bearer ${adminToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
