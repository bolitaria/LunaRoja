import { test, expect } from '@playwright/test';
import { loginViaApi, createEntityViaApi } from './utils';

test('Crear una nueva noticia y verificar que se guardó', async ({ page }) => {
  await loginViaApi(page);

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

  const news = await createEntityViaApi('news', {
    title: 'Noticia Automatizada Playwright',
    description: 'Descripción de prueba',
    youtubeUrl: 'https://youtube.com/watch?v=test',
    isNews: true,
    campaignId: campaign.id,
    actionId: action.id,
  });

  await page.goto(`/admin/news/${news.id}/edit`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="title"]')).toHaveValue('Noticia Automatizada Playwright', { timeout: 10000 });
});
