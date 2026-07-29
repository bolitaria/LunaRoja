import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear una nueva plantilla de email y verificar en edición', async ({ page }) => {
  await loginViaApi(page);

  const uniqueName = `Plantilla API ${Date.now()}`;
  const plantilla = await createEntityViaApi('email-templates', {
    name: uniqueName,
    subject: 'Asunto API',
    body: '<p>Contenido HTML</p>',
    associatedEvent: 'subscriber_welcome',
    headerColor: '#ffffff',
    buttonColor: '#000000',
    footerColor: '#ffffff',
    backgroundColor: '#ffffff',
  });

  await page.goto(`/admin/email-templates/${plantilla.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toHaveValue(uniqueName, { timeout: 10000 });
});
