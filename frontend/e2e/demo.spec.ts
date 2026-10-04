import { test, expect } from '@playwright/test';

test('el acceso de demostración entra al mercado sin backend', async ({ page }) => {
  await page.route('**/rest/v1/properties*', (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar la demo/i }).click();

  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(page.getByText(/datos de demostración/i)).toBeVisible();
});
