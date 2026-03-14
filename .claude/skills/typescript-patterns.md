# TypeScript Patterns — Speeddan Barbería

## Type Organization
```ts
// modules/appointments/appointments.types.ts
import type { BarberAppointment, Barber, BarberService, BarberUser } from '@prisma/client';

// Prisma includes (avoid Select — use Include for relations)
export type AppointmentWithRelations = BarberAppointment & {
  barber: Barber & { user: Pick<BarberUser, 'fullName' | 'avatarUrl'> };
  service: Pick<BarberService, 'name' | 'duration' | 'price'>;
  client: Pick<BarberUser, 'fullName' | 'phone'>;
};

// DTOs (input types from API) — derived from Zod
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;

// Response types (what the API returns to frontend)
export type AppointmentSummary = {
  id: number;
  clientName: string;
  barberName: string;
  serviceName: string;
  startTime: string;   // ISO string
  status: BarberAppointmentStatus;
  price: string;       // Decimal as string
};
```

## Prisma Decimal Handling
```ts
// Prisma Decimal → number for API responses
import { Decimal } from '@prisma/client/runtime/library';

function toNumber(d: Decimal): number {
  return d.toNumber();
}

// In service:
return {
  ...appointment,
  service: {
    ...appointment.service,
    price: appointment.service.price.toNumber(),
  }
};
```

## Readonly & Immutability
```ts
// Prefer readonly in function params and data objects
function processAppointments(
  appointments: readonly AppointmentWithRelations[]
): AppointmentSummary[] {
  return appointments.map(toSummary);
}

// Use Readonly<T> for config objects
const MODULES_BY_PLAN: Readonly<Record<string, Record<string, boolean>>> = {
  emprendedor: { appointments: true, billing: false },
  pro: { appointments: true, billing: true },
};
```

## Discriminated Unions for State
```ts
// Instead of boolean flags, use discriminated unions:
type TenantState =
  | { status: 'TRIAL';     trialEndsAt: Date }
  | { status: 'ACTIVE';    paidUntil: Date }
  | { status: 'SUSPENDED'; suspendedAt: Date }
  | { status: 'CANCELLED'; deletedAt: Date };

function isTenantActive(state: TenantState): boolean {
  return state.status === 'ACTIVE' || state.status === 'TRIAL';
}
```

## Generic Repository Pattern
```ts
// Optional: base interface for repositories
interface Repository<T, CreateDto, UpdateDto> {
  findById(id: number, tenantId: number): Promise<T | null>;
  findMany(tenantId: number, filters?: Record<string, unknown>): Promise<T[]>;
  create(tenantId: number, data: CreateDto): Promise<T>;
  update(id: number, tenantId: number, data: UpdateDto): Promise<T>;
  softDelete(id: number, tenantId: number): Promise<void>;
}
```

## Date Handling
```ts
// Always use date-fns for date manipulation
import { addDays, format, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Display format
format(appointment.startTime, 'EEEE d MMMM, HH:mm', { locale: es });
// → "lunes 14 marzo, 10:30"

// Never use new Date() for business logic — use date-fns
const trialEnd = addDays(tenant.createdAt, 14);
const isExpired = isBefore(trialEnd, new Date());
```

## Environment Variables Type Safety
```ts
// lib/env.ts
function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  jwtSecret:        requireEnv('JWT_SECRET'),
  databaseUrl:      requireEnv('DATABASE_URL'),
  internalApiKey:   requireEnv('INTERNAL_API_KEY'),
  nextPublicAppUrl: requireEnv('NEXT_PUBLIC_APP_URL'),
} as const;
```

## Avoid any — Use unknown
```ts
// ❌ BAD:
function handleError(err: any) { console.log(err.message); }

// ✅ GOOD:
function handleError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Error desconocido';
}
```
