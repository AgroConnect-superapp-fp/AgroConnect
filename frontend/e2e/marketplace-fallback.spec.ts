import { test, expect } from '@playwright/test';

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('si la base de datos falla, muestra datos de demostración con aviso', async ({
  page,
}) => {
  // El modo demo no consulta ninguna base de datos: se abortan las rutas de
  // datos (legacy Supabase y apps/api) para demostrarlo.
  await page.route('**/rest/v1/properties*', (route) => route.abort());
  await page.route('**/api/v1/properties*', (route) => route.abort());

  // Imágenes demo (Cloudinary) y respaldos (Wikimedia) servidas localmente.
  await page.route(/res\.cloudinary\.com|commons\.wikimedia\.org/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_PIXEL })
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar la demo/i }).click();

  await expect(page.getByText(/datos de demostración/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(page.getByText('Finca La Esperanza')).toBeVisible();

  const demoImage = page.getByRole('img', { name: 'Finca La Esperanza' });
  await expect
    .poll(() =>
      demoImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);
});
