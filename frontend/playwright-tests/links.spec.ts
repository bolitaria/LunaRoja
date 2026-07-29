import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Links: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Navegar y esperar a que el campo de título sea visible (más robusto que networkidle)
  await page.goto('/admin/links/new');
  const titleInput = page.locator('input[name="title"]');
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });

  const categoria = await page.$eval('select[name="category"]', (sel: HTMLSelectElement) => {
    if (sel.options.length > 1) return sel.options[1].value;
    return 'general';
  });

  const enlace = await createEntityViaApi('links', {
    title: 'Enlace API Playwright',
    url: 'https://playwright.dev',
    description: 'Creado vía API',
    category: categoria
  });

  await page.goto('/admin/links');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await expect(page.locator(`text=${enlace.title}`).first()).toBeVisible({ timeout: 10000 });
});
