import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Role } from '../../domain/entities/Role';
import type { TokenPair, TokenPayload, TokenService } from '../../domain/interfaces/TokenService';
import { InvalidTokenError } from '../../domain/errors/AuthErrors';

interface JwtClaims {
  sub: string;
  role: string;
  type?: string;
}

const TIME_UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

export function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Formato de duración inválido: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as string;
  return amount * (TIME_UNITS[unit] ?? 1);
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresIn: string,
    private readonly refreshExpiresIn: string,
  ) {}

  generateTokens(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign({ role: payload.role }, this.accessSecret, {
      subject: payload.userId,
      expiresIn: parseDurationToSeconds(this.accessExpiresIn),
    });

    const refreshToken = jwt.sign({ role: payload.role, type: 'refresh' }, this.refreshSecret, {
      subject: payload.userId,
      expiresIn: parseDurationToSeconds(this.refreshExpiresIn),
      jwtid: randomUUID(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(this.accessExpiresIn),
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    const claims = this.verify(token, this.accessSecret);
    return this.toPayload(claims);
  }

  verifyRefreshToken(token: string): TokenPayload {
    const claims = this.verify(token, this.refreshSecret);

    if (claims.type !== 'refresh') {
      throw new InvalidTokenError();
    }

    return this.toPayload(claims);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  refreshExpirationDate(): Date {
    const seconds = parseDurationToSeconds(this.refreshExpiresIn);
    return new Date(Date.now() + seconds * 1_000);
  }

  private verify(token: string, secret: string): JwtClaims {
    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
        throw new InvalidTokenError();
      }

      return {
        sub: decoded.sub,
        role: typeof decoded.role === 'string' ? decoded.role : '',
        type: typeof decoded.type === 'string' ? decoded.type : undefined,
      };
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw error;
      }
      throw new InvalidTokenError();
    }
  }

  private toPayload(claims: JwtClaims): TokenPayload {
    if (!Role.isValidName(claims.role)) {
      throw new InvalidTokenError();
    }

    return {
      userId: claims.sub,
      role: claims.role,
    };
  }
}
