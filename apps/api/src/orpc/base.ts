import { os, ORPCError } from '@orpc/server'
import { auth } from '../auth'

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

/**
 * Request-scoped context. `headers` is injected when the RPC handler runs
 * (see app.ts) so procedures can resolve the Better Auth session.
 */
export interface ORPCContext {
  headers: Headers
}

const base = os.$context<ORPCContext>()

/**
 * Resolves the Better Auth session once and adds it to context.
 * Replaces the old Hono `optionalAuth` middleware.
 */
const withSession = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers })
  return next({ context: { session: session ?? null } })
})

/** Public procedure — session may be null. */
export const publicProcedure = base.use(withSession)

/** Protected procedure — throws UNAUTHORIZED when there is no user. */
export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' })
  }
  return next({ context: { session: context.session as NonNullable<AuthSession> } })
})
