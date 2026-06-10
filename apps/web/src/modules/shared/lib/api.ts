import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppRouter } from '@repo/api'

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
  fetch: (request, init) => fetch(request, { ...init, credentials: 'include' }),
})

/** Typed oRPC client — call procedures directly, e.g. `client.todos.list()`. */
export const client: RouterClient<AppRouter> = createORPCClient(link)

/**
 * TanStack Query utils. Each procedure exposes `.queryOptions()`,
 * `.mutationOptions()`, and `.key()` for cache invalidation.
 */
export const orpc = createTanstackQueryUtils(client)
