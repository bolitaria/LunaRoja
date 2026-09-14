import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@lunaroja.org';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp-up
    { duration: '3m', target: 20 },   // Mantener
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // p95 < 800 ms para admin
    http_req_failed: ['rate<0.05'],
  },
};

const errorRate = new Rate('failed_requests');
const durationTrend = new Trend('request_duration');

function login() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const success = check(res, { 'login status 200': (r) => r.status === 200 });
  errorRate.add(!success);
  if (success) {
    return res.json('token'); // Ajustar según respuesta real
  }
  return null;
}

function createCampaign(token) {
  const payload = JSON.stringify({
    name: `Campaña de prueba ${Math.random().toString(36).substring(2, 8)}`,
    description: 'Descripción generada para prueba de carga',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });
  const res = http.post(`${BASE_URL}/api/campaigns`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const success = check(res, {
    'create campaign status 201': (r) => r.status === 201,
    'campaign has id': (r) => r.json('id') !== undefined,
  });
  errorRate.add(!success);
  durationTrend.add(res.timings.duration);
  if (success) return res.json('id');
  return null;
}

function updateCampaign(token, id) {
  const res = http.put(`${BASE_URL}/api/campaigns/${id}`, JSON.stringify({
    description: 'Descripción actualizada',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const success = check(res, { 'update campaign status 200': (r) => r.status === 200 });
  errorRate.add(!success);
  durationTrend.add(res.timings.duration);
}

function deleteCampaign(token, id) {
  const res = http.del(`${BASE_URL}/api/campaigns/${id}`, null, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const success = check(res, { 'delete campaign status 200': (r) => r.status === 200 });
  errorRate.add(!success);
  durationTrend.add(res.timings.duration);
}

export default function () {
  const token = login();
  if (!token) {
    sleep(5);
    return;
  }

  group('Campaign CRUD', function () {
    const id = createCampaign(token);
    if (id) {
      updateCampaign(token, id);
      sleep(1);
      deleteCampaign(token, id);
    }
  });

  sleep(3);
}