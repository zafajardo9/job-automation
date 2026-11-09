import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace')({
  beforeLoad: ({ context }) => {
    if (!context.viewer.user) throw redirect({ to: '/login' })
  },
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  component: () => <div className="page-container space-y-8 py-10 sm:py-14"><Outlet /></div>,
})
