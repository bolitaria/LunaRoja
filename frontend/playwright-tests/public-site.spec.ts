import { test, expect } from '@playwright/test';

test('La página de inicio muestra enlaces de navegación principales', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Campañas' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Acciones' }).first()).toBeVisible();
});
