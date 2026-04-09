/**
 * territorios.service.ts — CRUD de Departamentos y Municipios (CAT-012/013 MH)
 * Catálogos globales, sin tenantId.
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';

// ── Departamentos ─────────────────────────────────────────────────────────────

export async function listDepartamentos() {
  const deptos = await prisma.barberDepartamento.findMany({
    orderBy: { codigo: 'asc' },
    include: { _count: { select: { municipios: true } } },
  });
  return deptos.map(d => ({ ...d, totalMunicipios: d._count.municipios }));
}

export async function createDepartamento(raw: unknown) {
  const data = raw as Record<string, unknown>;
  if (!data.codigo || typeof data.codigo !== 'string' || !data.codigo.trim())
    throw new ValidationError('El código del departamento es obligatorio');
  if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim())
    throw new ValidationError('El nombre del departamento es obligatorio');

  const codigo = String(data.codigo).trim().padStart(2, '0');
  const nombre = String(data.nombre).trim();

  const exists = await prisma.barberDepartamento.findUnique({ where: { codigo } });
  if (exists) throw new ConflictError(`Ya existe un departamento con código ${codigo}`);

  return prisma.barberDepartamento.create({ data: { codigo, nombre } });
}

export async function updateDepartamento(id: number, raw: unknown) {
  const data = raw as Record<string, unknown>;
  const depto = await prisma.barberDepartamento.findUnique({ where: { id } });
  if (!depto) throw new NotFoundError('Departamento no encontrado');

  const nombre = data.nombre ? String(data.nombre).trim() : undefined;
  if (nombre !== undefined && !nombre) throw new ValidationError('El nombre no puede estar vacío');

  return prisma.barberDepartamento.update({ where: { id }, data: { ...(nombre && { nombre }) } });
}

export async function deleteDepartamento(id: number) {
  const depto = await prisma.barberDepartamento.findUnique({
    where: { id },
    include: { _count: { select: { municipios: true } } },
  });
  if (!depto) throw new NotFoundError('Departamento no encontrado');
  if (depto._count.municipios > 0)
    throw new ConflictError('No se puede eliminar un departamento que tiene municipios asociados');

  return prisma.barberDepartamento.delete({ where: { id } });
}

// ── Municipios ────────────────────────────────────────────────────────────────

export async function listMunicipios(departamentoCod?: string) {
  return prisma.barberMunicipio.findMany({
    where:   departamentoCod ? { departamentoCod } : undefined,
    orderBy: [{ departamentoCod: 'asc' }, { codigo: 'asc' }],
    include: { departamento: { select: { nombre: true } } },
  });
}

export async function createMunicipio(raw: unknown) {
  const data = raw as Record<string, unknown>;
  if (!data.codigo || typeof data.codigo !== 'string' || !data.codigo.trim())
    throw new ValidationError('El código del municipio es obligatorio');
  if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim())
    throw new ValidationError('El nombre del municipio es obligatorio');
  if (!data.departamentoCod || typeof data.departamentoCod !== 'string')
    throw new ValidationError('El departamento es obligatorio');

  const codigo         = String(data.codigo).trim().padStart(2, '0');
  const nombre         = String(data.nombre).trim();
  const departamentoCod = String(data.departamentoCod).trim();

  const depto = await prisma.barberDepartamento.findUnique({ where: { codigo: departamentoCod } });
  if (!depto) throw new NotFoundError('Departamento no encontrado');

  const exists = await prisma.barberMunicipio.findUnique({
    where: { departamentoCod_codigo: { departamentoCod, codigo } },
  });
  if (exists) throw new ConflictError(`Ya existe un municipio con código ${codigo} en ese departamento`);

  return prisma.barberMunicipio.create({
    data: { codigo, nombre, departamentoCod },
    include: { departamento: { select: { nombre: true } } },
  });
}

export async function updateMunicipio(id: number, raw: unknown) {
  const data = raw as Record<string, unknown>;
  const mun = await prisma.barberMunicipio.findUnique({ where: { id } });
  if (!mun) throw new NotFoundError('Municipio no encontrado');

  const nombre = data.nombre ? String(data.nombre).trim() : undefined;
  if (nombre !== undefined && !nombre) throw new ValidationError('El nombre no puede estar vacío');

  return prisma.barberMunicipio.update({
    where: { id },
    data:  { ...(nombre && { nombre }) },
    include: { departamento: { select: { nombre: true } } },
  });
}

export async function deleteMunicipio(id: number) {
  const mun = await prisma.barberMunicipio.findUnique({ where: { id } });
  if (!mun) throw new NotFoundError('Municipio no encontrado');
  return prisma.barberMunicipio.delete({ where: { id } });
}
