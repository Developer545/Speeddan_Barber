import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ok, created } from '@/lib/response'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { listTarjetas, createTarjeta } from '@/modules/loyalty/loyalty.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  if (user.role !== 'OWNER') throw new ForbiddenError()
  const tarjetas = await listTarjetas(user.tenantId)
  return ok(tarjetas)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  if (user.role !== 'OWNER') throw new ForbiddenError()

  const body = await req.json()
  const { codigo, nombre, tipo, meta, dolarsPorPunto } = body

  if (!codigo || !nombre || !tipo || !meta) {
    return Response.json({ error: { message: 'Faltan campos obligatorios' } }, { status: 400 })
  }
  if (!['SELLOS', 'PUNTOS'].includes(tipo)) {
    return Response.json({ error: { message: 'Tipo inválido' } }, { status: 400 })
  }
  if (tipo === 'PUNTOS' && !dolarsPorPunto) {
    return Response.json({ error: { message: 'Indica cuántos dólares equivalen a 1 punto' } }, { status: 400 })
  }

  try {
    const tarjeta = await createTarjeta(user.tenantId, {
      codigo, nombre, tipo, meta: Number(meta),
      dolarsPorPunto: dolarsPorPunto ? Number(dolarsPorPunto) : undefined,
    })
    return created(tarjeta)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al crear tarjeta'
    const isUnique = msg.includes('Unique') || msg.includes('unique')
    return Response.json(
      { error: { message: isUnique ? 'El código ya existe en este tenant' : msg } },
      { status: 400 },
    )
  }
}
