// eslint-disable-next-line @typescript-eslint/no-require-imports
import { PrismaClient } from "../../src/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? new (PrismaClient as unknown as new () => InstanceType<typeof PrismaClient>)();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
