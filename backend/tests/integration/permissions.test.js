const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
let adminToken, actionAdminToken;
beforeAll(async () => {
  const resSuper = await request(API_URL).post('/api/auth/login').send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = resSuper.body.token;
  let resAction = await request(API_URL).post('/api/auth/login').send({ username: 'action_admin_user', password: 'test123' });
  if (resAction.status !== 200) {
    await request(API_URL).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({ username: 'action_admin_user', email: 'action@example.com', password: 'test123', role: 'action_admin' });
    resAction = await request(API_URL).post('/api/auth/login').send({ username: 'action_admin_user', password: 'test123' });
  }
  actionAdminToken = resAction.body.token;
}, 30000);
describe('Permisos de roles', () => {
  test('action_admin no puede crear usuarios', async () => {
    const res = await request(API_URL).post('/api/users').set('Authorization', `Bearer ${actionAdminToken}`).send({ username: 'x', password: 'x', role: 'action_admin' });
    expect(res.status).toBe(403);
  });
  test('action_admin no puede ver la lista de usuarios', async () => {
    const res = await request(API_URL).get('/api/users').set('Authorization', `Bearer ${actionAdminToken}`);
    expect(res.status).toBe(403);
  });
});
