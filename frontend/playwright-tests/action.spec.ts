import { test, expect } from '@playwright/test';
import { setupApiProxy, login, CREDENTIALS } from './utils';

const TITULO_ACCION = 'Acción Automatizada Playwright';

test('Crear una nueva acción y verificar que se guardó correctamente', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Ir a nueva acción
  await page.goto('/admin/actions/new');
  await page.waitForLoadState('networkidle');

  // Rellenar campos obligatorios
  await page.fill('input[name="title"]', TITULO_ACCION);
  await page.fill('textarea[name="description"]', 'Descripción de la acción automatizada');
  await page.locator('input[name="linkType"]').first().check();
  await page.selectOption('select[name="category"]', { index: 1 });
  await page.fill('input[name="datetime"]', '2026-08-15T10:00');
  await page.locator('#docFilePublicAction').setInputFiles('cypress/fixtures/test-image.jpeg');

  // Enviar y capturar la respuesta
  const [createResponse] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/actions') && res.request().method() === 'POST' && res.status() === 201),
    page.click('button[type="submit"]')
  ]);

  const responseBody = await createResponse.json();
  const actionId = responseBody.id;

  // Verificar redirección
  await page.waitForURL('**/admin/actions', { timeout: 10000 });

  // Navegar a la página de edición y comprobar el título
  await page.goto(`/admin/actions/${actionId}/edit`);
  await page.waitForLoadState('networkidle');
  const titleInput = page.locator('input[name="title"]');
  await expect(titleInput).toHaveValue(TITULO_ACCION);
});
