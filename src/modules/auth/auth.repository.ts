/**
 * auth.repository.ts — Queries de autenticación.
 * Solo acceso a BD para usuarios y sesiones.
 */

import { prisma } from '@/lib/prisma';
import type { BarberUserRole } from '@prisma/client';

export const authRepository = {
  async findUserByEmail(email: string, tenantId: number) {
    return prisma.barberUser.findUnique({
      where: { email_tenantId: { email, tenantId } },
      include: { barberProfile: true },
    });
  },

  async findUserById(id: number) {
    return prisma.barberUser.findUnique({
      where:   { id },
      include: { tenant: true },
    });
  },

  async createSession(data: {
    userId:       number;
    tenantId:     number;
    refreshToken: string;
    expiresAt:    Date;
    ipAddress?:   string;
    userAgent?:   string;
  }) {
    return prisma.barberSession.create({ data });
  },

  async findSession(refreshToken: string) {
    return prisma.barberSession.findUnique({
      where:   { refreshToken },
      include: { user: { include: { tenant: true } } },
    });
  },

  async deleteSession(refreshToken: string) {
    return prisma.barberSession.deleteMany({ where: { refreshToken } });
  },

  async deleteExpiredSessions() {
    return prisma.barberSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
