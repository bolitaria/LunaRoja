import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

const TITULO_CAMPANA = 'Campaña Automatizada Playwright';

test('Crear una nueva campaña y verificar que se guardó correctamente', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Crear vía API (sin archivos)
  const campaign = await createEntityViaApi('campaigns', {
    name: TITULO_CAMPANA,
    description: 'Descripción de prueba',
    privateLink: 'https://example.com',
  });

  // Verificar en página de edición
  await page.goto(`/admin/campaigns/${campaign.id}/edit`);
  await page.waitForLoadState('networkidle');

  await page.waitForFunction(() => {
    const input = document.querySelector('input[name="name"]') as HTMLInputElement;
    return input && input.value.length > 0;
  }, { timeout: 10000 });

  await expect(page.locator('input[name="name"]')).toHaveValue(TITULO_CAMPANA);
});
