import { prisma } from '../src/shared/infrastructure/prisma';

jest.setTimeout(30_000);

afterAll(async () => {
  await prisma.$disconnect();
});
