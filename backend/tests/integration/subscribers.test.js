const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
describe('Subscribers API', () => {
  test('Suscribir nuevo email', async () => {
    const res = await request(API_URL).post('/api/subscribers').send({ email: `test_${Date.now()}@example.com` });
    expect([200, 201]).toContain(res.statusCode);
  });
  test('Intentar suscribir email duplicado devuelve error', async () => {
    const email = `dup_${Date.now()}@test.com`;
    await request(API_URL).post('/api/subscribers').send({ email });
    const res = await request(API_URL).post('/api/subscribers').send({ email });
    expect(res.statusCode).toBe(400);
  });
});
