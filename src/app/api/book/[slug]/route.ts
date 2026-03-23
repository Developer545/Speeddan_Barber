/**
 * GET  /api/book/[slug]  — tenant info, services, barbers (público, sin auth)
 * POST /api/book/[slug]  — crear cita pública (sin auth)
 *
 * SEGURIDAD:
 *  - Rate limiting: máx 5 reservas por teléfono cada 24 h
 *  - Sólo expone campos públicos (nombre, precio, duración)
 *  - Inputs sanitizados y validados antes de tocar la BD
 *  - El cliente invitado SOLO se crea con rol CLIENT — sin acceso al ERP
 *  - Nunca se devuelven tokens ni datos internos del tenant
 *  - CORS manejado por Next.js (same-origin por defecto)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma }      from '@/lib/prisma';
import { addMinutes }  from 'date-fns';

// ── Sanitizar texto libre (evita XSS en notas/nombres) ──
function sanitize(s: string, maxLen = 200): string {
  return s
    .replace(/[<>'"]/g, '')   // strip HTML chars
    .trim()
    .slice(0, maxLen);
}

// ── Validaciones de formato ──────────────────────────────
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE  = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_RE = /^\+?[\d\s\-().]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Rate limit en memoria (funciona en instancia serverless) ─
// Para producción de alto tráfico usar Redis/Upstash.
const rateLimitMap = new Map<string, { count: number; firstAt: number }>();
const RL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h
const RL_MAX       = 5;                     // máx 5 reservas/teléfono/día

function checkRateLimit(phone: string): boolean {
  const key  = phone.replace(/\D/g, '');
  const now  = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstAt > RL_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count += 1;
  return true;
}

// ── GET — información pública ────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Solo slugs válidos (alfanumérico + guiones)
  if (!/^[a-z0-9-]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const tenant = await prisma.barberTenant.findUnique({
    where: { slug },
    // Solo campos necesarios para la página pública
    select: { id: true, name: true, slug: true, phone: true, address: true, city: true, logoUrl: true },
  });
  if (!tenant) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

  const [services, barbers] = await Promise.all([
    prisma.barberService.findMany({
      where:   { tenantId: tenant.id, active: true },
      select:  { id: true, name: true, description: true, price: true, duration: true, category: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.barber.findMany({
      where:   { tenantId: tenant.id, active: true },
      select:  { id: true, specialties: true, user: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { id: 'asc' },
    }),
  ]);

  return NextResponse.json({
    tenant,
    services: services.map(s => ({ ...s, price: Number(s.price) })),
    barbers:  barbers.map(b => ({
      id: b.id, name: b.user.fullName,
      avatarUrl: b.user.avatarUrl, specialties: b.specialties,
    })),
  });
}

// ── POST — crear reserva pública ─────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // ── 1. Validar slug ────────────────────────────────────
  if (!/^[a-z0-9-]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  // ── 2. Parsear y validar body ──────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const serviceId   = Number(body.serviceId);
  const barberId    = body.barberId != null ? Number(body.barberId) : null;
  const date        = String(body.date ?? '');
  const time        = String(body.time ?? '');
  const clientName  = sanitize(String(body.clientName  ?? ''), 100);
  const clientPhone = sanitize(String(body.clientPhone ?? ''),  20);
  const clientEmail = body.clientEmail ? sanitize(String(body.clientEmail), 120) : undefined;
  const notes       = body.notes       ? sanitize(String(body.notes), 300) : undefined;

  // Validaciones
  if (!serviceId || isNaN(serviceId))
    return NextResponse.json({ error: 'serviceId inválido' }, { status: 400 });
  if (!DATE_RE.test(date))
    return NextResponse.json({ error: 'Fecha inválida (YYYY-MM-DD)' }, { status: 400 });
  if (!TIME_RE.test(time))
    return NextResponse.json({ error: 'Hora inválida (HH:MM)' }, { status: 400 });
  if (clientName.length < 2)
    return NextResponse.json({ error: 'Nombre demasiado corto' }, { status: 400 });
  if (!PHONE_RE.test(clientPhone))
    return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
  if (clientEmail && !EMAIL_RE.test(clientEmail))
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });

  // No permitir fechas pasadas
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m]     = time.split(':').map(Number);
  const startTime  = new Date(y, mo - 1, d, h, m, 0);
  const now        = new Date();
  now.setMinutes(now.getMinutes() - 5); // 5 min de gracia
  if (startTime < now)
    return NextResponse.json({ error: 'No puedes reservar en una fecha/hora pasada' }, { status: 400 });

  // ── 3. Rate limiting por teléfono ──────────────────────
  if (!checkRateLimit(clientPhone)) {
    return NextResponse.json(
      { error: 'Has alcanzado el límite de reservas por hoy. Contáctanos directamente.' },
      { status: 429 }
    );
  }

  // ── 4. Validar tenant ──────────────────────────────────
  const tenant = await prisma.barberTenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: 'Barbería no encontrada' }, { status: 404 });

  // ── 5. Validar día no cerrado ──────────────────────────
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0);
  const override = await prisma.barberDayOverride.findUnique({
    where: { tenantId_date: { tenantId: tenant.id, date: dayStart } },
  });
  if (override && !override.isOpen) {
    return NextResponse.json({ error: 'La barbería no atiende ese día' }, { status: 409 });
  }

  // ── 6. Validar servicio pertenece a este tenant ────────
  const service = await prisma.barberService.findFirst({
    where: { id: serviceId, tenantId: tenant.id, active: true },
  });
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  const endTime = addMinutes(startTime, service.duration);

  // ── 7. Resolver barbero ────────────────────────────────
  let resolvedBarberId: number;

  if (!barberId) {
    // Cualquier barbero disponible
    const dayOfWeek  = startTime.getDay();
    const candidates = await prisma.barber.findMany({
      where:   { tenantId: tenant.id, active: true },
      include: {
        schedules:    { where: { dayOfWeek, active: true } },
        appointments: {
          where: {
            startTime: { lt: endTime },
            endTime:   { gt: startTime },
            status:    { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
    });
    const free = candidates.find(b => b.schedules.length > 0 && b.appointments.length === 0);
    if (!free)
      return NextResponse.json({ error: 'No hay barberos disponibles en ese horario' }, { status: 409 });
    resolvedBarberId = free.id;
  } else {
    // Validar que el barbero pertenece a este tenant
    const barberRecord = await prisma.barber.findFirst({
      where: { id: barberId, tenantId: tenant.id, active: true },
    });
    if (!barberRecord)
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

    // Verificar que esté libre
    const conflict = await prisma.barberAppointment.findFirst({
      where: {
        barberId,
        status:    { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
      },
    });
    if (conflict)
      return NextResponse.json({ error: 'El barbero ya tiene una cita en ese horario' }, { status: 409 });
    resolvedBarberId = barberId;
  }

  // ── 8. Buscar o crear cliente (solo rol CLIENT) ────────
  const guestEmail = clientEmail || `${clientPhone.replace(/\D/g, '')}@guest.speeddan.com`;

  let clientUser = await prisma.barberUser.findFirst({
    where: { tenantId: tenant.id, phone: clientPhone },
  }) ?? await prisma.barberUser.findFirst({
    where: { tenantId: tenant.id, email: guestEmail },
  });

  if (!clientUser) {
    const bcrypt    = await import('bcryptjs');
    const randomPwd = await bcrypt.hash(crypto.randomUUID(), 10);
    clientUser = await prisma.barberUser.create({
      data: {
        tenantId: tenant.id,
        email:    guestEmail,
        password: randomPwd,        // contraseña aleatoria — no puede iniciar sesión
        fullName: clientName,
        phone:    clientPhone,
        role:     'CLIENT',         // nunca OWNER ni BARBER
        active:   true,
      },
    });
  }

  // ── 9. Crear cita ──────────────────────────────────────
  const appointment = await prisma.barberAppointment.create({
    data: {
      tenantId:  tenant.id,
      clientId:  clientUser.id,
      barberId:  resolvedBarberId,
      serviceId: service.id,
      startTime,
      endTime,
      status:    'PENDING',
      notes:     notes ?? null,
    },
    include: {
      barber:  { include: { user: { select: { fullName: true } } } },
      service: { select: { name: true, price: true, duration: true } },
    },
  });

  // Solo devolvemos lo necesario para la pantalla de confirmación
  return NextResponse.json({
    ok:          true,
    barberName:  appointment.barber.user.fullName,
    serviceName: appointment.service.name,
    startTime:   appointment.startTime.toISOString(),
    endTime:     appointment.endTime.toISOString(),
  }, { status: 201 });
}
