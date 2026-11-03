import { EmailNotVerifiedError, InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { PublicUserProfile } from '../../domain/entities/User';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { TokenService, TokenPair } from '../../domain/interfaces/TokenService';
import type { RefreshInput } from '../dtos/authDtos';

export interface RefreshResult {
  user: PublicUserProfile;
  tokens: TokenPair;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshResult> {
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    const currentHash = this.tokenService.hashToken(input.refreshToken);

    const storedToken = await this.userRepository.findRefreshTokenByHash(currentHash);
    if (!storedToken) {
      throw new InvalidTokenError();
    }

    // Reuso: el token ya fue rotado o revocado. Se revoca la familia completa
    // (todas las generaciones) para cortar una posible cadena robada.
    if (storedToken.isRotated() || storedToken.revoked) {
      await this.userRepository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new InvalidTokenError();
    }

    if (storedToken.isExpired()) {
      throw new InvalidTokenError();
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive()) {
      throw new InvalidTokenError();
    }

    if (!user.isEmailVerified()) {
      throw new EmailNotVerifiedError();
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.roleName,
    });

    const rotated = await this.userRepository.rotateRefreshToken(currentHash, {
      tokenHash: this.tokenService.hashToken(tokens.refreshToken),
      expiresAt: this.tokenService.refreshExpirationDate(),
      familyId: storedToken.familyId,
      generation: storedToken.generation + 1,
    });
    if (!rotated) {
      throw new InvalidTokenError();
    }

    return {
      user: user.toPublicProfile(),
      tokens,
    };
  }
}
