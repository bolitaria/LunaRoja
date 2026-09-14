import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Configuración
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const RAMP_UP_TIME = '30s';
const DURATION = '2m';
const TARGET_VUS = 50;

export const options = {
  stages: [
    { duration: RAMP_UP_TIME, target: TARGET_VUS },
    { duration: DURATION, target: TARGET_VUS },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // p95 < 300 ms
    http_req_failed: ['rate<0.05'],   // < 5% errores
  },
};

// Métricas personalizadas (opcional)
const errorRate = new Rate('failed_requests');
const durationTrend = new Trend('request_duration');

export default function () {
  // Simular diferentes páginas y filtros
  const page = Math.floor(Math.random() * 5) + 1; // 1 a 5
  const limit = 12;
  const searchTerms = ['', 'paz', 'solidaridad', 'derechos'];
  const search = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const statuses = ['', 'active', 'upcoming', 'past'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const params = {
    page,
    limit,
  };
  if (search) params.search = search;
  if (status) params.status = status;

  const url = `${BASE_URL}/api/campaigns?${Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;

  const res = http.get(url, {
    headers: { 'Accept': 'application/json' },
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json('data') !== undefined,
  });

  errorRate.add(!success);
  durationTrend.add(res.timings.duration);

  sleep(1);
}