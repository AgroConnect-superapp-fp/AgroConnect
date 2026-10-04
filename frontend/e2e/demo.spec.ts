import { test, expect } from '@playwright/test';

test('el acceso de demostración entra al mercado sin backend', async ({ page }) => {
  await page.route('**/rest/v1/properties*', (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: /Explorar la demo/i }).click();

  await expect(
    page.getByRole('heading', { name: /Productores Destacados/ })
  ).toBeVisible();
  await expect(page.getByText(/datos de demostración/i)).toBeVisible();
});

test('si el backend no responde, el inicio de sesión ofrece modo demostración', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByTestId('login-correo').fill('persona@example.com');
  await page.getByTestId('login-password').fill('ClaveDemo123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();

  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page.getByTestId('login-demo-fallback')).toBeVisible();
  await page.getByTestId('login-demo-fallback').click();

  await expect(page.getByTestId('dashboard-usuario')).toHaveText('Visitante Demo');
});

test('si el backend no responde, el registro ofrece modo demostración con los datos', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/register', (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByTestId('role-card-productor').click();

  await page.getByTestId('register-nombre').fill('Lucía Diagnóstico');
  await page.getByTestId('register-documento').fill('1234567890');
  await page.getByTestId('register-correo').fill('lucia.demo@example.com');
  await page.getByTestId('register-celular').fill('3101234567');
  await page.getByTestId('register-next-1').click();

  await page.getByTestId('register-finca-nombre').fill('Finca Demo');
  await page.getByTestId('register-finca-municipio').fill('Armenia');
  await page.getByTestId('register-finca-vereda').fill('Centro');
  await page.getByTestId('register-next-2').click();

  await page.getByTestId('register-password').fill('Agro2026*');
  await page.getByTestId('register-confirmar').fill('Agro2026*');
  await page.getByTestId('register-acepta').check();
  await page.getByTestId('register-submit').click();

  await expect(page.getByTestId('register-demo-fallback')).toBeVisible();
  await page.getByTestId('register-demo-fallback').click();

  await expect(page.getByTestId('dashboard-usuario')).toHaveText('Lucía Diagnóstico');
});
