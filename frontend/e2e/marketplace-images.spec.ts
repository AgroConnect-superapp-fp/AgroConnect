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

interface LegacyRow {
  id: string;
  name: string;
  crop: string;
  images: string[];
}

const LEGACY_ROWS: LegacyRow[] = [
  {
    id: 'e2e-coffee',
    name: 'Finca La Victoria',
    crop: 'coffee',
    images: ['https://images.unsplash.com/photo-1511643669359-9f7629382b38?w=800'],
  },
  {
    id: 'e2e-cacao',
    name: 'Finca El Mirador',
    crop: 'cacao',
    images: ['https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800'],
  },
  {
    id: 'e2e-banana',
    name: 'Finca La Primavera',
    crop: 'banana',
    images: ['https://images.unsplash.com/photo-1528825871115-3581a5387f19?w=800'],
  },
  {
    id: 'e2e-corn',
    name: 'Hacienda La Cumbre',
    crop: 'corn',
    images: ['https://images.unsplash.com/photo-1601627387587-3004ae13e6c8?w=800'],
  },
];

const EXPECTED_SOURCES: Array<{ name: string; expected: RegExp; legacy: RegExp }> = [
  {
    name: 'Finca La Victoria',
    expected: /Special:FilePath\/Coffee%20tree%20in%20Hacienda%20Guayabal/,
    legacy: /photo-1511643669359/,
  },
  {
    name: 'Finca El Mirador',
    expected: /Special:FilePath\/Cacao%20fruit/,
    legacy: /photo-1587132137056/,
  },
  {
    name: 'Finca La Primavera',
    expected: /photo-1603833665858/,
    legacy: /photo-1528825871115/,
  },
  {
    name: 'Hacienda La Cumbre',
    expected: /photo-1551754655/,
    legacy: /photo-1601627387587/,
  },
];

function toApiRows(rows: LegacyRow[]): unknown[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    owner: 'Productor E2E',
    department: 'Quindío',
    municipality: 'Armenia',
    crop: row.crop,
    area: 10,
    productivity: 80,
    certification: 'organic',
    lat: 4.53,
    lng: -75.68,
    images: row.images,
    coordinates: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }));
}

test('las imágenes legado se reemplazan por fuentes acordes al cultivo', async ({
  page,
}) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem('agroconnect.session', JSON.stringify(session));
  }, SESSION);

  await page.route('**/rest/v1/properties*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(toApiRows(LEGACY_ROWS)),
    })
  );

  await page.route(/images\.unsplash\.com|commons\.wikimedia\.org/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_PIXEL })
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar prototipo del mercado/i }).click();
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();

  for (const { name, expected, legacy } of EXPECTED_SOURCES) {
    const image = page.getByRole('img', { name });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', expected);
    await expect(image).not.toHaveAttribute('src', legacy);
  }
});
