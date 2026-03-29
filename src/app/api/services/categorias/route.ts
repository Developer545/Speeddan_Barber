import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/services/categorias
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

  const categorias = await prisma.barberCategoriaServicio.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json({ data: categorias });
}

// POST /api/services/categorias
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

  const body = await req.json();
  const nombre = (body.nombre ?? '').trim();
  if (!nombre) return NextResponse.json({ error: { message: 'El nombre es requerido' } }, { status: 400 });

  const exists = await prisma.barberCategoriaServicio.findFirst({
    where: { tenantId: user.tenantId, nombre: { equals: nombre, mode: 'insensitive' } },
  });
  if (exists) return NextResponse.json({ error: { message: 'Ya existe una categoría con ese nombre' } }, { status: 409 });

  const cat = await prisma.barberCategoriaServicio.create({
    data: { tenantId: user.tenantId, nombre, color: body.color ?? 'blue', activo: true },
  });
  return NextResponse.json({ data: cat }, { status: 201 });
}
