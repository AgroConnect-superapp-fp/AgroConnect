export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  generation: number;
  expiresAt: Date;
  revoked: boolean;
  rotatedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get generation(): number {
    return this.props.generation;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revoked(): boolean {
    return this.props.revoked;
  }

  get rotatedAt(): Date | null {
    return this.props.rotatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isRotated(): boolean {
    return this.props.rotatedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isUsable(now: Date = new Date()): boolean {
    return !this.props.revoked && !this.isRotated() && !this.isExpired(now);
  }
}
