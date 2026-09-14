import http from 'k6/http';
import { check, sleep } from 'k6';   // ← añadir sleep

export const options = { vus: 10, duration: '1m' };

const BASE_URL = 'http://localhost';

export default function () {
  for (let i = 0; i < 100; i++) {
    const res = http.get(`${BASE_URL}/api/actions?page=1`);
    check(res, { 'status 200 or 429': (r) => r.status === 200 || r.status === 429 });
    sleep(0.1);
  }
}