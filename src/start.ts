import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import { WorkspaceError } from '~/lib/workspace-error.server'

const safeErrors = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof WorkspaceError) throw new Error(error.message)
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('Check the submitted fields and try again.')
    }
    console.error('A JobFinder workspace request failed.')
    throw new Error('JobFinder could not complete the request. Try again.')
  }
})

export const startInstance = createStart(() => ({
  requestMiddleware: [createCsrfMiddleware({ filter: (context) => context.handlerType === 'serverFn' })],
  functionMiddleware: [safeErrors],
}))
