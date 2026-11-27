import { test, expect } from '@playwright/test';

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('si la base de datos falla, muestra datos de demostración con aviso', async ({
  page,
}) => {
  // El modo demo no consulta la base de datos: se aborta la ruta de productos
  // de apps/api para demostrarlo.
  await page.route('**/api/v1/products*', (route) => route.abort());

  // Imágenes demo (Cloudinary) y respaldos (Wikimedia) servidas localmente.
  // Globs con URL absoluta: Playwright los ancla al host exacto.
  await page.route('https://res.cloudinary.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_PIXEL })
  );
  await page.route('https://commons.wikimedia.org/**', (route) =>
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
