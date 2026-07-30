import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear una nueva empresa BDS y verificar que se guardó', async ({ page }) => {
  await authenticate(page);
  const empresa = await createEntityViaApi('bds', { name: 'BDS Automatizada Playwright', description: 'Descripción automatizada de pruebas.' });
  await page.goto(`/admin/bds/${empresa.id}/edit`);
  await expect(page.locator('input[type="text"]:visible').first()).toHaveValue('BDS Automatizada Playwright', { timeout: 10000 });
});
