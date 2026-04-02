import { prisma } from '@/lib/prisma'

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type CreateTarjetaData = {
  codigo: string
  nombre: string
  tipo: 'SELLOS' | 'PUNTOS'
  meta: number
  dolarsPorPunto?: number
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function listTarjetas(tenantId: number) {
  return prisma.barberLoyaltyTarjeta.findMany({
    where: { tenantId },
    include: { _count: { select: { movimientos: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTarjetaByCodigo(tenantId: number, codigo: string) {
  return prisma.barberLoyaltyTarjeta.findUnique({
    where: { tenantId_codigo: { tenantId, codigo: codigo.toUpperCase() } },
    include: {
      movimientos: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })
}

export async function createTarjeta(tenantId: number, data: CreateTarjetaData) {
  return prisma.barberLoyaltyTarjeta.create({
    data: {
      tenantId,
      codigo:         data.codigo.toUpperCase().trim(),
      nombre:         data.nombre.trim(),
      tipo:           data.tipo,
      meta:           data.meta,
      dolarsPorPunto: data.tipo === 'PUNTOS' && data.dolarsPorPunto
        ? data.dolarsPorPunto
        : null,
    },
  })
}

export async function deleteTarjeta(tenantId: number, id: number) {
  const tarjeta = await prisma.barberLoyaltyTarjeta.findFirst({
    where: { id, tenantId },
  })
  if (!tarjeta) throw new Error('Tarjeta no encontrada')
  if (tarjeta.saldoActual > 0) {
    throw new Error('No se puede eliminar una tarjeta con saldo acumulado')
  }
  return prisma.barberLoyaltyTarjeta.delete({ where: { id } })
}

// ── Lógica de acumulación ──────────────────────────────────────────────────────

export async function acumularLoyalty(
  tenantId: number,
  codigo: string,
  ventaId: number,
  totalVenta: number,
) {
  const tarjeta = await prisma.barberLoyaltyTarjeta.findUnique({
    where: { tenantId_codigo: { tenantId, codigo: codigo.toUpperCase() } },
  })
  if (!tarjeta) throw new Error('Tarjeta no encontrada')
  if (tarjeta.estado === 'PENDIENTE_CANJE') {
    throw new Error('Esta tarjeta tiene un canje pendiente. Primero registra el canje.')
  }

  // Calcular cuánto acumular
  let cantidad = 1 // SELLOS: siempre 1
  if (tarjeta.tipo === 'PUNTOS') {
    const dolares = tarjeta.dolarsPorPunto ? Number(tarjeta.dolarsPorPunto) : 1
    cantidad = Math.floor(totalVenta / dolares)
    if (cantidad < 1) cantidad = 0 // Si el total no alcanza para 1 punto, no acumula
  }

  if (cantidad === 0) {
    return { tarjeta, completada: false, cantidad: 0 }
  }

  const nuevoSaldo = tarjeta.saldoActual + cantidad
  const completada = nuevoSaldo >= tarjeta.meta
  const nuevoEstado = completada ? 'PENDIENTE_CANJE' : 'ACTIVA'

  const [tarjetaActualizada] = await prisma.$transaction([
    prisma.barberLoyaltyTarjeta.update({
      where: { id: tarjeta.id },
      data: {
        saldoActual: Math.min(nuevoSaldo, tarjeta.meta),
        estado:      nuevoEstado,
      },
    }),
    prisma.barberLoyaltyMovimiento.create({
      data: {
        tenantId,
        tarjetaId: tarjeta.id,
        ventaId,
        tipo:      'ACUMULO',
        cantidad,
        nota:      tarjeta.tipo === 'SELLOS'
          ? `Sello #${tarjeta.saldoActual + 1} de ${tarjeta.meta}`
          : `${cantidad} punto(s) por $${totalVenta.toFixed(2)}`,
      },
    }),
  ])

  return { tarjeta: tarjetaActualizada, completada, cantidad }
}

// ── Lógica de canje ────────────────────────────────────────────────────────────

export async function canjearLoyalty(tenantId: number, codigo: string, nota?: string) {
  const tarjeta = await prisma.barberLoyaltyTarjeta.findUnique({
    where: { tenantId_codigo: { tenantId, codigo: codigo.toUpperCase() } },
  })
  if (!tarjeta) throw new Error('Tarjeta no encontrada')

  const cantidadCanjeada = tarjeta.saldoActual

  const [tarjetaActualizada] = await prisma.$transaction([
    prisma.barberLoyaltyTarjeta.update({
      where: { id: tarjeta.id },
      data: { saldoActual: 0, estado: 'ACTIVA' },
    }),
    prisma.barberLoyaltyMovimiento.create({
      data: {
        tenantId,
        tarjetaId: tarjeta.id,
        tipo:      'CANJE',
        cantidad:  -cantidadCanjeada,
        nota:      nota ?? 'Premio canjeado — tarjeta reiniciada',
      },
    }),
  ])

  return tarjetaActualizada
}
