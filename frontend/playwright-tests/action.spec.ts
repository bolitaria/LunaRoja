import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear una nueva acción y verificar que se guardó', async ({ page }) => {
  await loginViaApi(page);

  const action = await createEntityViaApi('actions', {
    title: 'Acción Automatizada Playwright',
    description: 'Descripción de prueba',
    linkType: 'general',
    category: 'solidarity_action',
    datetime: '2026-08-15T10:00',
  });

  await page.goto(`/admin/actions/${action.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toHaveValue('Acción Automatizada Playwright', { timeout: 10000 });
});
