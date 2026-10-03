import { Role, type RoleName } from '../../src/modules/auth/domain/entities/Role';
import { InvalidTokenError } from '../../src/modules/auth/domain/errors/AuthErrors';
import type {
  TokenPair,
  TokenPayload,
  TokenService,
} from '../../src/modules/auth/domain/interfaces/TokenService';

export class FakeTokenService implements TokenService {
  private counter = 0;

  generateTokens(payload: TokenPayload): TokenPair {
    this.counter += 1;
    return {
      accessToken: `access:${payload.userId}:${payload.role}`,
      refreshToken: `refresh:${payload.userId}:${payload.role}:${this.counter}`,
      expiresIn: 900,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.parse(token, 'access');
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.parse(token, 'refresh');
  }

  hashToken(token: string): string {
    return `hash:${token}`;
  }

  refreshExpirationDate(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private parse(token: string, kind: 'access' | 'refresh'): TokenPayload {
    const parts = token.split(':');
    const [prefix, userId, role] = parts;

    if (prefix !== kind || !userId || !role || !Role.isValidName(role)) {
      throw new InvalidTokenError();
    }

    return { userId, role: role as RoleName };
  }
}
