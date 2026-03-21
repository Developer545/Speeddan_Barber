import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const ventaId = parseInt(id)
  if (isNaN(ventaId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const venta = await prisma.barberVenta.findFirst({
    where: { id: ventaId, tenantId: user.tenantId },
    select: { dteJson: true, codigoGeneracion: true, tipoDte: true },
  })

  if (!venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (!venta.dteJson) return NextResponse.json({ error: 'Esta venta no tiene DTE generado' }, { status: 404 })

  return NextResponse.json({ dte: venta.dteJson })
}
