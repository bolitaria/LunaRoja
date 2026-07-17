const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
jest.setTimeout(10000);

let adminToken, petitionId;

beforeAll(async () => {
  const res = await request(API_URL).post('/api/auth/login').send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (petitionId) await request(API_URL).delete(`/api/petitions/${petitionId}`).set('Authorization', `Bearer ${adminToken}`);
});

describe('Petitions API', () => {
  test('Crear petición', async () => {
    const res = await request(API_URL).post('/api/petitions').set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Petición test', content: 'Contenido', target_emails: ['test@example.com'],
        total_signatures: 0, signature_fields: [], type: 'custom', external_url: '',
        urgency: true,   // BOOLEANO
        deadline: new Date(Date.now() + 86400000).toISOString(), hidden: false,
        email_body_template: '', emailTemplateId: 1, featured_image: '', created_by: 1
      });
    expect(res.statusCode).toBe(201);
    petitionId = res.body.id;
  });

  test('Listar peticiones', async () => {
    const res = await request(API_URL).get('/api/petitions').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});