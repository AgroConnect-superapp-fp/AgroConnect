/**
 * Tokens de inyección del módulo geography.
 *
 * Mismo convenio que `identity/application/tokens.ts`: los puertos del dominio
 * se inyectan por token para que la capa de aplicación no dependa de las
 * implementaciones concretas de infraestructura (Clean Architecture).
 */
export const PLOT_REPOSITORY = Symbol('PLOT_REPOSITORY');
