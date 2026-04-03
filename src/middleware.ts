/**
 * middleware.ts — Protección de rutas con auto-refresh de sesión.
 * Edge Runtime: solo usa 'jose' (sin Prisma).
 *
 * Flujo:
 *  1. Ruta pública → dejar pasar
 *  2. Access token válido → dejar pasar
 *  3. Access token expirado + refresh token presente → /api/auth/refresh?redirect=<path>
 *  4. Sin tokens → /login
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ACCESS_TOKEN  = 'barber_access_token'
const REFRESH_TOKEN = 'barber_refresh_token'

// Rutas que NO requieren autenticación
const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth',       // login, logout, refresh
  '/api/public',     // branding, info pública
  '/api/tenant/verify',
  '/booking',        // reservas públicas
  '/_next',
  '/favicon.ico',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(p =>
    pathname === p ||
    pathname.startsWith(p + '/') ||
    pathname.startsWith(p + '?')
  )
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '')
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  // Rutas públicas: sin verificación
  if (isPublic(pathname)) return NextResponse.next()

  const accessToken  = req.cookies.get(ACCESS_TOKEN)?.value
  const refreshToken = req.cookies.get(REFRESH_TOKEN)?.value

  // ── 1. Verificar access token ────────────────────────────────────────────
  if (accessToken) {
    try {
      await jwtVerify(accessToken, getSecret())
      return NextResponse.next() // Token válido → continuar
    } catch {
      // Expirado o inválido → intentar refresh
    }
  }

  // ── 2. Refresh token disponible → redirect al endpoint de refresh ────────
  if (refreshToken) {
    const refreshUrl = req.nextUrl.clone()
    refreshUrl.pathname = '/api/auth/refresh'
    refreshUrl.search   = ''
    // Guardar destino original para redirigir de vuelta después del refresh
    const original = pathname + req.nextUrl.search
    refreshUrl.searchParams.set('redirect', original)
    return NextResponse.redirect(refreshUrl)
  }

  // ── 3. Sin tokens válidos → login ────────────────────────────────────────
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search   = ''
  const res = NextResponse.redirect(loginUrl)
  // Limpiar cookies expiradas
  res.cookies.delete(ACCESS_TOKEN)
  return res
}

export const config = {
  matcher: [
    // Proteger todo excepto archivos estáticos de Next.js
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
