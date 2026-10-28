/**
 * Tokens de inyección del módulo identity.
 *
 * Los puertos del dominio (`UserRepository`, `PasswordHasher`, …) se inyectan
 * por token para que la capa de aplicación no dependa de las implementaciones
 * concretas de infraestructura (Clean Architecture: la aplicación depende de
 * interfaces, la infraestructura las implementa).
 *
 * `APP_BASE_URL` no es un puerto sino un valor de configuración, pero se
 * inyecta igual para que los casos de uso no lean el entorno directamente.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol('EMAIL_VERIFICATION_TOKEN_REPOSITORY');
export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY');
export const APP_BASE_URL = Symbol('APP_BASE_URL');
