---
description: Backend layered architecture, oRPC procedure patterns, Zod validation, and API design
alwaysApply: true
---

# Backend Architecture & API Design

## Layered Architecture

Procedure -> Service -> Query -> Database

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Procedure | `apps/api/src/orpc/router.ts` | Input validation, auth, shape output |
| Service | `apps/api/src/services/` | Business logic, orchestration |
| Query | `apps/api/src/db/queries/` | Drizzle calls |

Keep Drizzle imports in the query layer only. Procedures call services, never queries directly.

## oRPC Procedure Pattern

The API is a plain object of oRPC procedures (`apps/api/src/orpc/router.ts`). Auth is a middleware baked into the procedure builders in `orpc/base.ts`:

- `publicProcedure` — session may be null.
- `protectedProcedure` — throws `ORPCError('UNAUTHORIZED')` when there is no user; `context.session` is non-null inside the handler.

All inputs validate with Zod via `.input()`:

```typescript
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { createResource } from '../services/resources'
import { protectedProcedure } from './base'

export const router = {
  resources: {
    create: protectedProcedure
      .route({ tags: ['Resources'], summary: 'Create resource' }) // OpenAPI metadata
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .handler(async ({ input, context }) => {
        return { success: true as const, resource: await createResource(context.session.user.id, input) }
      }),
  },
}
```

- The handler receives validated `input` and the typed `context`.
- Throw `ORPCError('CODE', { message })` for errors (`UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, ...) — do not return error objects. oRPC maps codes to HTTP status.
- `.route()` is optional and only feeds the generated OpenAPI spec.

## Naming

- Group procedures by resource: `todos.list`, `todos.create`, `users.delete`.
- Verbs are fine on procedures (`list`, `create`, `toggle`) — they are RPC calls, not REST paths.
- Nest the router object to mirror domains; keep it shallow (2-3 levels).

## Errors

Use `ORPCError` codes; common ones map as:
- `UNAUTHORIZED` -> 401, `FORBIDDEN` -> 403, `NOT_FOUND` -> 404
- `CONFLICT` -> 409 (duplicate resource)
- `INTERNAL_SERVER_ERROR` -> 500

```typescript
throw new ORPCError('NOT_FOUND', { message: 'Clear, actionable message' })
```

## Router Organization

Split the router object by sub-resource, not file size. Cohesion > line count. For large APIs, define each domain's procedures in its own module and compose them into the root `router` object in `orpc/router.ts`.

## Security

- Auth middleware for authenticated endpoints
- 401 for unauthenticated, 403 for forbidden
- Validate resource ownership before updates/deletes
- Never log secrets or tokens
