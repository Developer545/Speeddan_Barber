/**
 * /inventario — Módulo de Productos e Inventario
 * Server Component: carga inicial en paralelo y pasa datos al Client Component.
 */

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  listProductos,
  listCategorias,
  getResumenInventario,
  getKardexGeneral,
} from '@/modules/productos/productos.service';
import InventarioClient from '@/components/inventario/InventarioClient';

export default async function InventarioPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'OWNER') redirect('/dashboard');

  const [productosResult, categorias, resumen, kardexResult] = await Promise.all([
    listProductos(user.tenantId, { limit: '100' }),
    listCategorias(user.tenantId),
    getResumenInventario(user.tenantId),
    getKardexGeneral(user.tenantId, { limit: '50' }),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'hsl(var(--text-primary))',
          margin: '0 0 4px',
        }}>
          Inventario
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', margin: 0, fontSize: 14 }}>
          Gestión de productos, stock y movimientos de inventario
        </p>
      </div>

      <InventarioClient
        initialProductos={productosResult.items}
        initialCategorias={categorias}
        initialResumen={resumen}
        initialKardex={kardexResult.items}
        initialKardexTotal={kardexResult.total}
      />
    </div>
  );
}
