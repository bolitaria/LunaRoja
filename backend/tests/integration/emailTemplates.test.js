const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken, templateId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

afterAll(async () => {
  if (templateId) {
    await request(API_URL)
      .delete(`/api/email-templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
});

describe('Email Templates API', () => {
  test('Crear plantilla de email', async () => {
    const res = await request(API_URL)
      .post('/api/email-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `template_${Date.now()}`,
        subject: 'Test Subject',
        body: '<p>Test</p>',
      });
    expect(res.status).toBe(201);
    templateId = res.body.id;
  });

  test('Listar plantillas', async () => {
    const res = await request(API_URL)
      .get('/api/email-templates')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Actualizar plantilla', async () => {
    if (!templateId) return;
    const res = await request(API_URL)
      .put(`/api/email-templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subject: 'Updated Subject' });
    expect(res.status).toBe(200);
    expect(res.body.subject).toBe('Updated Subject');
  });

  test('Eliminar plantilla', async () => {
    if (!templateId) return;
    const res = await request(API_URL)
      .delete(`/api/email-templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    templateId = null;
  });
});
