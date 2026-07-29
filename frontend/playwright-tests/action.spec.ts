import { test, expect } from '@playwright/test';
import { setupApiProxy, login, createEntityViaApi } from './utils';

const TITULO_ACCION = 'Acción Automatizada Playwright';

test('Crear una nueva acción y verificar que se guardó correctamente', async ({ page }) => {
  await setupApiProxy(page);
  await login(page);

  // Crear vía API (sin imagen ni campos complejos)
  const action = await createEntityViaApi('actions', {
    title: TITULO_ACCION,
    description: 'Descripción de prueba',
    linkType: 'general',
    category: 'solidarity_action',
    datetime: '2026-08-15T10:00',
    // No enviamos imagen; la API debería aceptarlo
  });

  // Navegar a la página de edición
  await page.goto(`/admin/actions/${action.id}/edit`);
  await page.waitForLoadState('networkidle');

  // Esperar a que el campo title tenga valor (la página carga los datos asíncronamente)
  await page.waitForFunction(() => {
    const input = document.querySelector('input[name="title"]') as HTMLInputElement;
    return input && input.value.length > 0;
  }, { timeout: 10000 });

  await expect(page.locator('input[name="title"]')).toHaveValue(TITULO_ACCION);
});
