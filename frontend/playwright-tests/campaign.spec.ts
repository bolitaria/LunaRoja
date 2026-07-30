import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear una nueva campaña y verificar que se guardó', async ({ page }) => {
  await authenticate(page);
  const campaign = await createEntityViaApi('campaigns', { name: 'Campaña Automatizada Playwright', description: 'Desc', privateLink: 'https://example.com' });
  await page.goto(`/admin/campaigns/${campaign.id}/edit`);
  await expect(page.locator('input[type="text"]:visible').first()).toHaveValue('Campaña Automatizada Playwright', { timeout: 10000 });
});
