import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE } from '../tokens';
import { InvalidCredentialsError } from '../../domain/errors/AuthErrors';
import { Email } from '../../domain/value-objects/Email';
import type { PublicUserProfile } from '../../domain/entities/User';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { PasswordHasher } from '../../domain/interfaces/PasswordHasher';
import type { TokenService, TokenPair } from '../../domain/interfaces/TokenService';
import type { LoginInput } from '../dtos/authDtos';

export interface LoginResult {
  user: PublicUserProfile;
  tokens: TokenPair;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const email = Email.create(input.correo);
    const user = await this.userRepository.findByEmail(email.value);

    if (!user || !user.isActive()) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.roleName,
    });

    await this.userRepository.saveRefreshToken({
      userId: user.id,
      tokenHash: this.tokenService.hashToken(tokens.refreshToken),
      expiresAt: this.tokenService.refreshExpirationDate(),
    });

    return {
      user: user.toPublicProfile(),
      tokens,
    };
  }
}
