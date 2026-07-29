import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Reportes: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  await page.goto('/admin/reports/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toBeVisible();

  const reporte = await createEntityViaApi('reports', {
    title: 'Reporte API Playwright',
    description: 'Creado vía API',
    content: '<p>Contenido de prueba</p>',
    type: 'blog',
    source: '',
    author: 'Playwright'
  });

  await page.goto('/admin/reports');
  await page.waitForLoadState('networkidle');
  await expect(page.locator(`text=${reporte.title}`).first()).toBeVisible();
});
