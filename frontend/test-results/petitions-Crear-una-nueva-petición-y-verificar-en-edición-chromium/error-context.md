# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: petitions.spec.ts >> Crear una nueva petición y verificar en edición
- Location: playwright-tests/petitions.spec.ts:4:5

# Error details

```
TypeError: (0 , _utils.loginViaApi) is not a function
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginViaApi, createEntityViaApi } from './utils';
  3  | 
  4  | test('Crear una nueva petición y verificar en edición', async ({ page }) => {
> 5  |   await loginViaApi(page);
     |                    ^ TypeError: (0 , _utils.loginViaApi) is not a function
  6  | 
  7  |   const peticion = await createEntityViaApi('petitions', {
  8  |     title: 'Petición API Playwright',
  9  |     content: 'Contenido de la petición',
  10 |     type: 'custom',
  11 |     urgency: true,
  12 |     hidden: false,
  13 |     target_emails: ['test@example.com'],
  14 |   });
  15 | 
  16 |   await page.goto(`/admin/petitions/${peticion.id}/edit`);
  17 |   await page.waitForLoadState('networkidle');
  18 |   await expect(page.locator('input[name="title"]')).toHaveValue('Petición API Playwright', { timeout: 10000 });
  19 | });
  20 | 
```