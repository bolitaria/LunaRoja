import { test, expect } from '@playwright/test';

const MONTHS_REGEX = /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i;

test.describe('Calendario público', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendario');
    await expect(page.locator('.react-calendar')).toBeVisible({ timeout: 15000 });
  });

  test('carga el calendario sin errores', async ({ page }) => {
    await expect(page.getByText(MONTHS_REGEX).first()).toBeVisible();
  });

  test('permite navegar al mes siguiente', async ({ page }) => {
    const label = page.locator('.react-calendar__navigation__label');
    const before = await label.textContent();

    await page.locator('.react-calendar__navigation__next-button').click();
    await expect(label).not.toHaveText(before ?? '');
  });

  test('permite navegar al mes anterior', async ({ page }) => {
    await page.locator('.react-calendar__navigation__prev-button').click();
    await expect(page.getByText(MONTHS_REGEX).first()).toBeVisible();
  });
});
