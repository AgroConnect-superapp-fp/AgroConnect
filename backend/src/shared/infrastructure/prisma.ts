import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __agroconnectPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__agroconnectPrisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__agroconnectPrisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
