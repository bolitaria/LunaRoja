import { Page, expect } from '@playwright/test';

export const CREDENTIALS = {
  username: process.env.TEST_ADMIN_USER || 'admin',
  password: process.env.TEST_ADMIN_PASS || 'admin123',
};

// URL del backend desde el contenedor de Playwright (en CI se usa localhost:5000)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function setupApiProxy(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().replace('http://localhost:3000', BACKEND_URL);
    const method = route.request().method();
    const headers = route.request().headers();
    delete headers['host'];
    delete headers['connection'];
    const fetchOptions: any = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') fetchOptions.body = route.request().postData() || undefined;
    try {
      const response = await fetch(url, fetchOptions);
      const body = await response.text();
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body });
    } catch (error) {
      await route.continue();
    }
  });
}

// Nueva función: login vía API, devuelve el token y lo inyecta en localStorage
export async function loginViaApi(page: Page) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login API falló: ${res.status} ${text}`);
  }
  const data = await res.json();
  const token = data.token;

  // Inyectar token en localStorage (igual que lo hace el frontend)
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  return token;
}

export async function createEntityViaApi(endpoint: string, body: any) {
  const tokenRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const { token } = await tokenRes.json();
  const res = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear ${endpoint}: ${res.status} ${errorText}`);
  }
  return res.json();
}
