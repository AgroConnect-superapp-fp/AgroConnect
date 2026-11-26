import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * En móvil el mapa no descarga tiles de OpenStreetMap hasta que el usuario lo
 * pide; así el LCP inicial es contenido propio y no un recurso de terceros.
 * En escritorio se sigue cargando automáticamente.
 */
test('en móvil el mapa se carga bajo demanda', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/marketplace');

  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cargar mapa interactivo' })
  ).toBeVisible();
  await expect(page.locator('.leaflet-container')).toHaveCount(0);

  await page.getByRole('button', { name: 'Cargar mapa interactivo' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});

test('el marketplace móvil no tiene violaciones axe WCAG AA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/marketplace');
  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();

  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
