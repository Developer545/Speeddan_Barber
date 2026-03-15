/**
 * compras.service.ts — Lógica de negocio para el módulo de Compras.
 * Valida entradas, delega al repositorio, serializa Decimals.
 */

import { NotFoundError, ValidationError } from '@/lib/errors';
import * as repo from './compras.repository';

// ── Tipos públicos (con Decimals serializados a number) ───────────────────────

type RawCompra = Awaited<ReturnType<typeof repo.findById>>;

function serializeCompra(compra: NonNullable<RawCompra>) {
  return {
    ...compra,
    subtotal: Number(compra.subtotal),
    iva:      Number(compra.iva),
    total:    Number(compra.total),
    fecha:    compra.fecha instanceof Date ? compra.fecha.toISOString() : compra.fecha,
    createdAt: compra.createdAt instanceof Date ? compra.createdAt.toISOString() : compra.createdAt,
    updatedAt: compra.updatedAt instanceof Date ? compra.updatedAt.toISOString() : compra.updatedAt,
    proveedor: compra.proveedor ?? null,
    detalles: compra.detalles.map((d) => ({
      ...d,
      cantidad:      Number(d.cantidad),
      costoUnitario: Number(d.costoUnitario),
      descuento:     Number(d.descuento),
      subtotal:      Number(d.subtotal),
      producto:      d.producto ?? null,
    })),
  };
}

// ── Listado ───────────────────────────────────────────────────────────────────

export async function listCompras(tenantId: number, query: Record<string, string> = {}) {
  const filters: repo.CompraFilters = {};

  if (query.search)       filters.search       = query.search;
  if (query.tipoCompra)   filters.tipoCompra   = query.tipoCompra;
  if (query.estado)       filters.estado       = query.estado;
  if (query.condicionPago) filters.condicionPago = query.condicionPago;
  if (query.from)         filters.from         = new Date(query.from);
  if (query.to)           filters.to           = new Date(query.to);
  if (query.page)         filters.page         = Number(query.page);
  if (query.limit)        filters.limit        = Number(query.limit);

  const { compras, total } = await repo.findAll(tenantId, filters);

  return {
    data:  compras.map(serializeCompra),
    total,
  };
}

// ── Detalle ───────────────────────────────────────────────────────────────────

export async function getCompra(id: number, tenantId: number) {
  const compra = await repo.findById(id, tenantId);
  if (!compra) throw new NotFoundError('Compra');
  return serializeCompra(compra);
}

// ── Crear ─────────────────────────────────────────────────────────────────────

export async function createCompra(tenantId: number, body: unknown) {
  const b = body as Record<string, unknown>;

  // Validaciones mínimas
  if (!b.numeroDocumento || String(b.numeroDocumento).trim() === '') {
    throw new ValidationError('El número de documento es requerido');
  }
  if (!b.tipoDocumento) {
    throw new ValidationError('El tipo de documento es requerido');
  }
  if (!b.fecha) {
    throw new ValidationError('La fecha es requerida');
  }

  const detalles = b.detalles as repo.DetalleInput[] | undefined;
  if (!detalles || detalles.length === 0) {
    throw new ValidationError('Debe registrar al menos un detalle de compra');
  }

  // Validar montos de cada línea
  for (const [i, d] of detalles.entries()) {
    if (Number(d.cantidad) <= 0) {
      throw new ValidationError(`La cantidad de la línea ${i + 1} debe ser mayor a 0`);
    }
    if (Number(d.costoUnitario) < 0) {
      throw new ValidationError(`El costo unitario de la línea ${i + 1} no puede ser negativo`);
    }
    if (Number(d.subtotal) < 0) {
      throw new ValidationError(`El subtotal de la línea ${i + 1} no puede ser negativo`);
    }
  }

  const subtotal = Number(b.subtotal);
  const iva      = Number(b.iva);
  const total    = Number(b.total);

  if (total <= 0) {
    throw new ValidationError('El total de la compra debe ser mayor a 0');
  }

  const compra = await repo.create(tenantId, {
    proveedorId:     b.proveedorId ? Number(b.proveedorId) : null,
    numeroDocumento: String(b.numeroDocumento).trim(),
    tipoDocumento:   String(b.tipoDocumento),
    tipoCompra:      b.tipoCompra ? String(b.tipoCompra) : 'PRODUCTO',
    condicionPago:   b.condicionPago ? String(b.condicionPago) : 'CONTADO',
    fecha:           new Date(b.fecha as string),
    subtotal,
    iva,
    total,
    notas:           b.notas ? String(b.notas) : null,
    detalles:        detalles.map((d) => ({
      productoId:    d.productoId ? Number(d.productoId) : null,
      descripcion:   d.descripcion ? String(d.descripcion) : null,
      cantidad:      Number(d.cantidad),
      costoUnitario: Number(d.costoUnitario),
      descuento:     Number(d.descuento ?? 0),
      subtotal:      Number(d.subtotal),
    })),
  });

  return serializeCompra(compra);
}

// ── Anular ────────────────────────────────────────────────────────────────────

export async function anularCompra(id: number, tenantId: number, motivo: string) {
  if (!motivo || motivo.trim() === '') {
    throw new ValidationError('Se requiere un motivo para anular la compra');
  }

  const existing = await repo.findById(id, tenantId);
  if (!existing) throw new NotFoundError('Compra');
  if (existing.estado === 'ANULADA') {
    throw new ValidationError('Esta compra ya está anulada');
  }

  const result = await repo.anular(id, tenantId, motivo.trim());
  if (!result) throw new NotFoundError('Compra');
  return serializeCompra(result);
}

// ── Pagos CxP ─────────────────────────────────────────────────────────────────

export async function registrarPago(tenantId: number, compraId: number, body: unknown) {
  const b = body as Record<string, unknown>;

  if (!b.monto || Number(b.monto) <= 0) {
    throw new ValidationError('El monto del pago debe ser mayor a 0');
  }
  if (!b.metodoPago) {
    throw new ValidationError('El método de pago es requerido');
  }

  const compra = await repo.findById(compraId, tenantId);
  if (!compra) throw new NotFoundError('Compra');
  if (compra.estado === 'ANULADA') {
    throw new ValidationError('No se puede registrar pago a una compra anulada');
  }

  const pago = await repo.registrarPago(tenantId, compraId, {
    monto:      Number(b.monto),
    metodoPago: String(b.metodoPago),
    referencia: b.referencia ? String(b.referencia) : undefined,
    notas:      b.notas      ? String(b.notas)      : undefined,
  });

  if (!pago) throw new ValidationError('El monto excede el saldo pendiente de la compra');

  return {
    ...pago,
    monto: Number(pago.monto),
    fecha: pago.fecha instanceof Date ? pago.fecha.toISOString() : pago.fecha,
    createdAt: pago.createdAt instanceof Date ? pago.createdAt.toISOString() : pago.createdAt,
  };
}

export async function historialPagos(tenantId: number, compraId: number) {
  const compra = await repo.findById(compraId, tenantId);
  if (!compra) throw new NotFoundError('Compra');

  const pagos = await repo.getHistorialPagos(tenantId, compraId);
  return pagos.map(p => ({
    ...p,
    monto:     Number(p.monto),
    fecha:     p.fecha instanceof Date     ? p.fecha.toISOString()     : p.fecha,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  }));
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats(tenantId: number) {
  return repo.getStats(tenantId);
}
