import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/services/categorias/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

  const { id } = await params;
  const catId = parseInt(id);
  const cat = await prisma.barberCategoriaServicio.findFirst({ where: { id: catId, tenantId: user.tenantId } });
  if (!cat) return NextResponse.json({ error: { message: 'Categoría no encontrada' } }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.barberCategoriaServicio.update({
    where: { id: catId },
    data: {
      ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
      ...(body.color  !== undefined && { color: body.color }),
      ...(body.activo !== undefined && { activo: body.activo }),
    },
  });
  return NextResponse.json({ data: updated });
}

// DELETE /api/services/categorias/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

  const { id } = await params;
  const catId = parseInt(id);
  const cat = await prisma.barberCategoriaServicio.findFirst({ where: { id: catId, tenantId: user.tenantId } });
  if (!cat) return NextResponse.json({ error: { message: 'Categoría no encontrada' } }, { status: 404 });

  await prisma.barberCategoriaServicio.delete({ where: { id: catId } });
  return NextResponse.json({ data: { ok: true } });
}
