import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/productos/categorias/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

    const { id } = await params;
    const catId = parseInt(id);

    const cat = await prisma.barberCategoriaProducto.findFirst({
        where: { id: catId, tenantId: user.tenantId },
    });
    if (!cat) return NextResponse.json({ error: { message: 'Categoría no encontrada' } }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.barberCategoriaProducto.update({
        where: { id: catId },
        data: {
            ...(body.nombre !== undefined && { nombre: String(body.nombre).trim() }),
            ...(body.color !== undefined && { color: body.color }),
            ...(body.activa !== undefined && { activa: body.activa }),
        },
    });
    return NextResponse.json({ data: updated });
}

// DELETE /api/productos/categorias/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: { message: 'No autorizado' } }, { status: 401 });

    const { id } = await params;
    const catId = parseInt(id);

    const cat = await prisma.barberCategoriaProducto.findFirst({
        where: { id: catId, tenantId: user.tenantId },
    });
    if (!cat) return NextResponse.json({ error: { message: 'Categoría no encontrada' } }, { status: 404 });

    // Soft-delete: set activa = false (keeps referential integrity with products)
    await prisma.barberCategoriaProducto.update({
        where: { id: catId },
        data: { activa: false },
    });
    return NextResponse.json({ data: { ok: true } });
}
