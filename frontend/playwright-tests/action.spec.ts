import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test('Crear una nueva acción y verificar que se guardó', async ({ page }) => {
  await authenticate(page);
  const action = await createEntityViaApi('actions', {
    title: 'Acción Automatizada Playwright', description: 'Desc', linkType: 'general', category: 'solidarity_action', datetime: '2026-08-15T10:00'
  });
  await page.goto(`/admin/actions/${action.id}/edit`);
  await expect(page.locator('input[type="text"]:visible').first()).toHaveValue('Acción Automatizada Playwright', { timeout: 10000 });
});
