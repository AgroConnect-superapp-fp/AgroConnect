import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { TokenService, TokenPair } from '../../domain/interfaces/TokenService';
import type { RefreshInput } from '../dtos/authDtos';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
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

    await this.userRepository.rotateRefreshToken(currentHash, {
      tokenHash: this.tokenService.hashToken(tokens.refreshToken),
      expiresAt: this.tokenService.refreshExpirationDate(),
    });

    return tokens;
  }
}
