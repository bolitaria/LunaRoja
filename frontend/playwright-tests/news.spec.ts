import { test, expect } from '@playwright/test';
import { setupApiProxy, login } from './utils';

async function createViaApi(endpoint: string, body: any) {
  const tokenRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const { token } = await tokenRes.json();
  const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  return res.json();
}

test('Crear una nueva noticia', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  const campaign = await createViaApi('campaigns', { name: 'Campaña Noticia', description: 'Desc', privateLink: 'https://example.com' });
  const action = await createViaApi('actions', { title: 'Acción Noticia', description: 'Desc', linkType: 'general', category: 'Manifestación', datetime: '2026-08-15T10:00' });

  await page.goto('/admin/news/new');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="title"]', 'Noticia Automatizada Playwright');
  await page.fill('textarea[name="description"]', 'Descripción automatizada.');
  await page.fill('input[name="youtubeUrl"]', 'https://youtube.com/watch?v=test');
  await page.check('input[name="isNews"]');

  // Forzar la selección usando JavaScript porque las opciones están ocultas para Playwright
  await page.evaluate((campaignId) => {
    const sel = document.querySelector('select[name="campaignId"]') as HTMLSelectElement;
    if (sel) sel.value = campaignId;
  }, String(campaign.id));

  await page.evaluate((actionId) => {
    const sel = document.querySelector('select[name="actionId"]') as HTMLSelectElement;
    if (sel) sel.value = actionId;
  }, String(action.id));

  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/news') && r.request().method() === 'POST' && r.status() === 201),
    page.click('button[type="submit"]')
  ]);
  const { id } = await resp.json();

  await page.goto(`/admin/news/${id}/edit`);
  await expect(page.locator('input[name="title"]')).toHaveValue('Noticia Automatizada Playwright');
});
