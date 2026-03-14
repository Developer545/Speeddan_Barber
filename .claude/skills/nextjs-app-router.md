# Next.js 15 App Router Patterns

## Server vs Client Components
- Server Components by default — zero JS sent to browser
- Add "use client" ONLY for: hooks, browser events, useState, useEffect, browser APIs
- Fetch data in Server Components, pass as props to Client Components
- Never use useEffect to fetch data — use async Server Components

## File Conventions
- page.tsx = route UI (server component by default)
- layout.tsx = persistent UI wrapper
- loading.tsx = automatic Suspense boundary
- error.tsx = error boundary
- route.ts = API endpoint (export GET, POST, PUT, PATCH, DELETE)
- middleware.ts = Edge runtime request interceptor

## Routing
- Route groups: (auth), (dashboard) — group routes without affecting URL
- Dynamic segments: [slug]/page.tsx
- Catch-all: [...slug]/page.tsx
- Use next/navigation: useRouter, usePathname, redirect, notFound
- NEVER use next/router (Pages Router API)

## Data Fetching
- async function Page() { const data = await fetchData(); return <UI data={data} /> }
- Use React cache() to deduplicate requests across components
- Revalidation: fetch(url, { next: { revalidate: 60 } })

## API Routes (route.ts)
- Export named functions: export async function GET(req: NextRequest) {}
- Always wrap in try/catch and return apiError(err) on failure
- Use NextRequest for request, NextResponse for response
- Validate body with Zod before processing
