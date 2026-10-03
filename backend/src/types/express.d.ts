declare namespace Express {
  interface Request {
    correlationId?: string;
    auth?: {
      userId: string;
      role: string;
    };
  }
}
