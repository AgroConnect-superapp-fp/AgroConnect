import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { LogoutInput } from '../dtos/authDtos';

export class LogoutUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    try {
      this.tokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      return;
    }

    const tokenHash = this.tokenService.hashToken(input.refreshToken);
    await this.userRepository.revokeRefreshToken(tokenHash);
  }
}
