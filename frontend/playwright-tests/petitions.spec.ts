import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Peticiones: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  await page.goto('/admin/petitions/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toBeVisible();

  // Crear petición sin emailTemplateId (la columna puede no existir en BD)
  const peticion = await createEntityViaApi('petitions', {
    title: 'Petición API Playwright',
    content: 'Contenido de la petición',
    type: 'custom',
    urgency: true,
    hidden: false,
    target_emails: ['test@example.com'],
  });

  await page.goto('/admin/petitions');
  await page.waitForLoadState('networkidle');

  // Usar búsqueda si está disponible, o esperar que aparezca en la tabla
  const searchInput = page.getByPlaceholder('Buscar…');
  if (await searchInput.isVisible({ timeout: 3000 })) {
    await searchInput.fill(peticion.title);
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
  }

  await expect(page.locator('td.font-medium.text-gray-900').filter({ hasText: peticion.title }).first()).toBeVisible({ timeout: 10000 });
});
