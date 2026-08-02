import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

/**
 * Instancia unica de Prisma para toda la app.
 * En desarrollo se guarda en globalThis para que el hot-reload de `tsx watch`
 * no abra una conexion nueva en cada recarga y agote el pool de Postgres.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
