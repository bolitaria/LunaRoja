import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear una nueva campaña y verificar que se guardó', async ({ page }) => {
  await loginViaApi(page);

  const campaign = await createEntityViaApi('campaigns', {
    name: 'Campaña Automatizada Playwright',
    description: 'Descripción de prueba',
    privateLink: 'https://example.com',
  });

  await page.goto(`/admin/campaigns/${campaign.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toHaveValue('Campaña Automatizada Playwright', { timeout: 10000 });
});
