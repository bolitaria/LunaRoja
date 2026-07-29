import { Page, expect } from '@playwright/test';

export const CREDENTIALS = {
  username: process.env.TEST_ADMIN_USER || 'admin',
  password: process.env.TEST_ADMIN_PASS || 'admin123',
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function fetchWithRetry(url: string, options: RequestInit, retries = 10, delay = 3000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('fetchWithRetry: unreachable');
}

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
      const response = await fetchWithRetry(url, fetchOptions);
      const body = await response.text();
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body });
    } catch (error) {
      await route.continue();
    }
  });
}

export async function loginViaApi(page: Page) {
  const res = await fetchWithRetry(`${BACKEND_URL}/api/auth/login`, {
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

  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  return token;
}

export async function createEntityViaApi(endpoint: string, body: any) {
  const tokenRes = await fetchWithRetry(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const { token } = await tokenRes.json();
  const res = await fetchWithRetry(`${BACKEND_URL}/api/${endpoint}`, {
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
