import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear un nuevo enlace con categoría bibliografía y verificar que se guardó', async ({ page }) => {
  await authenticate(page);

  const enlace = await createEntityViaApi('links', {
    title: 'Enlace API Playwright',
    url: 'https://playwright.dev',
    description: 'Creado vía API',
    category: 'bibliografia'
  });

  expect(enlace).toHaveProperty('id');

  await page.goto(`/admin/links/${enlace.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 10000 });
});
