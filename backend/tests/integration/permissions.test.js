const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let superadminToken;
let actionAdminToken;
let campaignAdminToken;
let otherActionAdminId;
let otherCampaignId;

beforeAll(async () => {
  // Login superadmin
  const resSuper = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  superadminToken = resSuper.body.token;

  // Crear un action_admin de prueba
  const uniqueAction = `actiontest_${Date.now()}`;
  const resAction = await request(API_URL)
    .post('/api/users')
    .set('Authorization', `Bearer ${superadminToken}`)
    .send({
      username: uniqueAction,
      password: 'Action1234',
      email: `${uniqueAction}@test.com`,
      role: 'action_admin',
    });
  otherActionAdminId = resAction.body.id;

  // Login del action_admin
  const loginAction = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: uniqueAction, password: 'Action1234' });
  actionAdminToken = loginAction.body.token;

  // Crear un campaign_admin de prueba
  const uniqueCampaign = `campaigntest_${Date.now()}`;
  const resCampaign = await request(API_URL)
    .post('/api/users')
    .set('Authorization', `Bearer ${superadminToken}`)
    .send({
      username: uniqueCampaign,
      password: 'Campaign1234',
      email: `${uniqueCampaign}@test.com`,
      role: 'campaign_admin',
    });
  // Login del campaign_admin
  const loginCampaign = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: uniqueCampaign, password: 'Campaign1234' });
  campaignAdminToken = loginCampaign.body.token;

  // Crear una campaña no asignada a nadie (solo referencia)
  const resCamp = await request(API_URL)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${superadminToken}`)
    .send({
      title: 'Campaña no asignada',
      content: 'No debe ser visible para campaign_admin',
    });
  otherCampaignId = resCamp.body.id;
});

afterAll(async () => {
  if (otherActionAdminId) {
    await request(API_URL)
      .delete(`/api/users/${otherActionAdminId}`)
      .set('Authorization', `Bearer ${superadminToken}`);
  }
  if (otherCampaignId) {
    await request(API_URL)
      .delete(`/api/campaigns/${otherCampaignId}`)
      .set('Authorization', `Bearer ${superadminToken}`);
  }
});

describe('Permisos de roles', () => {
  describe('action_admin', () => {
    test('No puede crear usuarios', async () => {
      const res = await request(API_URL)
        .post('/api/users')
        .set('Authorization', `Bearer ${actionAdminToken}`)
        .send({
          username: 'shouldfail',
          password: '123456',
          email: 'fail@test.com',
          role: 'action_admin',
        });
      expect(res.statusCode).toBe(403);
    });

    test('No puede ver la lista de usuarios', async () => {
      const res = await request(API_URL)
        .get('/api/users')
        .set('Authorization', `Bearer ${actionAdminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('campaign_admin', () => {
    test('No puede crear usuarios con rol distinto de action_admin', async () => {
      const res = await request(API_URL)
        .post('/api/users')
        .set('Authorization', `Bearer ${campaignAdminToken}`)
        .send({
          username: 'shouldfail2',
          password: '123456',
          email: 'fail2@test.com',
          role: 'campaign_admin',
        });
      expect(res.statusCode).toBe(403);
    });

    test('No puede crear action_admin sin asignar acciones de sus campañas', async () => {
      const res = await request(API_URL)
        .post('/api/users')
        .set('Authorization', `Bearer ${campaignAdminToken}`)
        .send({
          username: 'shouldfail3',
          password: '123456',
          email: 'fail3@test.com',
          role: 'action_admin',
        });
      // Debe fallar porque no se envían actionIds o las acciones no pertenecen a sus campañas
      expect([400, 403]).toContain(res.statusCode);
    });
  });
});