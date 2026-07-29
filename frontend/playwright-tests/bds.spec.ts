import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Crear una nueva empresa BDS y verificar que se guardó', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  const empresa = await createEntityViaApi('bds', {
    name: 'BDS Automatizada Playwright',
    description: 'Descripción automatizada de pruebas.',
    privateLink: 'https://example.com'
  });

  // Ir a la lista de BDS
  await page.goto('/admin/bds');
  await page.waitForLoadState('networkidle');

  // Intentar usar el buscador si existe
  const searchInput = page.getByPlaceholder('Buscar…');
  if (await searchInput.isVisible({ timeout: 3000 })) {
    await searchInput.fill(empresa.name);
    await searchInput.press('Enter');
    await page.waitForTimeout(1500); // esperar filtrado

    // Verificar que el nombre aparece en la tabla
    const nameCell = page.locator('td.font-medium.text-gray-900').filter({ hasText: empresa.name }).first();
    await expect(nameCell).toBeVisible({ timeout: 10000 });
  } else {
    // Sin buscador: verificamos desde la página de edición (más fiable)
    await page.goto(`/admin/bds/${empresa.id}/edit`);
    await page.waitForLoadState('networkidle');

    // El primer input de texto visible es el nombre
    const nameInput = page.locator('input[type="text"]:visible').first();
    await expect(nameInput).toHaveValue('BDS Automatizada Playwright', { timeout: 10000 });
  }
});
