const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

describe('Uploads de imágenes en acciones y campañas', () => {
  test('crea una acción con imagen destacada', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Acción con imagen')
      .field('datetime', '2027-01-01T10:00')
      .field('locationType', 'presencial')
      .field('address', 'Calle Test')
      .attach('featuredImage', Buffer.from('fake-image'), 'test.jpg');
    expect(res.status).toBe(201);
    expect(res.body.featuredImage).toBeDefined();
  });

  test('crea una campaña con imagen', async () => {
    const res = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Campaña con imagen ' + Date.now())
      .attach('image', Buffer.from('fake-image'), 'campaign.jpg');
    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toBeDefined();
  });
});
