import {
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AuthGuard } from '@shared/components/auth-guard'
import { DashboardLayout } from '@shared/components/layout/dashboard-layout'
import { AuthPage } from '@/pages/auth'
import { SettingsPage } from '@/pages/settings'
import { WorkflowPage } from '@/pages/workflow'

const rootRoute = createRootRoute({
  component: Outlet,
})

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
})

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: () => (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
})

const workflowRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/workflow',
  component: WorkflowPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/settings',
  component: SettingsPage,
})

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: () => <Navigate to="/workflow" />,
})

const routeTree = rootRoute.addChildren([
  authRoute,
  authenticatedRoute.addChildren([workflowRoute, settingsRoute]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
