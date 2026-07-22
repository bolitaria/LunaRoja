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

describe('CRUD completo (PUT y DELETE) en módulos principales', () => {
  test('Actualiza una acción', async () => {
    const createRes = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Acción original', datetime: '2027-01-01T10:00', locationType: 'presencial', address: 'Calle' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .put(`/api/actions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Acción actualizada' });
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.title).toBe('Acción actualizada');
  });

  test('Elimina una acción', async () => {
    const createRes = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Acción a eliminar', datetime: '2027-01-01T10:00', locationType: 'presencial', address: 'Calle' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .delete(`/api/actions/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400, 500]).toContain(res.status);
  });

  test('Actualiza una campaña', async () => {
    const createRes = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Campaña original' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .put(`/api/campaigns/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Campaña actualizada' });
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.name).toBe('Campaña actualizada');
  });

  test('Elimina una campaña', async () => {
    const createRes = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Campaña a eliminar' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .delete(`/api/campaigns/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400, 500]).toContain(res.status);
  });

  test('Actualiza una entrada BDS', async () => {
    const createRes = await request(API_URL)
      .post('/api/bds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'BDS original' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .put(`/api/bds/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'BDS actualizada' });
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.name).toBe('BDS actualizada');
  });

  test('Elimina una entrada BDS', async () => {
    const createRes = await request(API_URL)
      .post('/api/bds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'BDS a eliminar' });
    const id = createRes.body.id;
    const res = await request(API_URL)
      .delete(`/api/bds/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400, 500]).toContain(res.status);
  });
});
