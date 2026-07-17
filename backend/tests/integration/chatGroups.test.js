const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('GET /api/chat-groups', () => {
  it('devuelve solo grupos públicos y activos para usuario no autenticado', async () => {
    const res = await request(API_URL)
      .get('/api/chat-groups')
      .expect(200);
    expect(res.body.every(g => g.isPublic && g.isActive)).toBe(true);
  });

  it('rechaza creación sin token', async () => {
    await request(API_URL)
      .post('/api/chat-groups')
      .send({ name: 'test' })
      .expect(401);
  });
});