import { OpenAPIGenerator } from '@orpc/openapi'
import { RPCHandler } from '@orpc/server/fetch'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth'
import { config } from './config'
import { router } from './orpc/router'
import { authRoutes } from './routes/auth'

interface OpenAPISchema {
  paths?: Record<string, unknown>
  components?: {
    schemas?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

// Typed RPC handler — the frontend talks to this via the oRPC client.
const rpcHandler = new RPCHandler(router)

// OpenAPI spec generated from the same router (docs only).
const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

const app = new Hono()
  .basePath('/api')
  .use(
    '*',
    cors({
      origin: config.APP_URL,
      credentials: true,
    }),
  )
  .use('*', async (c, next) => {
    await next()
    console.log(`[HONO] ${c.req.method} ${c.req.path} -> ${c.res.status}`)
  })
  // Better Auth keeps its own Hono handler.
  .route('/', authRoutes)
  // oRPC RPC endpoint — prefix matches the basePath + mount path.
  .use('/rpc/*', async (c, next) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: '/api/rpc',
      context: { headers: c.req.raw.headers },
    })
    if (matched) return c.newResponse(response.body, response)
    await next()
  })

app.get('/app-openapi', async (c) => {
  const spec = await openAPIGenerator.generate(router, {
    info: { title: 'API', version: '1.0.0' },
    servers: [{ url: config.APP_URL, description: 'API server' }],
  })
  return c.json(spec)
})

app.get('/openapi', async (c) => {
  const authSchema = (await auth.api.generateOpenAPISchema()) as OpenAPISchema
  const appResponse = await Promise.resolve(app.request('/api/app-openapi'))
  const appSchema = (await appResponse.json()) as OpenAPISchema

  const mergedSchema = {
    ...appSchema,
    paths: {
      ...appSchema.paths,
      ...authSchema.paths,
    },
    components: {
      ...(appSchema.components ?? {}),
      schemas: {
        ...(appSchema.components?.schemas ?? {}),
        ...(authSchema.components?.schemas ?? {}),
      },
    },
  }

  return c.json(mergedSchema)
})

app.get(
  '/docs',
  Scalar({
    theme: 'saturn',
    url: '/api/openapi',
  }),
)

export { app }
export { router } from './orpc/router'
export type { AppRouter } from './orpc/router'
