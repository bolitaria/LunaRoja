const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Actions API', () => {
  let adminToken;
  beforeAll(async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = res.body.token;
  });

  test('Crear acción', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Action',
        description: 'Desc',
        category: 'protest',
        datetime: '2026-12-31T10:00:00Z',
        locationType: 'presencial',
        placeName: 'Plaza Test',
      });
    expect(res.statusCode).toBe(201);
  });
});