/**
 * gastos.service.ts — Lógica de negocio para el módulo de Gastos.
 * Valida entradas, serializa Decimales y delega al repositorio.
 */

import { ValidationError, NotFoundError } from '@/lib/errors';
import {
  listCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoriaIfEmpty,
  findAll,
  findById,
  create,
  update,
  deleteGasto,
  resumenPorCategoria,
  getStats,
  type CategoriaCreateInput,
  type GastoFilters,
} from './gastos.repository';

// ── Helpers ───────────────────────────────────────────────────────────────────

function serializeGasto(g: NonNullable<Awaited<ReturnType<typeof findById>>>) {
  return {
    ...g,
    monto:    g.monto.toNumber(),
    fecha:    (g.fecha as Date).toISOString(),
    createdAt: (g.createdAt as Date).toISOString(),
    updatedAt: (g.updatedAt as Date).toISOString(),
    categoria: {
      ...g.categoria,
    },
  };
}

function serializeCategoria(c: {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { gastos: number };
}) {
  return {
    ...c,
    createdAt: (c.createdAt as Date).toISOString(),
    updatedAt: (c.updatedAt as Date).toISOString(),
    countGastos: c._count.gastos,
  };
}

// ── Categorías ────────────────────────────────────────────────────────────────

export async function listCategoriasService(tenantId: number) {
  const cats = await listCategorias(tenantId);
  return cats.map(serializeCategoria);
}

export async function createCategoriaService(tenantId: number, raw: unknown) {
  const data = raw as Record<string, unknown>;

  if (!data.nombre || String(data.nombre).trim() === '') {
    throw new ValidationError('El nombre de la categoría es requerido');
  }

  const input: CategoriaCreateInput = {
    nombre:      String(data.nombre).trim(),
    descripcion: data.descripcion ? String(data.descripcion).trim() : null,
    color:       data.color ? String(data.color) : '#0d9488',
  };

  const cat = await createCategoria(tenantId, input);
  return serializeCategoria(cat);
}

export async function updateCategoriaService(tenantId: number, id: number, raw: unknown) {
  const data = raw as Record<string, unknown>;

  const updateData: Partial<CategoriaCreateInput> = {};
  if (data.nombre      !== undefined) updateData.nombre      = String(data.nombre).trim();
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion ? String(data.descripcion).trim() : null;
  if (data.color       !== undefined) updateData.color       = String(data.color);

  const cat = await updateCategoria(id, tenantId, updateData);
  return serializeCategoria(cat);
}

export async function deleteCategoriaService(tenantId: number, id: number) {
  try {
    const result = await deleteCategoriaIfEmpty(id, tenantId);
    if (!result) throw new NotFoundError('Categoría');
    return { deleted: true };
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    if (err instanceof Error) throw new ValidationError(err.message);
    throw err;
  }
}

// ── Gastos ────────────────────────────────────────────────────────────────────

export async function listGastos(tenantId: number, query: Record<string, string> = {}) {
  const filters: GastoFilters = {};

  if (query.categoriaId) filters.categoriaId = Number(query.categoriaId);
  if (query.desde) filters.desde = new Date(query.desde);
  if (query.hasta) filters.hasta = new Date(query.hasta);
  if (query.page)  filters.page  = Number(query.page);
  if (query.limit) filters.limit = Number(query.limit);

  const { gastos, total } = await findAll(tenantId, filters);
  return { gastos: gastos.map(serializeGasto), total };
}

export async function createGastoService(tenantId: number, raw: unknown) {
  const data = raw as Record<string, unknown>;

  if (!data.descripcion || String(data.descripcion).trim() === '') {
    throw new ValidationError('La descripción es requerida');
  }
  if (!data.monto || Number(data.monto) <= 0) {
    throw new ValidationError('El monto debe ser mayor a 0');
  }
  if (!data.categoriaId) {
    throw new ValidationError('La categoría es requerida');
  }
  if (!data.fecha) {
    throw new ValidationError('La fecha es requerida');
  }

  const gasto = await create(tenantId, {
    categoriaId: Number(data.categoriaId),
    descripcion: String(data.descripcion).trim(),
    monto:       Number(data.monto),
    fecha:       new Date(String(data.fecha)),
    notas:       data.notas ? String(data.notas).trim() : null,
  });

  return serializeGasto(gasto);
}

export async function updateGastoService(tenantId: number, id: number, raw: unknown) {
  const data = raw as Record<string, unknown>;

  const existing = await findById(id, tenantId);
  if (!existing) throw new NotFoundError('Gasto');

  if (data.monto !== undefined && Number(data.monto) <= 0) {
    throw new ValidationError('El monto debe ser mayor a 0');
  }
  if (data.descripcion !== undefined && String(data.descripcion).trim() === '') {
    throw new ValidationError('La descripción no puede estar vacía');
  }

  const updateData: Parameters<typeof update>[2] = {};
  if (data.categoriaId !== undefined) updateData.categoriaId = Number(data.categoriaId);
  if (data.descripcion !== undefined) updateData.descripcion = String(data.descripcion).trim();
  if (data.monto       !== undefined) updateData.monto       = Number(data.monto);
  if (data.fecha       !== undefined) updateData.fecha       = new Date(String(data.fecha));
  if (data.notas       !== undefined) updateData.notas       = data.notas ? String(data.notas).trim() : null;

  const gasto = await update(id, tenantId, updateData);
  return serializeGasto(gasto);
}

export async function deleteGastoService(tenantId: number, id: number) {
  const existing = await findById(id, tenantId);
  if (!existing) throw new NotFoundError('Gasto');
  await deleteGasto(id, tenantId);
  return { deleted: true };
}

// ── Resumen y Stats ───────────────────────────────────────────────────────────

export async function resumenMesService(tenantId: number, mes: number, anio: number) {
  return resumenPorCategoria(tenantId, mes, anio);
}

export async function getStatsService(tenantId: number) {
  return getStats(tenantId);
}
