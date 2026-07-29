import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

const TITULO_NOTICIA = 'Noticia Automatizada Playwright';

test('Crear una nueva noticia y verificar que se guardó', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Crear dependencias necesarias (campaña y acción)
  const campaign = await createEntityViaApi('campaigns', {
    name: 'Campaña Noticia',
    description: 'Desc',
    privateLink: 'https://example.com',
  });
  const action = await createEntityViaApi('actions', {
    title: 'Acción Noticia',
    description: 'Desc',
    linkType: 'general',
    category: 'solidarity_action',
    datetime: '2026-08-15T10:00',
  });

  // Crear la noticia
  const news = await createEntityViaApi('news', {
    title: TITULO_NOTICIA,
    description: 'Descripción de prueba',
    youtubeUrl: 'https://youtube.com/watch?v=test',
    isNews: true,
    campaignId: campaign.id,
    actionId: action.id,
  });

  // Verificar en edición
  await page.goto(`/admin/news/${news.id}/edit`);
  await page.waitForLoadState('networkidle');

  // Esperar a que el campo title tenga el valor esperado
  await page.waitForFunction(
    (expected) => {
      const input = document.querySelector('input[name="title"]') as HTMLInputElement;
      return input && input.value === expected;
    },
    TITULO_NOTICIA,
    { timeout: 10000 }
  );

  await expect(page.locator('input[name="title"]')).toHaveValue(TITULO_NOTICIA);
});
