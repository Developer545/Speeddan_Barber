/**
 * cxp.repository.ts — Capa de datos para Cuentas por Pagar.
 * Filtra compras con condicionPago=CREDITO y estado!=ANULADA.
 * Calcula saldos, fechas de vencimiento y estado de cada CxP.
 */

import { prisma } from '@/lib/prisma';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type EstadoCxP = 'VENCIDA' | 'POR_VENCER' | 'VIGENTE' | 'PAGADA';

export type PagoCxPCreateInput = {
  compraId:   number;
  monto:      number;
  metodoPago: string;
  referencia?: string | null;
  notas?:      string | null;
  fecha?:      Date;
};

// ── Includes reutilizables ────────────────────────────────────────────────────

const CXP_INCLUDE = {
  proveedor: {
    select: {
      id:           true,
      nombre:       true,
      telefono:     true,
      correo:       true,
      plazoCredito: true,
    },
  },
  pagos: {
    orderBy: { fecha: 'desc' as const },
    select: {
      id:         true,
      monto:      true,
      metodoPago: true,
      referencia: true,
      notas:      true,
      fecha:      true,
      createdAt:  true,
    },
  },
  detalles: {
    include: {
      producto: {
        select: { id: true, codigo: true, nombre: true, unidadMedida: true },
      },
    },
  },
} as const;

// ── Helpers internos ──────────────────────────────────────────────────────────

function computeEstadoCxP(
  saldo: number,
  diasRestantes: number,
): EstadoCxP {
  if (saldo <= 0)               return 'PAGADA';
  if (diasRestantes < 0)        return 'VENCIDA';
  if (diasRestantes <= 5)       return 'POR_VENCER';
  return 'VIGENTE';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichCompra(compra: any) {
  const total          = compra.total.toNumber();
  const totalAbonado   = (compra.pagos as Array<{ monto: { toNumber(): number }; fecha: Date; createdAt: Date; [key: string]: unknown }>).reduce((sum, p) => sum + p.monto.toNumber(), 0);
  const saldo          = Math.max(0, total - totalAbonado);
  const plazo          = (compra.proveedor?.plazoCredito as number) ?? 0;
  const fechaVenc      = new Date((compra.fecha as Date).getTime() + plazo * 24 * 60 * 60 * 1000);
  const ahora          = new Date();
  const diasRestantes  = Math.floor((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  const estadoCxP      = computeEstadoCxP(saldo, diasRestantes);

  return {
    ...compra,
    total,
    subtotal:         (compra.subtotal as { toNumber(): number }).toNumber(),
    iva:              (compra.iva as { toNumber(): number }).toNumber(),
    fecha:            (compra.fecha as Date).toISOString(),
    createdAt:        (compra.createdAt as Date).toISOString(),
    updatedAt:        (compra.updatedAt as Date).toISOString(),
    pagos: (compra.pagos as Array<{ monto: { toNumber(): number }; fecha: Date; createdAt: Date; [key: string]: unknown }>).map(p => ({
      ...p,
      monto:     p.monto.toNumber(),
      fecha:     (p.fecha as Date).toISOString(),
      createdAt: (p.createdAt as Date).toISOString(),
    })),
    totalAbonado,
    saldo,
    fechaVencimiento: fechaVenc.toISOString(),
    diasRestantes,
    estadoCxP,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findAll(tenantId: number) {
  const compras = await prisma.barberCompra.findMany({
    where: {
      tenantId,
      condicionPago: 'CREDITO',
      estado: { not: 'ANULADA' },
    },
    include: CXP_INCLUDE,
    orderBy: { fecha: 'desc' },
  });

  return compras.map(enrichCompra);
}

export async function findById(id: number, tenantId: number) {
  const compra = await prisma.barberCompra.findFirst({
    where: { id, tenantId, condicionPago: 'CREDITO' },
    include: CXP_INCLUDE,
  });

  if (!compra) return null;
  return enrichCompra(compra);
}

export async function resumen(tenantId: number) {
  const compras = await prisma.barberCompra.findMany({
    where: {
      tenantId,
      condicionPago: 'CREDITO',
      estado: { not: 'ANULADA' },
    },
    include: {
      proveedor: { select: { plazoCredito: true } },
      pagos: { select: { monto: true } },
    },
  });

  const enriched = compras.map(c => {
    const total        = c.total.toNumber();
    const totalAbonado = c.pagos.reduce((s, p) => s + p.monto.toNumber(), 0);
    const saldo        = Math.max(0, total - totalAbonado);
    const plazo        = c.proveedor?.plazoCredito ?? 0;
    const fechaVenc    = new Date((c.fecha as Date).getTime() + plazo * 24 * 60 * 60 * 1000);
    const ahora        = new Date();
    const diasRestantes = Math.floor((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    const estadoCxP    = computeEstadoCxP(saldo, diasRestantes);
    return { total, saldo, estadoCxP };
  });

  const totalDocumentos  = enriched.length;
  const totalMonto       = enriched.reduce((s, c) => s + c.total, 0);
  const montoVencido     = enriched.filter(c => c.estadoCxP === 'VENCIDA').reduce((s, c) => s + c.saldo, 0);
  const montoPorVencer   = enriched.filter(c => c.estadoCxP === 'POR_VENCER').reduce((s, c) => s + c.saldo, 0);
  const montoVigente     = enriched.filter(c => c.estadoCxP === 'VIGENTE').reduce((s, c) => s + c.saldo, 0);
  const countVencidas    = enriched.filter(c => c.estadoCxP === 'VENCIDA').length;
  const countPorVencer   = enriched.filter(c => c.estadoCxP === 'POR_VENCER').length;
  const countVigentes    = enriched.filter(c => c.estadoCxP === 'VIGENTE').length;
  const countPagadas     = enriched.filter(c => c.estadoCxP === 'PAGADA').length;

  return {
    totalDocumentos,
    totalMonto,
    montoVencido,
    montoPorVencer,
    montoVigente,
    countVencidas,
    countPorVencer,
    countVigentes,
    countPagadas,
  };
}

// ── Pago CxP ──────────────────────────────────────────────────────────────────

export async function registrarPago(tenantId: number, data: PagoCxPCreateInput) {
  // Obtener la compra para verificar saldo y pertenencia al tenant
  const compra = await prisma.barberCompra.findFirst({
    where: { id: data.compraId, tenantId, condicionPago: 'CREDITO', estado: { not: 'ANULADA' } },
    include: { pagos: { select: { monto: true } } },
  });

  if (!compra) return null;

  const totalAbonado = compra.pagos.reduce((s, p) => s + p.monto.toNumber(), 0);
  const saldo        = Math.max(0, compra.total.toNumber() - totalAbonado);

  // Crear el pago
  const pago = await prisma.barberPagoCxP.create({
    data: {
      tenantId,
      compraId:   data.compraId,
      monto:      data.monto,
      metodoPago: data.metodoPago,
      referencia: data.referencia ?? null,
      notas:      data.notas      ?? null,
      fecha:      data.fecha      ?? new Date(),
    },
  });

  // Si el saldo queda en 0, marcar compra como PAGADA
  const nuevoSaldo = Math.max(0, saldo - data.monto);
  if (nuevoSaldo <= 0.009) {
    await prisma.barberCompra.update({
      where: { id: data.compraId },
      data:  { estado: 'PAGADA' },
    });
  }

  return {
    ...pago,
    monto:     pago.monto.toNumber(),
    fecha:     (pago.fecha as Date).toISOString(),
    createdAt: (pago.createdAt as Date).toISOString(),
  };
}
