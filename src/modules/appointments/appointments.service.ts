/**
 * appointments.service.ts — Lógica de negocio para citas.
 */

import { NotFoundError, ValidationError } from '@/lib/errors';
import { addMinutes } from 'date-fns';
import * as repo from './appointments.repository';
import type { BarberAppointmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function listAppointments(tenantId: number, query: Record<string, string> = {}) {
  const filters: repo.AppointmentFilters = {};
  if (query.status) filters.status = query.status as BarberAppointmentStatus;
  if (query.barberId) filters.barberId = Number(query.barberId);
  if (query.from) filters.from = new Date(query.from);
  if (query.to) filters.to = new Date(query.to);

  const appointments = await repo.findAllAppointments(tenantId, filters);
  return appointments.map(serializeAppointment);
}

export async function getAppointment(id: number, tenantId: number) {
  const appt = await repo.findAppointmentById(id, tenantId);
  if (!appt) throw new NotFoundError('Cita');
  return serializeAppointment(appt);
}

export async function createAppointment(tenantId: number, body: unknown) {
  const b = body as Record<string, unknown>;
  if (!b.clientId || !b.barberId || !b.serviceId || !b.startTime) {
    throw new ValidationError('clientId, barberId, serviceId y startTime son requeridos');
  }

  const service = await prisma.barberService.findFirst({
    where: { id: Number(b.serviceId), tenantId },
  });
  if (!service) throw new NotFoundError('Servicio');

  const startTime = new Date(b.startTime as string);
  const endTime = addMinutes(startTime, service.duration);

  const appt = await repo.createAppointment(tenantId, {
    clientId: Number(b.clientId),
    barberId: Number(b.barberId),
    serviceId: Number(b.serviceId),
    startTime,
    endTime,
    notes: b.notes as string | undefined,
  });
  return serializeAppointment(appt);
}

export async function updateAppointment(id: number, tenantId: number, body: unknown) {
  const existing = await repo.findAppointmentById(id, tenantId);
  if (!existing) throw new NotFoundError('Cita');

  const b = body as Record<string, unknown>;
  const data: Partial<repo.AppointmentCreateInput> = {};
  if (b.startTime) {
    data.startTime = new Date(b.startTime as string);
    const service = await prisma.barberService.findFirst({
      where: { id: existing.serviceId, tenantId },
    });
    data.endTime = addMinutes(data.startTime, service?.duration ?? 30);
  }
  if (b.barberId) data.barberId = Number(b.barberId);
  if (b.serviceId) data.serviceId = Number(b.serviceId);
  if (b.notes !== undefined) data.notes = b.notes as string;

  const updated = await repo.updateAppointment(id, tenantId, data);
  return serializeAppointment(updated);
}

export async function cancelAppointment(id: number, tenantId: number, reason?: string) {
  const existing = await repo.findAppointmentById(id, tenantId);
  if (!existing) throw new NotFoundError('Cita');
  if (existing.status === 'CANCELLED') throw new ValidationError('La cita ya está cancelada');

  const updated = await repo.updateAppointmentStatus(id, tenantId, 'CANCELLED', reason);
  return serializeAppointment(updated);
}

// ── Stats POS — ventas últimos 7 días ────────────────────────────────────────
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

async function getVentasPosSemana(tenantId: number) {
  const results = [];
  for (let i = 6; i >= 0; i--) {
    const d     = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const agg   = await prisma.barberVenta.aggregate({
      where: { tenantId, estado: 'ACTIVA', createdAt: { gte: start, lt: end } },
      _sum:   { total: true },
      _count: { id: true },
    });
    results.push({
      day:   DAY_LABELS[d.getDay()],
      total: parseFloat((agg._sum.total?.toNumber() ?? 0).toFixed(2)),
      count: agg._count.id,
    });
  }
  return results;
}

export async function getStats(tenantId: number) {
  const now      = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const since30    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7     = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const inicioSeisM = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    citasHoy, citasPendientes, ingresosAppt, clientesActivos, citasSemana,
    ventasPosHoy, ingresosPosHoyAgg, ventasSemana, ventasMesAgg, clientesPosAgg,
    ventasMensuales, gastosMensuales, detallesTop,
  ] = await Promise.all([
    repo.countTodayAppointments(tenantId, todayStart, todayEnd),
    repo.countPendingAppointments(tenantId),
    repo.sumPaymentsToday(tenantId, todayStart, todayEnd),
    repo.countActiveClientsLast30Days(tenantId, since30),
    repo.countAppointmentsLast7Days(tenantId),
    // POS: ventas de hoy
    prisma.barberVenta.count({
      where: { tenantId, estado: 'ACTIVA', createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.barberVenta.aggregate({
      where: { tenantId, estado: 'ACTIVA', createdAt: { gte: todayStart, lt: todayEnd } },
      _sum: { total: true },
    }),
    // POS: últimos 7 días (para gráfica de barras)
    getVentasPosSemana(tenantId),
    // POS: últimos 7 días (para ticket promedio)
    prisma.barberVenta.aggregate({
      where: { tenantId, estado: 'ACTIVA', createdAt: { gte: since7 } },
      _sum:   { total: true },
      _count: { id: true },
    }),
    // POS: clientes únicos últimos 30 días
    prisma.barberVenta.findMany({
      where:  { tenantId, estado: 'ACTIVA', createdAt: { gte: since30 }, clienteId: { not: null } },
      select: { clienteId: true },
      distinct: ['clienteId'],
    }),
    // GRÁFICA: ingresos mensuales (ventas POS últimos 6 meses)
    prisma.barberVenta.findMany({
      where: { tenantId, estado: 'ACTIVA', createdAt: { gte: inicioSeisM } },
      select: { total: true, createdAt: true },
    }),
    // GRÁFICA: gastos mensuales últimos 6 meses
    prisma.barberGasto.findMany({
      where: { tenantId, fecha: { gte: inicioSeisM } },
      select: { monto: true, fecha: true },
    }),
    // GRÁFICA: top servicios por ingreso (últimos 30 días)
    prisma.barberDetalleVenta.findMany({
      where: {
        servicioId: { not: null },
        venta: { tenantId, estado: 'ACTIVA', createdAt: { gte: since30 } },
      },
      select: { descripcion: true, subtotal: true, cantidad: true },
    }),
  ]);

  const ingresosPosHoy = ingresosPosHoyAgg._sum.total?.toNumber() ?? 0;
  const ingresosHoy    = parseFloat((ingresosAppt + ingresosPosHoy).toFixed(2));
  const ventasSemanaTotal = ventasMesAgg._sum.total?.toNumber() ?? 0;
  const ventasSemanaCount = ventasMesAgg._count.id;
  const ticketPromedio = ventasSemanaCount > 0
    ? parseFloat((ventasSemanaTotal / ventasSemanaCount).toFixed(2))
    : 0;

  // ── Ingresos vs Gastos últimos 6 meses ─────────────────
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const mapaM = new Map<string, { ingresos: number; gastos: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    mapaM.set(k, { ingresos: 0, gastos: 0 });
  }
  for (const v of ventasMensuales) {
    const d = v.createdAt;
    const k = `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const entry = mapaM.get(k);
    if (entry) entry.ingresos += Number(v.total);
  }
  for (const g of gastosMensuales) {
    const d = g.fecha;
    const k = `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const entry = mapaM.get(k);
    if (entry) entry.gastos += Number(g.monto);
  }
  const ingresosVsGastos = Array.from(mapaM.entries()).map(([mes, v]) => ({
    mes,
    ingresos: parseFloat(v.ingresos.toFixed(2)),
    gastos:   parseFloat(v.gastos.toFixed(2)),
    utilidad: parseFloat((v.ingresos - v.gastos).toFixed(2)),
  }));

  // ── Top servicios por ingreso (últimos 30 días) ─────────
  const mapaServ = new Map<string, { total: number; cantidad: number }>();
  for (const d of detallesTop) {
    const entry = mapaServ.get(d.descripcion) ?? { total: 0, cantidad: 0 };
    entry.total += Number(d.subtotal);
    entry.cantidad += d.cantidad;
    mapaServ.set(d.descripcion, entry);
  }
  const topServicios = Array.from(mapaServ.entries())
    .map(([nombre, v]) => ({ nombre, total: parseFloat(v.total.toFixed(2)), cantidad: v.cantidad }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    citasHoy,
    citasPendientes,
    ingresosHoy,
    clientesActivos: Math.max(clientesActivos, clientesPosAgg.length),
    citasSemana,
    // POS
    ventasPosHoy,
    ingresosPosHoy: parseFloat(ingresosPosHoy.toFixed(2)),
    ventasSemana,
    ticketPromedio,
    // Gráficas nuevas
    ingresosVsGastos,
    topServicios,
  };
}

// ── Serializer ────────────────────────────────────────

type RawAppointment = Awaited<ReturnType<typeof repo.findAppointmentById>>;

function serializeAppointment(appt: NonNullable<RawAppointment>) {
  return {
    ...appt,
    service: {
      ...appt.service,
      price: appt.service.price.toNumber(),
    },
    payment: appt.payment
      ? { ...appt.payment, amount: appt.payment.amount.toNumber() }
      : null,
  };
}
