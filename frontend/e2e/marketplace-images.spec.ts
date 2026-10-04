import { test, expect } from '@playwright/test';

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const SESSION = {
  usuario: {
    id: 'e2e-images-user',
    nombre: 'Prueba Imágenes',
    correo: 'e2e.images@example.com',
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

const BROKEN_IMAGE_URL = 'https://images.unsplash.com/photo-broken-e2e?w=800';

const API_ROWS = [
  {
    id: 'e2e-healthy',
    name: 'Finca Imagen Correcta',
    owner: 'Productor E2E',
    department: 'Quindío',
    municipality: 'Armenia',
    crop: 'coffee',
    area: 10,
    productivity: 80,
    certification: 'organic',
    lat: 4.53,
    lng: -75.68,
    images: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Coffea%20arabica%202.jpg?width=800',
    ],
    coordinates: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'e2e-broken',
    name: 'Finca Imagen Rota',
    owner: 'Productor E2E',
    department: 'Quindío',
    municipality: 'Armenia',
    crop: 'cacao',
    area: 12,
    productivity: 70,
    certification: 'organic',
    lat: 4.54,
    lng: -75.69,
    images: [BROKEN_IMAGE_URL],
    coordinates: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

test('una imagen rota se reemplaza por el respaldo del cultivo', async ({ page }) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem('agroconnect.session', JSON.stringify(session));
  }, SESSION);

  await page.route('**/rest/v1/properties*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_ROWS),
    })
  );

  await page.route('**/photo-broken-e2e*', (route) => route.fulfill({ status: 404 }));

  await page.route('**/commons.wikimedia.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_PIXEL })
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar prototipo del mercado/i }).click();
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();

  const healthyImage = page.getByRole('img', { name: 'Finca Imagen Correcta' });
  await expect(healthyImage).toHaveAttribute('src', /Special:FilePath\/Coffea/);

  const brokenImage = page.getByRole('img', { name: 'Finca Imagen Rota' });
  await expect(brokenImage).toHaveAttribute('src', /Special:FilePath\/Cacao/);
  await expect(brokenImage).not.toHaveAttribute('src', /photo-broken-e2e/);

  await expect
    .poll(() =>
      brokenImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);
});
