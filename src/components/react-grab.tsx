import { useEffect } from 'react'

/**
 * React Grab, development only: hover any element and press ⌘C (Ctrl+C on
 * Windows/Linux) to copy it with its component stack and source location for a
 * coding agent.
 *
 * `import.meta.env.DEV` is replaced at build time, so production bundles drop
 * the dynamic import entirely.
 */
export function ReactGrab() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('react-grab')
    }
  }, [])

  return null
}
