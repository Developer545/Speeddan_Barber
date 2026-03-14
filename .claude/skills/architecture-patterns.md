# Architecture Patterns — Modular Monolith + Screaming Architecture

## Folder Structure (Screaming Architecture)
```
src/
  modules/
    appointments/
      appointments.repository.ts   ← Prisma ONLY (no business logic)
      appointments.service.ts      ← Business logic ONLY (no HTTP, no Prisma)
      appointments.schema.ts       ← Zod validation schemas
      appointments.types.ts        ← TypeScript types/interfaces
    barbers/
      barbers.repository.ts
      barbers.service.ts
      barbers.schema.ts
    tenants/
    auth/
    services/    ← barber services (haircuts, etc.)
    payments/
    reviews/
  app/
    api/
      appointments/route.ts        ← HTTP ONLY (call service, return response)
    (dashboard)/
    (auth)/
  components/
    ui/          ← reusable primitives (Button, Input, Card)
    layout/      ← DashboardSidebar, Header, etc.
    [feature]/   ← feature-specific components
  lib/
    prisma.ts    ← singleton
    auth.ts      ← JWT helpers
    errors.ts    ← typed error classes
    response.ts  ← API response helpers
```

## Layer Rules (NEVER violate)
- **repository.ts**: ONLY Prisma queries. No business logic, no HTTP, no validation
- **service.ts**: ONLY business logic. Calls repository, throws AppError subclasses. No HTTP, no Prisma directly
- **route.ts**: ONLY HTTP. Parses request, calls service, returns NextResponse. No Prisma, no business logic
- **Max 150 lines per file** — if a file exceeds this, split it

## Dependency Direction
```
route.ts → service.ts → repository.ts → prisma.ts
```
NEVER import a route from a service, or a service from a repository.

## Multi-Tenant Pattern
- ALL database queries MUST include `tenantId` filter
- tenantId comes from JWT payload via `getCurrentUser()` in lib/auth.ts
- Never trust tenantId from request body — always from JWT
- Pattern:
```ts
// In service:
async getAppointments(tenantId: number, filters: FilterDto) {
  return this.repo.findMany({ tenantId, ...filters });
}
// In route:
const user = await getCurrentUser();  // from JWT cookie
const data = await service.getAppointments(user!.tenantId, filters);
```

## Error Handling Pattern
```ts
// service throws typed errors:
if (!barber) throw new NotFoundError('Barbero no encontrado');
if (conflict) throw new ConflictError('Horario no disponible');

// route catches:
try {
  const result = await service.createAppointment(data);
  return created(result);
} catch (err) {
  return apiError(err);  // apiError maps AppError subclasses to correct HTTP codes
}
```

## Component Pattern
- Server Components by default — pass data as props
- "use client" only when needed (forms, interactive UI)
- Never fetch data in Client Components with useEffect
- Co-locate component with its route if used only there
