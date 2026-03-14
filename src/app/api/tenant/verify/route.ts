/**
 * GET /api/tenant/verify?slug=mi-barberia
 * Endpoint público — verifica que el tenant existe y devuelve info básica.
 * Usado en el paso 1 del login (igual que DTE Online).
 */

import { NextRequest } from 'next/server';
import { tenantsService } from '@/modules/tenants/tenants.service';
import { ok, apiError } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) return apiError({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'slug requerido' } as any);

    const info = await tenantsService.getPublicInfo(slug);
    return ok(info);
  } catch (err) {
    return apiError(err);
  }
}
