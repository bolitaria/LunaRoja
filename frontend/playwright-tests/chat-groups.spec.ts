import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear un nuevo grupo de chat y verificar en edición', async ({ page }) => {
  await loginViaApi(page);

  const grupo = await createEntityViaApi('chat-groups', {
    name: 'Grupo API Playwright',
    platform: 'whatsapp',
    link: 'https://chat.whatsapp.com/invite',
    region: 'Global',
    description: 'Creado vía API',
    isPublic: true,
    isActive: true,
  });

  await page.goto(`/admin/chatGroups/${grupo.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toHaveValue('Grupo API Playwright', { timeout: 10000 });
});
