import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, TOKEN_SERVICE } from '../tokens';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { LogoutInput } from '../dtos/authDtos';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
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
