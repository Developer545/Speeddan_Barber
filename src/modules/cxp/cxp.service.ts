/**
 * cxp.service.ts — Lógica de negocio para Cuentas por Pagar.
 * Delega al repositorio y aplica validaciones de negocio.
 */

import { ValidationError, NotFoundError } from '@/lib/errors';
import {
  findAll,
  findById,
  resumen,
  registrarPago,
} from './cxp.repository';

const VALID_METODOS = ['CASH', 'CARD', 'TRANSFER', 'QR'] as const;

// ── Listado ───────────────────────────────────────────────────────────────────

export async function listCxP(tenantId: number) {
  return findAll(tenantId);
}

// ── Resumen KPIs ──────────────────────────────────────────────────────────────

export async function getResumen(tenantId: number) {
  return resumen(tenantId);
}

// ── Pago ──────────────────────────────────────────────────────────────────────

export async function pagarCxP(tenantId: number, compraId: number, raw: unknown) {
  const data = raw as Record<string, unknown>;

  if (!data.monto || Number(data.monto) <= 0) {
    throw new ValidationError('El monto debe ser mayor a 0');
  }
  if (!data.metodoPago || !VALID_METODOS.includes(data.metodoPago as typeof VALID_METODOS[number])) {
    throw new ValidationError('Método de pago inválido (CASH | CARD | TRANSFER | QR)');
  }

  // Verificar que la compra existe y calcular el saldo actual
  const compra = await findById(compraId, tenantId);
  if (!compra) throw new NotFoundError('Compra');

  if (Number(data.monto) > compra.saldo + 0.009) {
    throw new ValidationError(`El monto ($${Number(data.monto).toFixed(2)}) supera el saldo pendiente ($${compra.saldo.toFixed(2)})`);
  }

  const pago = await registrarPago(tenantId, {
    compraId,
    monto:      Number(data.monto),
    metodoPago: String(data.metodoPago),
    referencia: data.referencia ? String(data.referencia) : null,
    notas:      data.notas      ? String(data.notas)      : null,
    fecha:      data.fecha      ? new Date(String(data.fecha)) : new Date(),
  });

  if (!pago) throw new NotFoundError('Compra');
  return pago;
}
