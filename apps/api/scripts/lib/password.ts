/**
 * Hash de contraseñas para los scripts operativos.
 *
 * Reutiliza el hasher de producción (`Argon2PasswordHasher`, Argon2id con los
 * parámetros OWASP de ADR-010) y el value object `Password` (mínimo 8
 * caracteres, con al menos una letra y un número). Así, una cuenta creada por
 * un script tiene exactamente el mismo formato de hash y cumple la misma
 * política que una cuenta creada por la API.
 */
import { Argon2PasswordHasher } from '../../src/modules/identity/infrastructure/services/Argon2PasswordHasher';
import { Password } from '../../src/modules/identity/domain/value-objects/Password';

const hasher = new Argon2PasswordHasher();

/**
 * Valida la política de contraseña sin hashear.
 *
 * Se usa para fallar temprano (antes de abrir la conexión) con el mensaje de
 * dominio exacto que ve el usuario en la API.
 */
export function assertPasswordPolicy(raw: string): Password {
  return Password.create(raw);
}

/**
 * Valida y hashea una contraseña en texto plano con Argon2id.
 *
 * @throws InvalidDataError si la contraseña no cumple la política.
 */
export async function hashPassword(raw: string): Promise<string> {
  return hasher.hash(Password.create(raw).value);
}
