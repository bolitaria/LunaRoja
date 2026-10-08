import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear un nuevo reporte y verificar en edición', async ({ page }) => {
  await authenticate(page);
  const reporte = await createEntityViaApi('reports', {
    title: 'Reporte API Playwright', description: 'Creado vía API', content: '<p>Contenido</p>', type: 'blog', source: '', author: 'Playwright'
  });
  await page.goto(`/admin/reports/${reporte.id}/edit`);
  await expect(page.locator('input[type="text"]:visible').first()).toHaveValue('Reporte API Playwright', { timeout: 10000 });
});
