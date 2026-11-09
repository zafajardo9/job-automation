/**
 * Theme persistence.
 *
 * The same storage key drives the inline script in `__root.tsx` (which applies
 * the theme before first paint) and the toggle button, so the two cannot drift.
 */
const storageKey = 'jobfinder-theme'

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${storageKey}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

function persist(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')

  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // Storage can be unavailable (private mode); the class still applies.
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  persist(isDark ? 'light' : 'dark')
}
