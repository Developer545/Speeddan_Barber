/**
 * prisma.ts — Singleton de PrismaClient.
 * Una sola instancia en toda la app (evita el error
 * 'too many connections' en desarrollo con hot-reload).
 * Igual que en DTE Online pero correctamente aislado.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
