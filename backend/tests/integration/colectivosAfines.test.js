const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;
let noSuperadminToken;

beforeAll(async () => {
  const resAdmin = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = resAdmin.body.token;

  const resNoSuper = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'action_admin_user', password: 'test123' });

  if (resNoSuper.status === 200) {
    noSuperadminToken = resNoSuper.body.token;
  } else {
    await request(API_URL)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'action_admin_user',
        email: 'action@example.com',
        password: 'test123',
        role: 'action_admin'
      });
    const resNew = await request(API_URL)
      .post('/api/auth/login')
      .send({ username: 'action_admin_user', password: 'test123' });
    noSuperadminToken = resNew.body.token;
  }
}, 30000);

describe('Colectivos Afines API', () => {
  describe('POST /api/colectivosAfines', () => {
    it('rechaza usuario no superadmin', async () => {
      const res = await request(API_URL)
        .post('/api/colectivosAfines')
        .set('Authorization', `Bearer ${noSuperadminToken}`)
        .field('name', 'Test Colectivo')
        .field('link', 'https://test.com')
        .attach('imagen', Buffer.from('fake'), 'test.png');
      expect(res.status).toBe(403);
    });

    it('rechaza sin token', async () => {
      const res = await request(API_URL)
        .post('/api/colectivosAfines')
        .field('name', 'Test')
        .field('link', 'https://test.com');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/colectivosAfines/public', () => {
    it('devuelve lista pública sin autenticación', async () => {
      const res = await request(API_URL)
        .get('/api/colectivosAfines/public');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/colectivosAfines/:id', () => {
    let id;
    beforeAll(async () => {
      const res = await request(API_URL)
        .get('/api/colectivosAfines/public');
      if (res.body.data && res.body.data.length > 0) {
        id = res.body.data[0].id;
      }
    });

    it('obtiene por ID (admin)', async () => {
      if (!id) return;
      const res = await request(API_URL)
        .get(`/api/colectivosAfines/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
    });

    it('rechaza sin autenticación', async () => {
      if (!id) return;
      const res = await request(API_URL)
        .get(`/api/colectivosAfines/${id}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/colectivosAfines/:id', () => {
    let id;
    beforeAll(async () => {
      const res = await request(API_URL)
        .get('/api/colectivosAfines/public');
      if (res.body.data && res.body.data.length > 0) {
        id = res.body.data[0].id;
      }
    });

    it('actualiza link y nombre sin cambiar imagen', async () => {
      if (!id) return;
      const res = await request(API_URL)
        .put(`/api/colectivosAfines/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('link', 'https://nuevo-link.org')
        .field('nombre', 'Nombre Actualizado');
      expect(res.status).toBe(200);
      expect(res.body.data.link).toBe('https://nuevo-link.org');
    });
  });

  describe('DELETE /api/colectivosAfines/:id', () => {
    let id;
    beforeAll(async () => {
      const res = await request(API_URL)
        .get('/api/colectivosAfines/public');
      if (res.body.data && res.body.data.length > 0) {
        id = res.body.data[0].id;
      }
    });

    it('elimina un colectivo (admin)', async () => {
      if (!id) return;
      const res = await request(API_URL)
        .delete(`/api/colectivosAfines/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
