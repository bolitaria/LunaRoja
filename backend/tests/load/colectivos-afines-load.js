import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
};

export default function () {
  const loginRes = http.post('http://localhost:5000/api/auth/login', JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, { 'login ok': (r) => r.status === 200 });
  const token = JSON.parse(loginRes.body).token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const createForm = {
    link: 'https://k6-test.com',
    nombre: 'K6 Test',
    imagen: http.file(Buffer.from('simulated'), 'test.png', 'image/png'),
  };
  const createRes = http.post('http://localhost:5000/api/colectivosAfines', createForm, authHeaders);
  check(createRes, { 'creado': (r) => r.status === 201 });

  const publicRes = http.get('http://localhost:5000/api/colectivosAfines/public');
  check(publicRes, { 'listado público': (r) => r.status === 200 });

  sleep(1);
}
