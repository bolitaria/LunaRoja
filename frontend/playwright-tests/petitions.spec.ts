import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear una nueva petición y verificar en edición', async ({ page }) => {
  await authenticate(page);

  const peticion = await createEntityViaApi('petitions', {
    title: 'Petición API Playwright',
    content: 'Contenido de la petición',
    type: 'custom',
    urgency: true,
    hidden: false,
    target_emails: ['test@example.com'],
  });

  await page.goto(`/admin/petitions/${peticion.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toHaveValue('Petición API Playwright', { timeout: 10000 });
});
