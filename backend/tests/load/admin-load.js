import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const loginDuration = new Trend('admin_login_time');
const actionCreateTime = new Trend('action_create_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'admin_login_time': ['p(95)<500'],
    'action_create_time': ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login falló con status ${loginRes.status}: ${loginRes.body}`);
  }

  const token = loginRes.json('accessToken') || loginRes.json('token');
  if (!token) throw new Error('No se pudo obtener token');

  return { token };
}

export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };

  const listRes = http.get(`${BASE_URL}/api/actions?page=1&limit=10`, params);
  check(listRes, { 'list actions 200': (r) => r.status === 200 });

  const payload = JSON.stringify({
    title: `Acción k6 ${Date.now()}`,
    description: 'Prueba de carga',
    category: 'protest',
    datetime: new Date().toISOString(),
    locationType: 'presencial',
    placeName: 'Test',
    address: 'Calle Test',
  });
  const createRes = http.post(`${BASE_URL}/api/actions`, payload, params);
  actionCreateTime.add(createRes.timings.duration);
  check(createRes, { 'create 201': (r) => r.status === 201 || r.status === 200 });

  if (createRes.status === 201 || createRes.status === 200) {
    const id = createRes.json('id');
    const updateRes = http.put(`${BASE_URL}/api/actions/${id}`, JSON.stringify({ title: 'Actualizada k6' }), params);
    check(updateRes, { 'update 200': (r) => r.status === 200 });
  }

  sleep(2);
}