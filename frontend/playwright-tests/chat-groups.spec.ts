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
    platform: 'whatsapp',
    link: 'https://chat.whatsapp.com/invite',
    region: 'Global',
    description: 'Creado vía API',
    isPublic: true,
    isActive: true,
  });

  // Verificar en edición (evita problemas de lista/paginación)
  await page.goto(`/admin/chatGroups/${grupo.id}/edit`);
  await page.waitForLoadState('networkidle');

  await page.waitForFunction(() => {
    const input = document.querySelector('input[name="name"]') as HTMLInputElement;
    return input && input.value.length > 0;
  }, { timeout: 10000 });

  await expect(page.locator('input[name="name"]')).toHaveValue('Grupo API Playwright');
});
