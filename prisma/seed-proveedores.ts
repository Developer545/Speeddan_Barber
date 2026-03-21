/**
 * seed-proveedores.ts — Agrega 10 proveedores realistas para barbería al tenant demo.
 * Ejecutar: npx tsx prisma/seed-proveedores.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

const proveedores = [
  {
    nombre:       'Distribuidora Belleza Total S.A. de C.V.',
    nit:          '0614-010190-001-5',
    nrc:          '123456-7',
    correo:       'ventas@bellezatotal.com.sv',
    telefono:     '+503 2250-1100',
    tipo:         'NACIONAL',
    contacto:     'Karla Mendoza (Vendedora)',
    plazoCredito: 30,
    direccion:    'Blvd. Los Héroes #45, Col. Miramonte, San Salvador',
  },
  {
    nombre:       'Wahl El Salvador (Representaciones Técnicas)',
    nit:          '0614-220305-102-3',
    nrc:          '234567-8',
    correo:       'pedidos@wahlelsal.com',
    telefono:     '+503 2260-3300',
    tipo:         'NACIONAL',
    contacto:     'Mario Herrera (Asesor técnico)',
    plazoCredito: 15,
    direccion:    'Calle Arce #221, Centro Comercial La Ceiba, San Salvador',
  },
  {
    nombre:       'Andis Company (Importación directa EE.UU.)',
    nit:          null,
    nrc:          null,
    correo:       'orders@andis.com',
    telefono:     '+1 262-884-2600',
    tipo:         'INTERNACIONAL',
    contacto:     'Customer Service',
    plazoCredito: 0,
    direccion:    '1800 Renaissance Blvd, Sturtevant, WI 53177, USA',
  },
  {
    nombre:       'Productos Pana S.A. (Navajas & Hojas)',
    nit:          '0614-150688-003-1',
    nrc:          '345678-9',
    correo:       'info@productospana.com.sv',
    telefono:     '+503 2221-4455',
    tipo:         'NACIONAL',
    contacto:     'Roberto Pana',
    plazoCredito: 30,
    direccion:    'Av. España #78, San Salvador',
  },
  {
    nombre:       'L\'Oréal Professionnel El Salvador',
    nit:          '0614-040595-101-8',
    nrc:          '456789-0',
    correo:       'pro@lorealprofesional.sv',
    telefono:     '+503 2243-7000',
    tipo:         'NACIONAL',
    contacto:     'Ana Patricia Molina (Rep. comercial)',
    plazoCredito: 45,
    direccion:    'World Trade Center, Torre I Piso 8, San Salvador',
  },
  {
    nombre:       'Insumos Quirúrgicos y Clínicos (IQC) — Esterilización',
    nit:          '0614-300701-005-4',
    nrc:          '567890-1',
    correo:       'ventas@iqc.com.sv',
    telefono:     '+503 2235-8822',
    tipo:         'NACIONAL',
    contacto:     'Licda. Sonia Rivas',
    plazoCredito: 15,
    direccion:    'Urbanización Madre Selva, Antiguo Cuscatlán, La Libertad',
  },
  {
    nombre:       'Textiles & Uniformes Profesionales (TUP)',
    nit:          '0614-120480-007-6',
    nrc:          '678901-2',
    correo:       'pedidos@tupuniformes.com.sv',
    telefono:     '+503 2246-1234',
    tipo:         'NACIONAL',
    contacto:     'Guillermo Acosta',
    plazoCredito: 30,
    direccion:    'Zona Industrial Santa Elena, Antiguo Cuscatlán',
  },
  {
    nombre:       'Muebles & Sillas Barber Pro (MexImport)',
    nit:          '0614-080975-009-2',
    nrc:          '789012-3',
    correo:       'ventas@barberpromx.com',
    telefono:     '+52 55-5555-1800',
    tipo:         'INTERNACIONAL',
    contacto:     'Ing. Carlos Vega',
    plazoCredito: 0,
    direccion:    'Av. Insurgentes Sur 1457, Ciudad de México, CDMX, México',
  },
  {
    nombre:       'Depot Cosméticos Mayorista S.A.',
    nit:          '0614-200292-011-9',
    nrc:          '890123-4',
    correo:       'mayoreo@depotcosmeticos.com.sv',
    telefono:     '+503 2252-6600',
    tipo:         'NACIONAL',
    contacto:     'Yessenia Portillo (Cuenta clave)',
    plazoCredito: 30,
    direccion:    'Mercado Central, Local 45-B, Santa Ana',
  },
  {
    nombre:       'Tijeras & Accesorios Barberos (TAB)',
    nit:          '0614-010185-013-7',
    nrc:          '901234-5',
    correo:       'info@tabaccesorios.com.sv',
    telefono:     '+503 2225-9988',
    tipo:         'NACIONAL',
    contacto:     'Don Ernesto Campos',
    plazoCredito: 0,
    direccion:    'Av. Independencia #344, San Salvador',
  },
]

async function main() {
  console.log('🌱  Iniciando seed de proveedores...\n')

  const tenant = await prisma.barberTenant.findUnique({ where: { slug: 'speeddan-demo' } })
  if (!tenant) {
    console.error('❌  Tenant "speeddan-demo" no encontrado. Ejecuta npm run db:seed primero.')
    process.exit(1)
  }
  console.log(`✅  Tenant: ${tenant.name} (ID ${tenant.id})\n`)

  console.log('🏭  Agregando proveedores...')

  let creados = 0
  let omitidos = 0

  for (const p of proveedores) {
    const existe = await prisma.barberProveedor.findFirst({
      where: { tenantId: tenant.id, nombre: p.nombre },
    })
    if (existe) {
      console.log(`    ↷  Ya existe: ${p.nombre}`)
      omitidos++
      continue
    }
    await prisma.barberProveedor.create({
      data: { tenantId: tenant.id, ...p, activo: true },
    })
    console.log(`    ✓ ${p.nombre}  (${p.tipo}, crédito: ${p.plazoCredito} días)`)
    creados++
  }

  const total = await prisma.barberProveedor.count({ where: { tenantId: tenant.id } })

  console.log('\n✅  Seed de proveedores completado!\n')
  console.log('═══════════════════════════════════════════')
  console.log(`  Proveedores creados:  ${creados}`)
  console.log(`  Omitidos (ya exist.): ${omitidos}`)
  console.log(`  Total en BD:          ${total}`)
  console.log('═══════════════════════════════════════════\n')
}

main()
  .catch(err => { console.error('❌ Seed falló:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
