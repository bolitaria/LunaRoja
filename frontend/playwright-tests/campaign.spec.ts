import { test, expect } from '@playwright/test';
import { setupApiProxy, login, CREDENTIALS } from './utils';

const TITULO_CAMPANA = 'Campaña Automatizada Playwright';

test('Flujo completo de creación de campaña (UI real)', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Ir a nueva campaña
  await page.goto('/admin/campaigns/new');
  await page.waitForLoadState('networkidle');

  // Rellenar formulario con los nombres reales de los campos
  await page.fill('input[name="name"]', TITULO_CAMPANA);
  await page.fill('textarea[name="description"]', 'Descripción generada por pruebas E2E');
  await page.fill('input[name="privateLink"]', 'https://example.com/detalles-campana');
  await page.locator('#docFilePublicCampNew').setInputFiles('cypress/fixtures/test-image.jpeg');

  // Enviar y esperar redirección a la lista de campañas
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/campaigns', { timeout: 10000 });

  // Buscar la campaña creada
  const searchInput = page.locator('input[placeholder="Buscar..."]');
  await searchInput.fill(TITULO_CAMPANA);
  await page.waitForTimeout(1000);

  // Verificar que la campaña aparece en la tabla
  const campaignSpan = page.locator('span.font-medium.text-gray-900', { hasText: TITULO_CAMPANA });
  await expect(campaignSpan.first()).toBeVisible({ timeout: 10000 });
});
