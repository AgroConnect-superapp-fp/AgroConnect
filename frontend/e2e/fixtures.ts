/**
 * Credenciales del fixture de test. La cuenta solo existe en la base
 * `agroconnect_test`; nunca se usa fuera de Playwright.
 */
export const E2E_ADMIN = {
  email: 'admin.e2e@agroconnect.local',
  password: 'E2eAdmin2026',
  fullName: 'Administradora E2E',
} as const;
