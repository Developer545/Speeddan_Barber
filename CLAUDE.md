# Speeddan Barbería ERP — Contexto para Claude

> **DIRECTIVAS DE SESIÓN**: NO explorar el proyecto al inicio. Este archivo + memoria persistente contienen todo el contexto necesario. Ir directo a la tarea del usuario. Usar agentes para búsquedas paralelas. Usar skills cuando apliquen (xlsx, pdf, commit, etc.). Leer solo los archivos que la tarea requiera.

## Proyecto
ERP web **multi-tenant SaaS** para gestión de barberías en El Salvador. Cada barbería = un `BarberTenant` identificado por `slug`.

## URLs y Credenciales
| Servicio | URL | Credenciales |
|----------|-----|-------------|
| ERP Producción | `speeddan-barberia.vercel.app/login` | slug: `speeddan-demo` |
| Demo Admin | — | `admin@speeddan.com` / `Admin@2026!` |
| Demo Barbero | — | `barber@speeddan.com` / `Barber@2026!` |
| Demo Cliente | — | `client@speeddan.com` / `Client@2026!` |
| Admin Licencias | `admin-licencias.vercel.app` | `admin` / `admin123` |
| GitHub | `github.com/Developer545/Speeddan_Barber.git` | — |

## Stack
| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI | Ant Design v6 + Tailwind CSS v4 + shadcn/ui |
| Charts | recharts 3 + FullCalendar 6 (citas) |
| Backend | Next.js API Routes + Prisma 7 + Neon PostgreSQL |
| Auth | JWT httpOnly cookies (`barber_token`) + jose + bcryptjs |
| State | @tanstack/react-query 5 + react-hook-form 7 + Zod 4 |
| Color primario | `#0d9488` (teal) |
| Deploy | Vercel auto-deploy desde `master` |

## Estructura
```
src/
  app/
    (auth)/login/               → Login por slug de tenant
    (dashboard)/                → Páginas protegidas (Server Components)
      dashboard/                  KPIs + recharts BarChart 7 días
      appointments/               FullCalendar + antd Table
      clients/                    CRUD clientes
      services/                   Catálogo servicios
      barbers/                    Perfiles + especialidades
      billing/                    Pagos + KPIs ingresos
      pos/                        Punto de venta (turnos + ventas + DTE)
      pos-documentos/             Visor DTEs generados
      pos-turnos/                 Gestión turnos caja
      inventario/                 Productos + Kardex
      compras/                    Órdenes de compra
      proveedores/                Proveedores
      cxp/                        Cuentas por pagar
      gastos/                     Gastos + categorías
      planilla/                   Nómina (ISSS/AFP/Renta/Aguinaldo)
      settings/                   Config tenant + tema
    api/                        → 60+ Route Handlers REST
    book/[slug]/                → Reservas públicas (sin auth)
  components/
    [modulo]/                   → Client Components (*Client.tsx)
    shared/                     → AntdProvider, KpiCards, PageHeader, ActionButtons
    ui/                         → shadcn/ui components
  modules/
    [modulo]/                   → service.ts + repository.ts (lógica negocio)
  lib/
    auth.ts                     → getCurrentUser(), verifyToken()
    prisma.ts                   → Singleton PrismaClient
    dte-viewer.ts               → Renderizado DTEs
    planilla-viewer.ts          → Renderizado planillas PDF
    errors.ts                   → Clases de error custom
    response.ts                 → Formato respuestas API
prisma/schema.prisma            → 771 líneas, 25+ modelos, prefijo barber_
```

## Modelos Prisma clave
| Modelo | Propósito |
|--------|-----------|
| `BarberTenant` | Multi-tenant, planes (TRIAL/BASIC/PRO/ENTERPRISE), flags módulos |
| `BarberUser` | Roles: OWNER/BARBER/CLIENT, email único por tenant |
| `BarberSession` | JWT refresh tokens |
| `Barber` + `BarberSchedule` | Perfiles + horarios por día |
| `BarberService` | Servicios (precio, duración, categoría) |
| `BarberAppointment` | Citas (6 estados) |
| `BarberTurno` | Turnos caja (ABIERTO/CERRADO) |
| `BarberVenta` + `BarberDetalleVenta` | Ventas POS + líneas detalle |
| `BarberCorrelativo` | Numeración DTE secuencial por tipo/año |
| `BarberProducto` + `BarberKardex` | Inventario + movimientos |
| `BarberCompra` + `BarberDetalleCompra` | Compras + detalle |
| `BarberPlanilla` + `BarberDetallePlanilla` | Nómina mensual |
| `BarberProveedor` | Proveedores |
| `BarberGasto` + `BarberCategoriaGasto` | Gastos |

## Convenciones (IMPORTANTE)
- Páginas dashboard = **Server Components** que pasan datos a `*Client.tsx`
- `AntdProvider` ya en layout — **NO** envolver con ConfigProvider de nuevo
- `transpilePackages` en `next.config.ts` incluye antd + todos `rc-*`
- KPIs siempre con `Row/Col/Card/Statistic` de antd
- Formularios: `react-hook-form` + antd `Select` con `showSearch`
- NO usar `SpeedDanTable.tsx` (legacy) — usar antd `Table` directo
- Tablas prefijadas `barber_` en BD para aislamiento multi-tenant

## Comandos
```bash
npm run dev            # desarrollo (puerto 3000)
npm run build          # prisma generate + next build
npm run db:seed        # seed demo (tenant speeddan-demo)
npm run db:studio      # Prisma Studio GUI
npm run db:migrate     # migrate dev
npm run db:deploy      # migrate deploy (producción)
```

## Patrón nuevo módulo
1. `src/modules/nombre/nombre.service.ts` + `nombre.repository.ts`
2. `src/app/api/nombre/route.ts` (GET + POST)
3. `src/app/(dashboard)/nombre/page.tsx` (Server Component)
4. `src/components/nombre/NombreClient.tsx` (Client Component)
5. Link en sidebar

## DTE (Facturación electrónica El Salvador)
- Tipos: Factura (01), CCF (03), Nota Crédito (05)
- Generados en POS, guardados como JSON en `BarberVenta.dteJson`
- Numeración secuencial: `BarberCorrelativo` por tipo + año
- Visor: `lib/dte-viewer.ts` + API `/api/pos/venta/[id]/dte`

## Planilla (Nómina salvadoreña)
- Deducciones: ISSS, AFP, Renta, INSAFORP
- Tipos pago barbero: FIJO/POR_DIA/POR_SEMANA/POR_HORA/POR_SERVICIO
- Cálculos: Aguinaldo, Quincena 25, Vacaciones
- Estados: BORRADOR → APROBADA → PAGADA

## Skills disponibles (.agents/skills/)
248 skills incluyendo: api-design, architecture-patterns, auth-implementation, nextjs-app-router-patterns, react-best-practices, neon-postgres, typescript-patterns, etc.

## Proyectos relacionados
- **Speeddansys ERP**: `C:\ProjectosDev\Speeddansys\` → `speeddansys.vercel.app`
- **DTE Online ERP**: `C:\ProjectosDev\Facturacion DTE online\` → `dte-speeddan.vercel.app`
- Panel `admin-licencias.vercel.app` valida suscripciones de esta app
