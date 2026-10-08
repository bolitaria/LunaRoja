import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const page = Math.floor(Math.random() * 5) + 1;
  const baseUrl = __ENV.API_URL || 'http://localhost:5000';
  const res = http.get(`${baseUrl}/api/actions?page=${page}&limit=12`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}