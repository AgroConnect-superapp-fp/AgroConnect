/**
 * Tokens de inyección del módulo marketplace.
 *
 * Mismo convenio que geography/identity: la capa de aplicación depende de
 * tokens y puertos, nunca de implementaciones Prisma.
 */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
