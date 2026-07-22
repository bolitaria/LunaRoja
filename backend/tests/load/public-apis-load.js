import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const urls = [
    '/api/actions',
    '/api/campaigns',
    '/api/news',
    '/api/colectivosAfines/public',
    '/api/images',
    '/api/bds',
  ];

  for (const url of urls) {
    const res = http.get(`http://localhost:5000${url}`);
    check(res, { [`${url} status 200`]: (r) => r.status === 200 });
  }
  sleep(1);
}
