const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let token;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  token = res.body.token;
}, 15000);

const PAGINATED_ENDPOINTS = [
  '/api/actions',
  '/api/campaigns',
  '/api/bds',
  '/api/petitions',
  '/api/reports',
  '/api/news',
];

describe('Contrato de endpoints paginados', () => {
  PAGINATED_ENDPOINTS.forEach((endpoint) => {
    test(`${endpoint} devuelve envelope { data, total }`, async () => {
      const res = await request(API_URL)
        .get(`${endpoint}?limit=5`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);

        if ('total' in res.body) {
          expect(typeof res.body.total).toBe('number');
        }
      }
    });
  });
});
