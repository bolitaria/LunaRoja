const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
jest.setTimeout(15000);

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

    test('Intentar firmar petición inexistente devuelve 404', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await request(API_URL)
        .post('/api/petitions/99999/sign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'test@test.com', name: 'Test' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Firmas de peticiones', () => {
    let signPetitionId;

    beforeAll(async () => {
      const res = await request(API_URL)
        .post('/api/petitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Petición para firmas',
          content: 'Firma esto',
          target_emails: ['target@example.com'],
          total_signatures: 0,
          signature_fields: [
            { name: 'email', label: 'Email', type: 'email', required: true, unique: true },
            { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          ],
          type: 'custom',
          urgency: false,
          hidden: false,
          email_body_template: '',
          emailTemplateId: 1,
        });
      signPetitionId = res.body.id;
    });

    afterAll(async () => {
      if (signPetitionId) {
        await request(API_URL)
          .delete(`/api/petitions/${signPetitionId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    test('Firmar petición con datos válidos', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await request(API_URL)
        .post(`/api/petitions/${signPetitionId}/sign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'firma1@test.com', nombre: 'Juan' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('Firma registrada');
    });

    test('Evitar firma duplicada (mismo email)', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await request(API_URL)
        .post(`/api/petitions/${signPetitionId}/sign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'firma1@test.com', nombre: 'Juan' });
      expect(res.statusCode).toBe(409);
    });

    test('Firma con campos requeridos faltantes', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await request(API_URL)
        .post(`/api/petitions/${signPetitionId}/sign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'firma2@test.com' });
      expect(res.statusCode).toBe(400);
    });
  });
});