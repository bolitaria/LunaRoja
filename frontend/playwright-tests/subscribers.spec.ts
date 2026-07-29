import { test, expect } from '@playwright/test';
import { setupApiProxy, login } from './utils';

test('La sección de suscriptores carga correctamente', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);
  await page.goto('/admin/subscribers');
  await page.waitForLoadState('networkidle');
  // Verificar que hay al menos una tabla o contenido
  await expect(page.locator('h1, h2, table')).not.toHaveCount(0);
});
