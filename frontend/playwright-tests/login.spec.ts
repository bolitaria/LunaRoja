import { test, expect } from '@playwright/test';
import { setupApiProxy, CREDENTIALS } from './utils';

test('Autenticación vía API y acceso al dashboard', async ({ page }) => {
  await setupApiProxy(page);

  // Obtener token JWT directamente del backend
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const data = await res.json();
  const token = data.token;

  // Inyectar el token en localStorage
  await page.goto('/admin/login');
  await page.evaluate((t) => localStorage.setItem('token', t), token);

  // Navegar al dashboard ya autenticado
  await page.goto('/admin');
  await expect(page.locator('h1, h2, .dashboard-title').first()).toContainText(/Dashboard|Panel/);
});
