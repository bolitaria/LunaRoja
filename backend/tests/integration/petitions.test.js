const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken, petitionId, emailTemplateId;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;

  const templateRes = await request(API_URL)
    .post('/api/email-templates')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'template_test_' + Date.now(),
      subject: 'Test Subject',
      body: '<p>Test body {{username}}</p>',
      headerColor: '#b91c1c',
      buttonColor: '#16a34a',
      footerColor: '#1f2937',
      backgroundColor: '#f3f4f6',
    });
  emailTemplateId = templateRes.body.id;
}, 15000);

afterAll(async () => {
  if (petitionId) {
    await request(API_URL)
      .delete(`/api/petitions/${petitionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }
  if (emailTemplateId) {
    await request(API_URL)
      .delete(`/api/email-templates/${emailTemplateId}`)
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
        description: 'Desc',
        type: 'internal',
        target_emails: ['test@example.com'],
        emailTemplateId,
        signature_fields: [{ name: 'Nombre', type: 'text', required: true }],
        content: '<p>Contenido</p>',
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
          type: 'internal',
          target_emails: ['test@example.com'],
          emailTemplateId,
          signature_fields: [{ name: 'Nombre', type: 'text', required: true }],
          content: '<p>Contenido</p>',
        });
      expect(res.statusCode).toBe(400);
    });

    test('Crear petición con target_emails como string separado por comas', async () => {
      const res = await request(API_URL)
        .post('/api/petitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test emails',
          type: 'internal',
          target_emails: 'a@b.com,c@d.com',
          emailTemplateId,
          signature_fields: [{ name: 'Nombre', type: 'text', required: true }],
          content: '<p>Test</p>',
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
