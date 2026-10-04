import { test, expect } from '@playwright/test';

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const SESSION = {
  usuario: {
    id: 'e2e-fallback-user',
    nombre: 'Prueba Respaldo',
    correo: 'e2e.fallback@example.com',
    rol: 'comprador_b2c',
    estado: 'ACTIVO',
    verificado: true,
    fechaRegistro: new Date().toISOString(),
  },
  tokens: {
    accessToken: 'e2e-access-token',
    refreshToken: 'e2e-refresh-token',
    expiresIn: 3600,
  },
};

test('si la base de datos falla, muestra datos de demostración con aviso', async ({
  page,
}) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem('agroconnect.session', JSON.stringify(session));
  }, SESSION);

  await page.route('**/rest/v1/properties*', (route) => route.abort());

  await page.route(
    /res\.cloudinary\.com|images\.unsplash\.com|commons\.wikimedia\.org/,
    (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_PIXEL })
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar prototipo del mercado/i }).click();

  await expect(page.getByText(/datos de demostración/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(page.getByText('Finca La Esperanza')).toBeVisible();

  const mockImage = page.getByRole('img', { name: 'Finca La Esperanza' });
  await expect
    .poll(() =>
      mockImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);
});
