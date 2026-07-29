import { test, expect } from '@playwright/test';
import { loginViaApi } from './utils';

test('Autenticación vía API y acceso al dashboard', async ({ page }) => {
  await loginViaApi(page);

  // Navegar al dashboard ya autenticado
  await page.goto('/admin/dashboard');
  await expect(page.locator('h1, h2, .dashboard-title').first()).toContainText(/Dashboard|Panel/);
});
