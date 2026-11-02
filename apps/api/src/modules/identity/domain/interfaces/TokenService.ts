import type { RoleName } from '../entities/Role';

export interface TokenPayload {
  userId: string;
  role: RoleName;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenService {
  generateTokens(payload: TokenPayload): TokenPair;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  hashToken(token: string): string;
  refreshExpirationDate(): Date;
}
