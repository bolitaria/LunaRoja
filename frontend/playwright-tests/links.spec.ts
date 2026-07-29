import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear un nuevo enlace y verificar en edición', async ({ page }) => {
  await loginViaApi(page);

  const enlace = await createEntityViaApi('links', {
    title: 'Enlace API Playwright',
    url: 'https://playwright.dev',
    description: 'Creado vía API',
    category: 'general',
  });

  await page.goto(`/admin/links/${enlace.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toHaveValue('Enlace API Playwright', { timeout: 10000 });
});
