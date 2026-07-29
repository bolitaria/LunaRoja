import { Page, expect } from '@playwright/test';

export const CREDENTIALS = {
  username: process.env.TEST_ADMIN_USER || 'admin',
  password: process.env.TEST_ADMIN_PASS || 'admin123',
};

export async function setupApiProxy(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().replace('http://localhost:3000', 'http://localhost:5000');
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

export async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByPlaceholder('Nombre de usuario').fill(CREDENTIALS.username);
  await page.getByPlaceholder('Contraseña').fill(CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
}

export async function createEntityViaApi(endpoint: string, body: any) {
  const tokenRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const { token } = await tokenRes.json();
  const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
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
