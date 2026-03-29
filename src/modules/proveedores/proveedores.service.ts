/**
 * proveedores.service.ts — Lógica de negocio para Proveedores.
 * Valida datos de entrada y serializa antes de enviar al cliente.
 */

import { NotFoundError, ValidationError } from '@/lib/errors';
import {
  findAllProveedores,
  findProveedorById,
  createProveedor,
  updateProveedor,
  deactivateProveedor,
  searchProveedores,
  getProveedoresStats,
  type ProveedorCreateInput,
  type ProveedorUpdateInput,
  type ProveedorFilters,
} from './proveedores.repository';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Serializa fechas a ISO string para pasar a Client Components. */
function serializeProveedor<T extends { createdAt: Date; updatedAt: Date }>(p: T) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Valida y construye el input de creación/actualización. */
function parseInput(raw: Record<string, unknown>): ProveedorCreateInput {
  if (!raw.nombre || typeof raw.nombre !== 'string' || !raw.nombre.trim()) {
    throw new ValidationError('El nombre del proveedor es obligatorio');
  }

  const plazoCredito = raw.plazoCredito !== undefined
    ? Number(raw.plazoCredito)
    : 0;

  if (isNaN(plazoCredito) || plazoCredito < 0) {
    throw new ValidationError('El plazo de crédito debe ser un número mayor o igual a 0');
  }

  const tipo = raw.tipo ? String(raw.tipo).toUpperCase() : 'NACIONAL';
  if (!['NACIONAL', 'INTERNACIONAL'].includes(tipo)) {
    throw new ValidationError('El tipo de proveedor debe ser NACIONAL o INTERNACIONAL');
  }

  return {
    nombre: String(raw.nombre).trim(),
    nit: raw.nit ? String(raw.nit).trim() : undefined,
    nrc: raw.nrc ? String(raw.nrc).trim() : undefined,
    correo: raw.correo ? String(raw.correo).trim().toLowerCase() : undefined,
    telefono: raw.telefono ? String(raw.telefono).trim() : undefined,
    tipo,
    contacto: raw.contacto ? String(raw.contacto).trim() : undefined,
    plazoCredito,
    direccion: raw.direccion ? String(raw.direccion).trim() : undefined,
  };
}

// ── List ───────────────────────────────────────────────────────────────────

export async function listProveedores(tenantId: number, filters: ProveedorFilters = {}) {
  const result = await findAllProveedores(tenantId, filters);
  return {
    ...result,
    items: result.items.map(serializeProveedor),
  };
}

// ── Detail ─────────────────────────────────────────────────────────────────

export async function getProveedorById(tenantId: number, id: number) {
  const proveedor = await findProveedorById(id, tenantId);
  if (!proveedor) throw new NotFoundError('Proveedor');
  return serializeProveedor(proveedor);
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createProveedorService(tenantId: number, raw: unknown) {
  const data = parseInput(raw as Record<string, unknown>);
  const proveedor = await createProveedor(tenantId, data);
  return serializeProveedor(proveedor);
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateProveedorService(tenantId: number, id: number, raw: unknown) {
  const existing = await findProveedorById(id, tenantId);
  if (!existing) throw new NotFoundError('Proveedor');

  const rawData = raw as Record<string, unknown>;

  // Construir update parcial — solo campos enviados
  const update: ProveedorUpdateInput = {};

  if (rawData.nombre !== undefined) {
    if (!rawData.nombre || typeof rawData.nombre !== 'string' || !String(rawData.nombre).trim()) {
      throw new ValidationError('El nombre del proveedor es obligatorio');
    }
    update.nombre = String(rawData.nombre).trim();
  }

  if (rawData.nit !== undefined) update.nit = rawData.nit ? String(rawData.nit).trim() : undefined;
  if (rawData.nrc !== undefined) update.nrc = rawData.nrc ? String(rawData.nrc).trim() : undefined;
  if (rawData.correo !== undefined) update.correo = rawData.correo ? String(rawData.correo).trim().toLowerCase() : undefined;
  if (rawData.telefono !== undefined) update.telefono = rawData.telefono ? String(rawData.telefono).trim() : undefined;
  if (rawData.contacto !== undefined) update.contacto = rawData.contacto ? String(rawData.contacto).trim() : undefined;
  if (rawData.direccion !== undefined) update.direccion = rawData.direccion ? String(rawData.direccion).trim() : undefined;

  if (rawData.tipo !== undefined) {
    const tipo = String(rawData.tipo).toUpperCase();
    if (!['NACIONAL', 'INTERNACIONAL'].includes(tipo)) {
      throw new ValidationError('El tipo debe ser NACIONAL o INTERNACIONAL');
    }
    update.tipo = tipo;
  }

  if (rawData.plazoCredito !== undefined) {
    const plazo = Number(rawData.plazoCredito);
    if (isNaN(plazo) || plazo < 0) {
      throw new ValidationError('El plazo de crédito debe ser mayor o igual a 0');
    }
    update.plazoCredito = plazo;
  }

  if (typeof rawData.activo === 'boolean') {
    update.activo = rawData.activo;
  }

  const updated = await updateProveedor(id, tenantId, update);
  return serializeProveedor(updated);
}

// ── Deactivate (soft delete) ───────────────────────────────────────────────

export async function deactivateProveedorService(tenantId: number, id: number) {
  const existing = await findProveedorById(id, tenantId);
  if (!existing) throw new NotFoundError('Proveedor');
  const result = await deactivateProveedor(id, tenantId);
  return serializeProveedor(result);
}

// ── Quick search ───────────────────────────────────────────────────────────

export async function quickSearchProveedores(tenantId: number, query: string) {
  return searchProveedores(tenantId, query.trim(), 10);
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getStats(tenantId: number) {
  return getProveedoresStats(tenantId);
}
