import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear un nuevo reporte y verificar en edición', async ({ page }) => {
  await loginViaApi(page);

  const reporte = await createEntityViaApi('reports', {
    title: 'Reporte API Playwright',
    description: 'Creado vía API',
    content: '<p>Contenido</p>',
    type: 'blog',
    source: '',
    author: 'Playwright',
  });

  await page.goto(`/admin/reports/${reporte.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toHaveValue('Reporte API Playwright', { timeout: 10000 });
});
