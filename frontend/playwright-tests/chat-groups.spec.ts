import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Chat Groups: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  await page.goto('/admin/chatGroups/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toBeVisible();

  const grupo = await createEntityViaApi('chat-groups', {
    name: 'Grupo API Playwright',
    platform: 'whatsapp',          // ✅ antes "WhatsApp"
    link: 'https://chat.whatsapp.com/invite',
    region: 'Global',
    description: 'Creado vía API',
    isPublic: true,
    isActive: true
    // associationType no existe en el modelo → lo omitimos
  });

  await page.goto('/admin/chatGroups');
  await page.waitForLoadState('networkidle');
  await expect(page.locator(`text=${grupo.name}`).first()).toBeVisible();
});
