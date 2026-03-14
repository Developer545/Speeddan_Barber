import { NextRequest } from 'next/server';
import { authService } from '@/modules/auth/auth.service';
import { clearAuthCookies, getRefreshTokenFromCookie } from '@/lib/auth';
import { ok, apiError } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenFromCookie();
    if (refreshToken) await authService.logout(refreshToken);
    await clearAuthCookies();
    return ok({ message: 'Sesión cerrada' });
  } catch (err) {
    return apiError(err);
  }
}
