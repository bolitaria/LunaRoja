import { test, expect } from '@playwright/test';
import { authenticate, createEntityViaApi } from './utils';

test.skip('Crear un nuevo grupo de chat y verificar en edición', async ({ page }) => {
  await authenticate(page);
  const grupo = await createEntityViaApi('chat-groups', {
    name: 'Grupo API Playwright', platform: 'whatsapp', link: 'https://chat.whatsapp.com/invite', region: 'Global', description: 'Creado vía API', isPublic: true, isActive: true
  });
  await page.goto(`/admin/chatGroups/${grupo.id}/edit`);
  await expect(page.locator('input[type="text"]:visible').first()).toHaveValue('Grupo API Playwright', { timeout: 10000 });
});
