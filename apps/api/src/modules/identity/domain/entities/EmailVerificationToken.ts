export interface EmailVerificationTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class EmailVerificationToken {
  private constructor(private readonly props: EmailVerificationTokenProps) {}

  static create(props: EmailVerificationTokenProps): EmailVerificationToken {
    return new EmailVerificationToken(props);
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

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | null {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isUsable(now: Date = new Date()): boolean {
    return this.props.usedAt === null && !this.isExpired(now);
  }
}
