import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

  // Respuesta vacía determinista: activa el fallback demo sin depender de la
  // base de datos ni del camino de error de red.
  await page.route('**/api/v1/products*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': 'http://localhost:5173',
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify({
        success: true,
        data: [],
        message: 'Catálogo vacío para el gate de accesibilidad',
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
