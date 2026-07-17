const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Subscribers API', () => {
  test('Suscribir nuevo email', async () => {
    const email = `test_${Date.now()}@example.com`;
    const res = await request(API_URL)
      .post('/api/subscribers')
      .send({ email });
    expect(res.statusCode).toBe(201);
  });

  test('Intentar suscribir email duplicado devuelve error', async () => {
    const email = `duplicate_${Date.now()}@example.com`;
    await request(API_URL).post('/api/subscribers').send({ email });
    const res = await request(API_URL).post('/api/subscribers').send({ email });
    expect([400, 409]).toContain(res.statusCode);
  });
});