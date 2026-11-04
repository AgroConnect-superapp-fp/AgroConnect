import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4100';
const MAIL_DIR = process.env.MAIL_DIR ?? '/tmp/agroconnect-mails';

async function readVerificationToken(correo: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const files = (await readdir(MAIL_DIR))
        .filter((file) => file.endsWith('-email-verification.txt'))
        .sort()
        .reverse();
      for (const file of files) {
        const content = await readFile(join(MAIL_DIR, file), 'utf8');
        if (content.includes(`Para: ${correo}`)) {
          const match = /verifyToken=([a-f0-9]+)/.exec(content);
          if (match?.[1]) return match[1];
        }
      }
    } catch {
      // El correo puede tardar unos milisegundos en escribirse.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No se encontró el correo de verificación para ${correo}`);
}

test('un productor publica una cosecha con una imagen', async ({ page }) => {
  const suffix = `${Date.now()}`.slice(-8);
  const correo = `publish.${suffix}@example.com`;
  const password = 'Agro2026*';
  const productName = `Cosecha E2E ${suffix}`;

  const registered = await page.request.post(`${BACKEND_URL}/api/v1/auth/register`, {
    data: {
      nombre: 'Productor Publicador',
      documento: `9${suffix}`,
      correo,
      celular: `3${suffix.padStart(9, '0')}`,
      password,
      rol: 'productor',
      finca: {
        nombre: 'Finca E2E',
        municipio: 'Salento',
        vereda: 'Boquía',
      },
      aceptaTratamientoDatos: true,
    },
  });
  expect(registered.status()).toBe(201);

  const verifyToken = await readVerificationToken(correo);
  const verified = await page.request.post(`${BACKEND_URL}/api/v1/auth/verify-email`, {
    data: { token: verifyToken },
  });
  expect(verified.status()).toBe(200);

  const loggedIn = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { correo, password },
  });
  expect(loggedIn.status()).toBe(200);

  const image = await readFile('public/pwa-192x192.png');
  await page.route('**/api/v1/uploads/signature', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Firma de subida generada',
        data: {
          cloudName: 'demo',
          apiKey: 'e2e-key',
          timestamp: Math.floor(Date.now() / 1000),
          signature: 'e2e-signature',
          folder: `agroconnect/products/e2e-${suffix}`,
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
          maxBytes: 10 * 1024 * 1024,
        },
      }),
    })
  );
  await page.route('https://api.cloudinary.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        public_id: `e2e/${suffix}`,
        secure_url: `https://res.cloudinary.com/demo/image/upload/e2e-${suffix}.png`,
        width: 192,
        height: 192,
        format: 'png',
        bytes: image.length,
        created_at: new Date().toISOString(),
      }),
    })
  );
  await page.route('https://res.cloudinary.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: image })
  );

  await page.goto('/');
  await expect(page.getByTestId('dashboard-bienvenida')).toBeVisible();
  await page.getByTestId('dashboard-publish').click();

  await page.getByTestId('publish-name').fill(productName);
  await page.getByTestId('publish-department').fill('Quindío');
  await page.getByTestId('publish-municipality').fill('Salento');
  await page.getByTestId('publish-area').fill('8.5');
  await page.getByTestId('publish-productivity').fill('91');
  await page.getByTestId('publish-contact').fill('+57 300 111 22 33');
  await page
    .getByTestId('publish-description')
    .fill('Cosecha publicada por el E2E del marketplace.');
  await page
    .getByTestId('publish-images')
    .setInputFiles({ name: 'cosecha.png', mimeType: 'image/png', buffer: image });

  await expect(page.getByText('Subiendo imágenes…')).toBeHidden({ timeout: 10_000 });
  await page.getByTestId('publish-submit').click();

  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(page.getByText(productName)).toBeVisible();

  await page.getByRole('button', { name: 'Ver Detalles y Fotos' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const patchResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/products/') &&
      response.request().method() === 'PATCH'
  );
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'segunda.png',
    mimeType: 'image/png',
    buffer: image,
  });
  const patched = await patchResponse;
  expect(patched.status()).toBe(200);

  const listed = await page.request.get(
    `${BACKEND_URL}/api/v1/products?search=${encodeURIComponent(productName)}`
  );
  expect(listed.status()).toBe(200);
  const body = (await listed.json()) as { data: Array<{ images: unknown[] }> };
  expect(body.data[0]?.images).toHaveLength(2);
});
