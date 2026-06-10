# Simple Boilerplate

Hono host + oRPC API + React SPA + Drizzle ORM + Better Auth + TanStack Router in a single deployable container.

## Stack

- **API**: oRPC procedures mounted on Hono, typed end-to-end (`@orpc/server`)
- **Frontend**: React + TanStack Router + TanStack Query (`@orpc/tanstack-query`)
- **Auth**: Better Auth (own Hono handler)
- **Database**: Drizzle ORM + Postgres
- **Styling**: Tailwind CSS + Radix UI

## oRPC

The API defines a router of procedures and exports its type (`AppRouter`). The frontend builds a typed client from that type with zero codegen, plus first-class TanStack Query helpers. Unlike Hono's `hc`, oRPC derives types from each procedure's input/output schema, so inference stays fast as the router grows.

```ts
// API (apps/api/src/orpc/router.ts)
export const router = {
  todos: {
    list: protectedProcedure.handler(() => ({ success: true, todos: listTodos() })),
    create: protectedProcedure.input(z.object({ text: z.string() })).handler(/* ... */),
  },
}
export type AppRouter = typeof router

// Frontend (apps/web/src/modules/shared/lib/api.ts)
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { RouterClient } from '@orpc/server'
import type { AppRouter } from '@repo/api'

const link = new RPCLink({ url: `${window.location.origin}/api/rpc`, fetch: /* credentials */ })
export const client: RouterClient<AppRouter> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(client)

// Usage — direct call
const { todos } = await client.todos.list()

// Usage — TanStack Query
const { data } = useQuery(orpc.todos.list.queryOptions())
const create = useMutation(orpc.todos.create.mutationOptions())
create.mutate({ text: 'ship it' })
queryClient.invalidateQueries({ queryKey: orpc.todos.list.key() })
```

The RPC handler is mounted on Hono at `/api/rpc/*`; Better Auth keeps its own handler at `/api/auth/*`. OpenAPI docs are generated from the same router and served at `/api/docs`.

## Project Structure

```
apps/
  api/          oRPC router + procedures, auth, db, config (on Hono)
  web/          React SPA (TanStack Router, TanStack Query)
server.ts       Production entry point (serves API + static SPA)
```

## Local Development

```bash
cp .env.example .env
# Fill in your .env values

pnpm install
pnpm dev
```

## Deploy

`git push origin main` builds and deploys automatically.

GitHub Actions builds a Docker image, pushes to GHCR, and hits a webhook to redeploy your app.

### 1. Push to GitHub

Create a repo and push this project.

### 2. Add Postgres to your PaaS

In Coolify/Dokploy, create a new Postgres database. Copy the connection string.

### 3. Create the app in your PaaS

Create a new **Docker Compose** project and paste this:

```yaml
services:
  app:
    image: ghcr.io/<your-username>/<repo-name>:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@host:5432/dbname
      - BETTER_AUTH_SECRET=generate-a-random-string-at-least-32-chars
      - APP_URL=https://yourdomain.com
```

Replace the values:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string from step 2 |
| `BETTER_AUTH_SECRET` | Random string, 32+ chars (run `openssl rand -hex 32`) |
| `APP_URL` | Your production URL, e.g. `https://app.yourdomain.com` |

Then point your domain to the app and expose port `3000`.

### 4. Add GHCR registry

Your image is on GitHub Container Registry (private). In your PaaS, add a Docker registry:

- **URL**: `ghcr.io`
- **Username**: your GitHub username
- **Password**: a GitHub PAT with `read:packages` scope

### 5. Push GitHub secrets

```bash
cp .env.example .env
# Fill in DEPLOY_WEBHOOK_URL (copy the webhook URL from your PaaS)
./scripts/setup-secrets.sh
```

### 6. Deploy

```bash
git push origin main
```

Every push to `main` builds, pushes to GHCR, and triggers a redeploy. That's it.

### Push DB changes

```bash
pnpm db:push
```

This uses `drizzle-kit push` to sync your schema directly to the database. No migrations.
