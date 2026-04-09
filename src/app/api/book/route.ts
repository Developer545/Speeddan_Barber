/**
 * GET /api/book — Lista pública de negocios activos (sin auth)
 *
 * Usado por landing pages externas (ej: BookStyle) para mostrar
 * todos los negocios disponibles antes de que el cliente elija uno.
 *
 * Solo expone campos públicos. No requiere autenticación.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { BusinessType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') as BusinessType | null;

  try {
    const tenants = await prisma.barberTenant.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL'] },
        deletedAt: null,
        ...(type && { businessType: type }),
      },
      select: {
        id:           true,
        name:         true,
        slug:         true,
        city:         true,
        address:      true,
        phone:        true,
        logoUrl:      true,
        businessType: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo cargar la lista de negocios.' },
      { status: 500 },
    );
  }
}
