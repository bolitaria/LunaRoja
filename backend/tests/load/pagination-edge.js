import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 1, iterations: 10 };

const BASE_URL = __ENV.API_URL || 'http://localhost';

export default function () {
  const cases = [
    '/api/actions?page=999999&limit=12',   // página muy alta
    '/api/actions?page=0&limit=12',        // página cero
    '/api/actions?page=-1&limit=12',       // página negativa
    '/api/actions?limit=1000',             // límite excesivo
    '/api/actions?limit=abc',              // límite no numérico
    '/api/actions?category=noexiste',      // categoría inexistente
    '/api/actions?status=invalid',         // estado inválido
  ];

  for (const path of cases) {
    const res = http.get(`${BASE_URL}${path}`);
    check(res, {
      [`${path} status <= 400`]: (r) => r.status <= 400, // no 5xx
    });
  }
}