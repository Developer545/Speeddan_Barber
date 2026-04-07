import { prisma } from '@/lib/prisma'

/**
 * Obtiene y avanza el correlativo para un tipo DTE dado.
 * Usa transacción con upsert para evitar duplicados en concurrencia.
 *
 * tipoDte: "01" = Factura, "03" = CCF, "05" = NC, "interno" = número interno de venta
 * Formato numeroControl: DTE-01-0001-000000000000001 (15 dígitos)
 */
export async function getNextCorrelativo(
  tenantId: number,
  tipoDte: string
): Promise<{ siguiente: number; numeroControl: string }> {
  const anioFiscal = new Date().getFullYear()

  const correlativo = await prisma.$transaction(async (tx) => {
    // Upsert atómico: crea con siguiente=2 (primer uso devuelve 1) o incrementa en 1.
    // Una sola operación elimina la ventana de race condition del patrón upsert+update separado.
    const updated = await tx.barberCorrelativo.upsert({
      where: { tenantId_tipoDte_anioFiscal: { tenantId, tipoDte, anioFiscal } },
      create: { tenantId, tipoDte, anioFiscal, siguiente: 2 },
      update: { siguiente: { increment: 1 } },
    })
    // El número usado es el que había ANTES del increment (siguiente - 1)
    return updated.siguiente - 1
  })

  const numero = correlativo
  let numeroControl = ''

  if (tipoDte !== 'interno') {
    // Formato: DTE-01-0001-000000000000001
    const numStr = String(numero).padStart(15, '0')
    numeroControl = `DTE-${tipoDte}-0001-${numStr}`
  }

  return { siguiente: numero, numeroControl }
}
