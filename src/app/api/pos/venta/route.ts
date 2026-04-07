import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, apiError } from '@/lib/response'
import { UnauthorizedError } from '@/lib/errors'
import { createVenta, getVentas } from '@/modules/pos/pos.service'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new UnauthorizedError()

    const sp = req.nextUrl.searchParams
    const result = await getVentas(user.tenantId, {
      estado: sp.get('estado') || undefined,
      tipoDte: sp.get('tipoDte') || undefined,
      turnoId: sp.get('turnoId') ? Number(sp.get('turnoId')) : undefined,
      desde: sp.get('desde') || undefined,
      hasta: sp.get('hasta') || undefined,
      page: Number(sp.get('page') || '1'),
    })
    return ok(result)
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new UnauthorizedError()

    const body = await req.json()
    const result = await createVenta(user.tenantId, body)
    return created(result)
  } catch (e) {
    return apiError(e)
  }
}
