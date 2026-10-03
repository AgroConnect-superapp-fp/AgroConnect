import { randomUUID } from 'node:crypto';
import {
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
  InvalidDataError,
  PhoneAlreadyExistsError,
  RoleNotFoundError,
} from '../../domain/errors/AuthErrors';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { Documento } from '../../domain/value-objects/Documento';
import { Celular } from '../../domain/value-objects/Celular';
import type { User, PublicUserProfile } from '../../domain/entities/User';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { PasswordHasher } from '../../domain/interfaces/PasswordHasher';
import type { TokenService, TokenPair } from '../../domain/interfaces/TokenService';
import type { RegisterUserInput } from '../dtos/authDtos';

export interface RegisterUserResult {
  user: PublicUserProfile;
  tokens: TokenPair;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const fullName = input.nombre.trim();
    if (fullName.length < 3) {
      throw new InvalidDataError('El nombre completo debe tener al menos 3 caracteres');
    }

    const email = Email.create(input.correo);
    const password = Password.create(input.password);
    const document = Documento.create(input.documento);
    const phone = Celular.create(input.celular);

    if (!input.aceptaTratamientoDatos) {
      throw new InvalidDataError(
        'Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012)',
      );
    }

    const role = await this.userRepository.findRoleByName(input.rol);
    if (!role) {
      throw new RoleNotFoundError(input.rol);
    }

    if (role.requiresProducerProfile() && !input.finca) {
      throw new InvalidDataError('El rol productor requiere los datos de la finca');
    }

    if (role.requiresCompanyProfile() && !input.empresa) {
      throw new InvalidDataError('El rol de empresa requiere los datos de la empresa');
    }

    const [existingEmail, existingDocument, existingPhone] = await Promise.all([
      this.userRepository.findByEmail(email.value),
      this.userRepository.findByDocument(document.value),
      this.userRepository.findByPhone(phone.value),
    ]);

    if (existingEmail) {
      throw new EmailAlreadyExistsError();
    }

    if (existingDocument) {
      throw new DocumentAlreadyExistsError();
    }

    if (existingPhone) {
      throw new PhoneAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(password.value);
    const userId = randomUUID();
    const tokens = this.tokenService.generateTokens({ userId, role: role.name });
    const refreshTokenHash = this.tokenService.hashToken(tokens.refreshToken);

    const user: User = await this.userRepository.register({
      user: {
        id: userId,
        fullName,
        document: document.value,
        email: email.value,
        phone: phone.value,
        passwordHash,
        roleId: role.id,
        roleName: role.name,
        acceptsDataProcessing: true,
      },
      producerProfile:
        role.requiresProducerProfile() && input.finca
          ? {
              farmName: input.finca.nombre,
              municipality: input.finca.municipio,
              village: input.finca.vereda,
              latitude: input.finca.latitud,
              longitude: input.finca.longitud,
            }
          : undefined,
      companyProfile:
        role.requiresCompanyProfile() && input.empresa
          ? {
              companyName: input.empresa.razonSocial,
              nit: input.empresa.nit,
              address: input.empresa.direccion,
            }
          : undefined,
      refreshToken: {
        tokenHash: refreshTokenHash,
        expiresAt: this.tokenService.refreshExpirationDate(),
      },
    });

    return {
      user: user.toPublicProfile(),
      tokens,
    };
  }
}
