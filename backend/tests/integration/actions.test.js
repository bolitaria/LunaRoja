const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

describe('Actions API', () => {
  let adminToken;
  let createdActionId;

  beforeAll(async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({ username: 'admin', password: ADMIN_PASSWORD });
    adminToken = res.body.token;
  });

  afterAll(async () => {
    if (createdActionId) {
      await request(API_URL)
        .delete(`/api/actions/${createdActionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  test('Crear acción', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Action',
        description: 'Desc',
        category: 'protest',
        datetime: '2026-12-31T10:00:00Z',
        locationType: 'presencial',
        placeName: 'Plaza Test',
        onlineLink: '',
        address: '',
        latitude: 0,
        longitude: 0,
        registrationLink: '',
        recordingUrl: '',
        campaignId: null,
        bdsId: null,
        featuredImage: '',
        groups: '',
        documentLink: '',
        document: '',
        urgent: false,
        enableAttendance: false,
      });
    expect(res.statusCode).toBe(201);
    createdActionId = res.body.id;
  });
});