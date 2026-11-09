import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForm } from '~/features/auth/auth-form'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.viewer.user) throw redirect({ to: '/workspace' })
  },
  component: Page,
})

function Page() {
  return <AuthForm signup={false} configured={Route.useRouteContext().viewer.configured} />
}
