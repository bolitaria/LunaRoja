import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
};

const BASE_URL = __ENV.API_URL || 'http://localhost';

export default function () {
  const urls = ['/api/actions', '/api/campaigns', '/api/news', '/api/colectivosAfines/public', '/api/images', '/api/bds'];
  for (const url of urls) {
    const res = http.get(`${BASE_URL}${url}`);
    check(res, { [`${url} status 200`]: (r) => r.status === 200 });
  }
  sleep(2);
}