import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

test('Peticiones: página de creación carga y se puede crear vía API', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  await page.goto('/admin/petitions/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toBeVisible();

  // Nombre único para la plantilla y título fijo para la petición
  const uniqueTemplateName = `Temp Petición API ${Date.now()}`;
  const petitionTitle = 'Petición API Playwright';

  const template = await createEntityViaApi('email-templates', {
    name: uniqueTemplateName,
    subject: 'Asunto',
    body: '<p>Test</p>',
    associatedEvent: 'subscriber_welcome'
  });

  await createEntityViaApi('petitions', {
    title: petitionTitle,
    content: 'Contenido de la petición',
    type: 'custom',
    emailTemplateId: template.id,
    urgency: true,
    hidden: false,
    target_emails: ['test@example.com']
  });

  await page.goto('/admin/petitions');
  await page.waitForLoadState('networkidle');
  // Usamos el título que definimos, no el de la respuesta
  await expect(page.locator(`text=${petitionTitle}`).first()).toBeVisible();
});
