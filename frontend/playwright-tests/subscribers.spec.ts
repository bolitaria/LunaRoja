import { test, expect } from '@playwright/test';
import { authenticate } from './utils';

test('La sección de suscriptores carga correctamente', async ({ page }) => {
  await authenticate(page);
  await page.goto('/admin/subscribers');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1, h2, table')).not.toHaveCount(0);
});
