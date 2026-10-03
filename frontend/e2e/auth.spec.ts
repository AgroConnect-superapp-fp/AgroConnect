import { test, expect, type Page } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4100';

function uniqueEmail(prefix = 'e2e'): string {
  const stamp = `${Date.now()}.${Math.floor(Math.random() * 10_000)}`;
  return `${prefix}.${stamp}@example.com`;
}

interface ProducerData {
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  password: string;
}

function uniqueProducer(overrides: Partial<ProducerData> = {}): ProducerData {
  const suffix = `${Date.now()}`.slice(-8);
  return {
    nombre: 'María Fernanda López',
    documento: `1${suffix}`.slice(0, 10),
    correo: uniqueEmail(),
    celular: `3${suffix.padStart(9, '0')}`.slice(0, 10),
    password: 'Agro2026*',
    ...overrides,
  };
}

async function openRegistration(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByTestId('role-card-productor')).toBeVisible();
}

async function fillProducerRegistration(page: Page, data: ProducerData): Promise<void> {
  await page.getByTestId('role-card-productor').click();

  await page.getByTestId('register-nombre').fill(data.nombre);
  await page.getByTestId('register-documento').fill(data.documento);
  await page.getByTestId('register-correo').fill(data.correo);
  await page.getByTestId('register-celular').fill(data.celular);
  await page.getByTestId('register-next-1').click();

  await page.getByTestId('register-finca-nombre').fill('El Mirador');
  await page.getByTestId('register-finca-municipio').fill('Salento');
  await page.getByTestId('register-finca-vereda').fill('Boquía');
  await page.getByTestId('register-next-2').click();

  await page.getByTestId('register-password').fill(data.password);
  await page.getByTestId('register-confirmar').fill(data.password);
  await page.getByTestId('register-acepta').check();
  await page.getByTestId('register-submit').click();
}

test.describe('Registro y autenticación de usuarios', () => {
  test('un productor se registra, inicia sesión y accede a su panel', async ({
    page,
  }) => {
    const producer = uniqueProducer();

    await openRegistration(page);
    await fillProducerRegistration(page, producer);

    await expect(page.getByTestId('register-success')).toBeVisible();
    await expect(page.getByTestId('dashboard-usuario')).toHaveText(producer.nombre);
    await expect(page.getByText('Panel de Productor')).toBeVisible();

    await page.getByTestId('dashboard-logout').click();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByTestId('login-correo').fill(producer.correo);
    await page.getByTestId('login-password').fill(producer.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();

    await expect(page.getByTestId('dashboard-bienvenida')).toBeVisible();
    await expect(page.getByTestId('dashboard-usuario')).toHaveText(producer.nombre);
  });

  test('el correo duplicado se rechaza con el mensaje del sistema', async ({ page }) => {
    const producer = uniqueProducer();

    await openRegistration(page);
    await fillProducerRegistration(page, producer);
    await expect(page.getByTestId('register-success')).toBeVisible();
    await page.getByTestId('dashboard-logout').click();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();

    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByTestId('role-card-productor')).toBeVisible();
    await fillProducerRegistration(page, {
      ...producer,
      documento: `${producer.documento.slice(0, 8)}99`,
      celular: '3109998877',
    });

    await expect(page.getByText('El correo ya se encuentra registrado')).toBeVisible();
    await expect(page.getByTestId('register-nombre')).toBeVisible();
  });

  test('el inicio de sesión con credenciales inválidas muestra un mensaje genérico', async ({
    page,
    request,
  }) => {
    const producer = uniqueProducer();
    const response = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
      data: {
        nombre: producer.nombre,
        documento: producer.documento,
        correo: producer.correo,
        celular: producer.celular,
        password: producer.password,
        rol: 'comprador_b2c',
        aceptaTratamientoDatos: true,
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByTestId('login-correo').fill(producer.correo);
    await page.getByTestId('login-password').fill('ClaveEquivocada123');
    await page.getByRole('button', { name: 'Iniciar sesión' }).last().click();

    await expect(page.getByTestId('login-error')).toHaveText(
      'Correo o contraseña incorrectos'
    );
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('la validación del formulario señala los campos por corregir', async ({
    page,
  }) => {
    await openRegistration(page);
    await page.getByTestId('role-card-productor').click();

    await page.getByTestId('register-documento').fill('12');
    await page.getByTestId('register-correo').fill('correo-invalido');
    await page.getByTestId('register-next-1').click();

    await expect(
      page.getByText('El nombre completo debe tener al menos 3 caracteres')
    ).toBeVisible();
    await expect(
      page.getByText('El documento debe contener solo dígitos entre 6 y 12 caracteres')
    ).toBeVisible();
    await expect(page.getByText('El correo no tiene un formato válido')).toBeVisible();
    await expect(page.getByTestId('register-finca-nombre')).toHaveCount(0);
  });

  test('la recuperación de contraseña muestra un mensaje genérico tras solicitar el enlace', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();

    await page.getByTestId('forgot-correo').fill('maria.lopez@example.com');
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();

    await expect(page.getByTestId('forgot-success')).toBeVisible();
    await expect(page.getByTestId('forgot-success')).toContainText(
      'Si el correo está registrado'
    );
  });

  test('un enlace de recuperación inválido muestra el error y ofrece solicitar uno nuevo', async ({
    page,
  }) => {
    await page.goto('/?resetToken=token-invalido');
    await page.getByTestId('reset-password').fill('NuevaClave2026');
    await page.getByTestId('reset-confirmar').fill('NuevaClave2026');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();

    await expect(page.getByTestId('reset-error')).toContainText(
      'El enlace de recuperación es inválido o expiró'
    );

    await page.getByRole('button', { name: 'Solicitar un enlace nuevo' }).click();
    await expect(page.getByTestId('forgot-correo')).toBeVisible();
  });

  test('un enlace de verificación inválido muestra el error y permite reenviar', async ({
    page,
  }) => {
    await page.goto('/?verifyToken=token-invalido');
    await page.getByRole('button', { name: 'Confirmar verificación' }).click();

    await expect(page.getByTestId('verify-error')).toContainText(
      'El enlace de verificación es inválido o expiró'
    );

    await page.getByTestId('verify-correo').fill('maria.lopez@example.com');
    await page.getByRole('button', { name: 'Reenviar enlace de verificación' }).click();

    await expect(page.getByTestId('verify-resent')).toBeVisible();
  });
});
