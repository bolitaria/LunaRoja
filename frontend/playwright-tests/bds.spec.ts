import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Crear una nueva empresa BDS y verificar que se guardó', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Crear con los campos mínimos necesarios (si privateLink causa error, lo omitimos)
  const empresa = await createEntityViaApi('bds', {
    name: 'BDS Automatizada Playwright',
    description: 'Descripción automatizada de pruebas.',
  });

  // Verificar en edición
  await page.goto(`/admin/bds/${empresa.id}/edit`);
  await page.waitForLoadState('networkidle');

  // Esperar a que el primer input de texto (nombre) tenga valor
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    return input && input.value.length > 0;
  }, { timeout: 10000 });

  const nameInput = page.locator('input[type="text"]:visible').first();
  await expect(nameInput).toHaveValue('BDS Automatizada Playwright');
});
