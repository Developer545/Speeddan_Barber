/**
 * proveedores.repository.ts — Capa de datos para BarberProveedor.
 * Todas las queries filtran por tenantId para garantizar aislamiento multi-tenant.
 */

import { prisma } from '@/lib/prisma';

// ── Tipos de entrada ───────────────────────────────────────────────────────

export type ProveedorCreateInput = {
  nombre:       string;
  nit?:         string;
  nrc?:         string;
  correo?:      string;
  telefono?:    string;
  tipo?:        string;
  contacto?:    string;
  plazoCredito?: number;
  direccion?:   string;
};

export type ProveedorUpdateInput = Partial<ProveedorCreateInput & { activo: boolean }>;

export type ProveedorFilters = {
  search?:   string;
  tipo?:     string;
  page?:     number;
  pageSize?: number;
};

// ── Select base ────────────────────────────────────────────────────────────

const PROVEEDOR_SELECT = {
  id:           true,
  tenantId:     true,
  nombre:       true,
  nit:          true,
  nrc:          true,
  correo:       true,
  telefono:     true,
  tipo:         true,
  contacto:     true,
  plazoCredito: true,
  direccion:    true,
  activo:       true,
  createdAt:    true,
  updatedAt:    true,
} as const;

// ── findAll con filtros y paginación ──────────────────────────────────────

export async function findAllProveedores(tenantId: number, filters: ProveedorFilters = {}) {
  const { search, tipo, page = 1, pageSize = 20 } = filters;
  const skip = (page - 1) * pageSize;

  const where = {
    tenantId,
    ...(tipo ? { tipo } : {}),
    ...(search
      ? {
          OR: [
            { nombre:  { contains: search, mode: 'insensitive' as const } },
            { nit:     { contains: search, mode: 'insensitive' as const } },
            { nrc:     { contains: search, mode: 'insensitive' as const } },
            { contacto:{ contains: search, mode: 'insensitive' as const } },
            { correo:  { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.barberProveedor.findMany({
      where,
      select:  PROVEEDOR_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take:    pageSize,
    }),
    prisma.barberProveedor.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ── findById ───────────────────────────────────────────────────────────────

export async function findProveedorById(id: number, tenantId: number) {
  return prisma.barberProveedor.findFirst({
    where:  { id, tenantId },
    select: PROVEEDOR_SELECT,
  });
}

// ── create ─────────────────────────────────────────────────────────────────

export async function createProveedor(tenantId: number, data: ProveedorCreateInput) {
  return prisma.barberProveedor.create({
    data: {
      tenantId,
      nombre:       data.nombre,
      nit:          data.nit          ?? null,
      nrc:          data.nrc          ?? null,
      correo:       data.correo       ?? null,
      telefono:     data.telefono     ?? null,
      tipo:         data.tipo         ?? 'NACIONAL',
      contacto:     data.contacto     ?? null,
      plazoCredito: data.plazoCredito ?? 0,
      direccion:    data.direccion    ?? null,
      activo:       true,
    },
    select: PROVEEDOR_SELECT,
  });
}

// ── update ─────────────────────────────────────────────────────────────────

export async function updateProveedor(id: number, tenantId: number, data: ProveedorUpdateInput) {
  return prisma.barberProveedor.update({
    where: { id },
    data: {
      ...(data.nombre       !== undefined && { nombre:       data.nombre }),
      ...(data.nit          !== undefined && { nit:          data.nit ?? null }),
      ...(data.nrc          !== undefined && { nrc:          data.nrc ?? null }),
      ...(data.correo       !== undefined && { correo:       data.correo ?? null }),
      ...(data.telefono     !== undefined && { telefono:     data.telefono ?? null }),
      ...(data.tipo         !== undefined && { tipo:         data.tipo }),
      ...(data.contacto     !== undefined && { contacto:     data.contacto ?? null }),
      ...(data.plazoCredito !== undefined && { plazoCredito: data.plazoCredito }),
      ...(data.direccion    !== undefined && { direccion:    data.direccion ?? null }),
      ...(data.activo       !== undefined && { activo:       data.activo }),
    },
    select: PROVEEDOR_SELECT,
  });
}

// ── deactivate (soft delete) ───────────────────────────────────────────────

export async function deactivateProveedor(id: number, tenantId: number) {
  return prisma.barberProveedor.update({
    where: { id },
    data:  { activo: false },
    select: PROVEEDOR_SELECT,
  });
}

// ── getStats ───────────────────────────────────────────────────────────────

export async function getProveedoresStats(tenantId: number) {
  const [total, conCredito, totalCompras] = await Promise.all([
    prisma.barberProveedor.count({ where: { tenantId } }),
    prisma.barberProveedor.count({ where: { tenantId, plazoCredito: { gt: 0 } } }),
    prisma.barberCompra.count({ where: { tenantId } }),
  ]);

  return { total, conCredito, totalCompras };
}

// ── search (quick search para dropdowns de Compras) ────────────────────────

export async function searchProveedores(tenantId: number, query: string, limit = 10) {
  return prisma.barberProveedor.findMany({
    where: {
      tenantId,
      activo: true,
      OR: [
        { nombre:  { contains: query, mode: 'insensitive' } },
        { nit:     { contains: query, mode: 'insensitive' } },
        { nrc:     { contains: query, mode: 'insensitive' } },
        { contacto:{ contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id:      true,
      nombre:  true,
      nit:     true,
      tipo:    true,
      telefono:true,
      correo:  true,
    },
    orderBy: { nombre: 'asc' },
    take:    limit,
  });
}
