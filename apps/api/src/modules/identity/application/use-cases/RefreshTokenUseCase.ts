import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, TOKEN_SERVICE } from '../tokens';
import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { TokenService, TokenPair } from '../../domain/interfaces/TokenService';
import type { RefreshInput } from '../dtos/authDtos';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(input: RefreshInput): Promise<TokenPair> {
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    const currentHash = this.tokenService.hashToken(input.refreshToken);

    const storedToken = await this.userRepository.findRefreshTokenByHash(currentHash);
    if (!storedToken || !storedToken.isUsable()) {
      throw new InvalidTokenError();
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive()) {
      throw new InvalidTokenError();
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.roleName,
    });

    const rotated = await this.userRepository.rotateRefreshToken(currentHash, {
      tokenHash: this.tokenService.hashToken(tokens.refreshToken),
      expiresAt: this.tokenService.refreshExpirationDate(),
    });
    if (!rotated) {
      throw new InvalidTokenError();
    }

    return tokens;
  }
}
