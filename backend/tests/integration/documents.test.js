const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const path = require('path');
let adminToken;
beforeAll(async () => {
  const res = await request(API_URL).post('/api/auth/login').send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);
describe('Documents API', () => {
  test('Subir documento (PDF rechazado por middleware de imágenes)', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'sample.pdf');
    const res = await request(API_URL).post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Doc test')
      .attach('file', filePath);
    expect([400, 500]).toContain(res.statusCode);
  });
  test('Listar documentos', async () => {
    const res = await request(API_URL).get('/api/documents').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});
