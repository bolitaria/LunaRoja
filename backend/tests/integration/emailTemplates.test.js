const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;
let templateId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

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
        name: 'Plantilla test',
        subject: 'Asunto de prueba',
        body: '<p>Hola {{name}}</p>',
        type: 'custom',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    templateId = res.body.id;
  });

  test('Listar plantillas', async () => {
    const res = await request(API_URL)
      .get('/api/email-templates')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Actualizar plantilla', async () => {
    if (!templateId) return;
    const res = await request(API_URL)
      .put(`/api/email-templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subject: 'Asunto actualizado' });
    expect(res.statusCode).toBe(200);
  });

  test('Eliminar plantilla', async () => {
    if (!templateId) return;
    const res = await request(API_URL)
      .delete(`/api/email-templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    templateId = null;
  });
});