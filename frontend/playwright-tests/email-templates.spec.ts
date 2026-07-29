import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Email Templates: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  await page.goto('/admin/email-templates/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toBeVisible();

  const uniqueName = `Plantilla API ${Date.now()}`;
  const plantilla = await createEntityViaApi('email-templates', {
    name: uniqueName,
    subject: 'Asunto API',
    body: '<p>Contenido HTML</p>',
    associatedEvent: 'subscriber_welcome',
    headerColor: '#ffffff',
    buttonColor: '#000000',
    footerColor: '#ffffff',
    backgroundColor: '#ffffff'
  });

  // Verificar en la página de edición (evita paginación)
  await page.goto(`/admin/email-templates/${plantilla.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="name"]')).toHaveValue(uniqueName);
});
