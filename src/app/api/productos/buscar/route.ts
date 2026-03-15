/**
 * GET /api/productos/buscar?q=texto
 * Búsqueda rápida de productos para dropdowns y selectores.
 * Retorna máximo 20 resultados con campos mínimos.
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ok, apiError } from '@/lib/response';
import { UnauthorizedError } from '@/lib/errors';
import { searchProductos } from '@/modules/productos/productos.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();

    const q = req.nextUrl.searchParams.get('q') ?? '';
    const results = await searchProductos(user.tenantId, q);
    return ok(results);
  } catch (err) {
    return apiError(err);
  }
}
