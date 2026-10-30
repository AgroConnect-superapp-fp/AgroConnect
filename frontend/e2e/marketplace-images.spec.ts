import { test, expect } from '@playwright/test';

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('una imagen rota se reemplaza por el respaldo del cultivo', async ({ page }) => {
  // La primera imagen de Finca La Esperanza (café) falla; el resto de
  // imágenes demo y los respaldos de Wikimedia se sirven localmente.
  await page.route(/res\.cloudinary\.com|commons\.wikimedia\.org/, (route) => {
    const url = route.request().url();
    if (url.includes('cld-sample-4')) {
      return route.fulfill({ status: 404 });
    }
    return route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG_PIXEL,
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar la demo/i }).click();
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();

  // La imagen rota cae al respaldo del cultivo (café, Wikimedia).
  const brokenImage = page.getByRole('img', { name: 'Finca La Esperanza' });
  await expect(brokenImage).toHaveAttribute('src', /Special:FilePath\/Coffee/);
  await expect(brokenImage).not.toHaveAttribute('src', /cld-sample-4/);
  await expect
    .poll(() =>
      brokenImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);

  // Las imágenes sanas siguen sirviéndose desde Cloudinary.
  const healthyImage = page.locator('img[src*="res.cloudinary.com"]').first();
  await healthyImage.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      healthyImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);
});
