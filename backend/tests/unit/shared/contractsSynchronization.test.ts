import { SELF_REGISTRABLE_ROLE_NAMES as CONTRACT_ROLE_NAMES } from '@agroconnect/contracts';
import { SELF_REGISTRABLE_ROLE_NAMES as DOMAIN_ROLE_NAMES } from '@/modules/auth/domain/entities/Role';

/**
 * Guard de sincronía del contrato (ADR-015).
 *
 * El dominio no depende de @agroconnect/contracts (Clean Architecture: dominio
 * sin dependencias externas), por lo que la lista de roles auto-registrables
 * existe en ambos lados. Este test falla si alguna de las dos se edita sin la
 * otra, evitando que el contrato del API y la regla de negocio diverjan.
 */
describe('Sincronía entre el dominio y @agroconnect/contracts', () => {
  it('la lista de roles auto-registrables del dominio coincide con el contrato compartido', () => {
    expect([...DOMAIN_ROLE_NAMES]).toEqual([...CONTRACT_ROLE_NAMES]);
  });
});
