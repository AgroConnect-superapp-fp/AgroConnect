import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { E2E_ADMIN } from './fixtures';

/**
 * Gate de accesibilidad del marketplace (D9).
 *
 * Usa el fallback demo para que el resultado no dependa de la base de datos.
 * Cubre la página completa y el popup de una propiedad con las reglas WCAG
 * 2.1 A/AA.
 */
test('el marketplace y el detalle no tienen violaciones axe WCAG AA', async ({
  page,
}) => {
  test.setTimeout(180_000);

  // Error determinista: activa el fallback demo sin depender de la base de
  // datos. Un catálogo vacío ya NO activa el fallback (se muestra el estado
  // vacío real desde el arreglo de MarketplacePrototype).
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': 'http://localhost:5173',
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Fallo simulado para el gate de accesibilidad',
        },
      }),
    })
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar la demo/i }).click();
  await expect(page.getByRole('heading', { name: /Productores Destacados/ })).toBeVisible(
    { timeout: 30_000 }
  );

  // Las animaciones de entrada alteran la opacidad y falsean el contraste.
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const marketplace = await new AxeBuilder({ page })
    // El mapa Leaflet es un árbol DOM pesado de un tercero; el gate cubre la UI
    // propia (cabecera, KPIs, aviso, filtros y tarjetas).
    .exclude('.leaflet-container')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(marketplace.violations).toEqual([]);

  await page
    .getByRole('button', { name: /Ver Detalles y Fotos/i })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const dialog = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(dialog.violations).toEqual([]);
});

/**
 * Gate de accesibilidad de las pantallas públicas de autenticación.
 *
 * No requiere credenciales ni base de datos: login y el primer paso del
 * registro son formularios estáticos.
 */
test('login y registro no tienen violaciones axe WCAG AA', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const login = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(login.violations).toEqual([]);

  await page.goto('/registro?rol=productor');
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const registro = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(registro.violations).toEqual([]);
});

/**
 * Gate de accesibilidad de moderación con la cuenta administradora del
 * fixture E2E. Requiere que `global-setup.ts` haya sembrado la base de test.
 */
test('moderación no tiene violaciones axe WCAG AA', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(E2E_ADMIN.email);
  await page.getByLabel('Contraseña').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL(/\/panel/);

  await page.goto('/moderacion');
  await expect(
    page.getByRole('heading', { name: 'Moderación de publicaciones' })
  ).toBeVisible();

  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const moderacion = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(moderacion.violations).toEqual([]);
});
