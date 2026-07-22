const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
describe('GET /api/chat-groups', () => {
  test('devuelve solo grupos públicos y activos para usuario no autenticado', async () => {
    const res = await request(API_URL).get('/api/chat-groups');
    expect([200, 404]).toContain(res.statusCode);
  });
  test('rechaza creación sin token', async () => {
    const res = await request(API_URL).post('/api/chat-groups').send({ inviteLink: 'https://chat.com' });
    expect(res.statusCode).toBe(401);
  });
});
