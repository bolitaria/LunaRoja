import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 1, iterations: 5 };

const BASE_URL = __ENV.API_URL || 'http://localhost';

const imageFile = open('./test-image.jpeg', 'b');

export default function () {
  const formData = {
    image: http.file(imageFile, 'test.jpg', 'image/jpeg'),
  };
  const res = http.post(`${BASE_URL}/api/actions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  check(res, { 'upload status 201': (r) => r.status === 201 });
}