import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { createTodo, deleteTodo, listTodos, toggleTodo } from '../services/todos'
import { UnauthorizedError, deleteUser } from '../services/users'
import { protectedProcedure, publicProcedure } from './base'

const todos = {
  list: protectedProcedure
    .route({ tags: ['Todos'], summary: 'List todos' })
    .handler(() => ({ success: true as const, todos: listTodos() })),

  create: protectedProcedure
    .route({ tags: ['Todos'], summary: 'Create todo' })
    .input(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, 'Todo text is required')
          .max(200, 'Todo text must be less than 200 characters'),
      }),
    )
    .handler(({ input }) => ({ success: true as const, todo: createTodo(input.text) })),

  toggle: protectedProcedure
    .route({ tags: ['Todos'], summary: 'Toggle todo' })
    .input(z.object({ id: z.string().min(1, 'Todo ID is required') }))
    .handler(({ input }) => {
      const todo = toggleTodo(input.id)
      if (!todo) throw new ORPCError('NOT_FOUND', { message: 'Todo not found' })
      return { success: true as const, todo }
    }),

  delete: protectedProcedure
    .route({ tags: ['Todos'], summary: 'Delete todo' })
    .input(z.object({ id: z.string().min(1, 'Todo ID is required') }))
    .handler(({ input }) => {
      const deleted = deleteTodo(input.id)
      if (!deleted) throw new ORPCError('NOT_FOUND', { message: 'Todo not found' })
      return { success: true as const }
    }),
}

const users = {
  delete: protectedProcedure
    .route({ tags: ['Users'], summary: 'Delete user' })
    .input(z.object({ userId: z.string().min(1, 'User ID is required') }))
    .handler(async ({ input, context }) => {
      try {
        await deleteUser(context.session.user.id, input.userId)
        return { success: true as const }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' })
        }
        throw error
      }
    }),
}

const serverInfo = publicProcedure
  .route({ tags: ['Server'], summary: 'Get server info' })
  .handler(({ context }) => ({
    serverTime: new Date().toISOString(),
    userAgent: context.headers.get('user-agent') ?? 'Unknown',
    isAuthenticated: !!context.session?.user,
    userName: context.session?.user?.name ?? null,
  }))

export const router = { todos, users, serverInfo }

export type AppRouter = typeof router
