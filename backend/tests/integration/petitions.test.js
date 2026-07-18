const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
jest.setTimeout(10000);

let adminToken, petitionId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (petitionId) {
    await request(API_URL)
      .delete(`/api/petitions/${petitionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
});

describe('Petitions API', () => {
  test('Crear petición', async () => {
    const res = await request(API_URL)
      .post('/api/petitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Petición test',
        content: 'Contenido',
        target_emails: ['test@example.com'],
        total_signatures: 0,
        signature_fields: [],
        type: 'custom',
        external_url: '',
        urgency: true,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        hidden: false,
        email_body_template: '',
        emailTemplateId: 1,
        featured_image: '',
        created_by: 1,
      });
    expect(res.statusCode).toBe(201);
    petitionId = res.body.id;
  });

  test('Listar peticiones', async () => {
    const res = await request(API_URL)
      .get('/api/petitions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  describe('Edge cases en peticiones', () => {
    test('Crear petición sin título debe fallar', async () => {
      const res = await request(API_URL)
        .post('/api/petitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Sin título',
          target_emails: ['test@example.com'],
          total_signatures: 0,
          signature_fields: [],
          type: 'custom',
          urgency: false,
          hidden: false,
          email_body_template: '',
          emailTemplateId: 1,
        });
      expect(res.statusCode).toBe(400);
    });

    test('Crear petición con target_emails como string separado por comas', async () => {
      const res = await request(API_URL)
        .post('/api/petitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Petición con emails string',
          content: 'Contenido',
          target_emails: 'correo@example.com, otro@example.com',
          total_signatures: 0,
          signature_fields: [],
          type: 'custom',
          urgency: false,
          hidden: false,
          email_body_template: '',
          emailTemplateId: 1,
        });
      expect(res.statusCode).toBe(201);
      if (res.body.id) {
        await request(API_URL)
          .delete(`/api/petitions/${res.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });
  });
});