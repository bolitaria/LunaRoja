import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '3m', target: 500 },   // reducido para local
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost';

export default function () {
  const page = Math.floor(Math.random() * 10) + 1;
  const limit = 12;

  const urls = [
    `${BASE_URL}/api/actions?page=${page}&limit=${limit}`,
    `${BASE_URL}/api/campaigns`,
    `${BASE_URL}/api/news`,
  ];

  for (const url of urls) {
    const res = http.get(url);
    check(res, { [`${url} status 200`]: (r) => r.status === 200 });
  }

  sleep(1);
}