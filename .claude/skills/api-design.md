# API Design Principles — Next.js Route Handlers

## Route Handler Template
```ts
// src/app/api/[resource]/route.ts
import { type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ok, created, apiError } from '@/lib/response';
import { mySchema } from '@/modules/resource/resource.schema';
import { MyService } from '@/modules/resource/resource.service';

const service = new MyService();

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError(new Error('Unauthorized'), 401);
    const data = await service.getAll(user.tenantId);
    return ok(data);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError(new Error('Unauthorized'), 401);
    const body = await req.json();
    const parsed = mySchema.parse(body);   // Zod throws if invalid
    const result = await service.create(user.tenantId, parsed);
    return created(result);
  } catch (err) {
    return apiError(err);  // Zod errors auto-mapped to 422
  }
}
```

## Response Standards
```ts
// lib/response.ts helpers:
ok(data)                    → 200 { success: true, data }
created(data)               → 201 { success: true, data }
paginate(items, total, q)   → 200 { success: true, data: items, meta: { total, page, limit } }
apiError(err)               → maps AppError subclasses to correct HTTP code
  NotFoundError      → 404
  UnauthorizedError  → 401
  ForbiddenError     → 403
  ValidationError    → 422
  ConflictError      → 409
  TenantSuspendedError → 402
  generic Error      → 500
```

## Validation with Zod
```ts
// In resource.schema.ts:
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  barberId:  z.number().int().positive(),
  serviceId: z.number().int().positive(),
  startTime: z.string().datetime(),
  notes:     z.string().max(500).optional(),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
```

## Pagination Standard
All list endpoints MUST support pagination:
```
GET /api/appointments?page=1&limit=20&status=PENDING
```
Use `parsePagination(req)` from `@/lib/response` to extract page/limit.

## Security Rules
1. ALWAYS validate `tenantId` from JWT — never from request body
2. ALWAYS check resource belongs to tenant before returning/modifying
3. Public endpoints (tenant verify, booking widget) are the ONLY exceptions
4. Internal endpoints (provision) require `X-Internal-Key` header check

## Naming Conventions
```
GET    /api/appointments           → list (paginated)
GET    /api/appointments/[id]      → get one
POST   /api/appointments           → create
PATCH  /api/appointments/[id]      → update partial
DELETE /api/appointments/[id]      → soft delete (set deletedAt)
GET    /api/appointments/stats     → KPI/aggregates
POST   /api/appointments/[id]/cancel → state transition (not PATCH)
```

## Rate Limiting
Public booking endpoints must be rate limited. Use middleware for `/api/booking/*`.
Internally, the middleware in `src/middleware.ts` already protects all `/api/*` routes except explicitly public ones.
